"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { getRandomAvatar } from "@/components/applicants/ApplicantCard"
import { RecruitmentTimeline } from "@/components/recruitment/RecruitmentTimeline"
import { StageApplied } from "@/components/recruitment/StageApplied"
import { StageScreening } from "@/components/recruitment/StageScreening"
import { StageInterview } from "@/components/recruitment/StageInterview"
import { StageOffer } from "@/components/recruitment/StageOffer"
import { StageDecision } from "@/components/recruitment/StageDecision"
import {
  type RecruitmentStage,
  type OfferStatus,
  type ApplicationWithRecruitment,
  statusToStage,
  stageToStatus,
} from "@/types/recruitment"
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, GraduationCap, FileText, ExternalLink, User } from "lucide-react"

export default function AdminApplicationDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [activeStage, setActiveStage] = useState<RecruitmentStage>("pending")
  const [hrNotes, setHrNotes] = useState("")
  const [testStageNotes, setTestStageNotes] = useState("")
  const [interviewDate, setInterviewDate] = useState<Date | undefined>()
  const [interviewNotes, setInterviewNotes] = useState("")
  const [technicalScore, setTechnicalScore] = useState(5)
  const [proposedSalary, setProposedSalary] = useState("")
  const [offerStatus, setOfferStatus] = useState<OfferStatus | null>(null)
  const [finalNotes, setFinalNotes] = useState("")

  const { data: application, isLoading } = useQuery({
    queryKey: ["application-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          applicant_id,
          job_id,
          status,
          applied_at,
          updated_at,
          cv_url,
          cover_letter,
          hr_notes,
          test_stage_notes,
          interview_date,
          interview_notes,
          technical_score,
          proposed_salary,
          offer_status,
          final_notes,
          jobs (id, title, location),
          applicants (*)
        `)
        .eq("id", id)
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error("Application not found")

      return {
        ...data,
        job: data.jobs,
        applicant: data.applicants,
      } as unknown as ApplicationWithRecruitment
    },
    enabled: !!id,
  })

  useEffect(() => {
    if (application) {
      const dbStage = statusToStage(application.status)
      setActiveStage(dbStage)
      setHrNotes(application.hr_notes || "")
      setTestStageNotes(application.test_stage_notes || "")
      setInterviewDate(application.interview_date ? new Date(application.interview_date) : undefined)
      setInterviewNotes(application.interview_notes || "")
      setTechnicalScore(application.technical_score || 5)
      setProposedSalary(application.proposed_salary || "")
      setOfferStatus((application.offer_status as OfferStatus) || null)
      setFinalNotes(application.final_notes || "")
    }
  }, [application])

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase.from("applications").update(updates).eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", id] })
      queryClient.invalidateQueries({ queryKey: ["applications"] })
      queryClient.invalidateQueries({ queryKey: ["interview-schedule"] })
      toast({ title: "Success", description: "Application updated successfully." })
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  const saveStageNotes = (stage: RecruitmentStage, notes: string) => {
    const updates: Record<string, any> = {}

    switch (stage) {
      case "applied":
        updates.hr_notes = notes
        break
      case "test_stage":
        updates.test_stage_notes = notes
        break
      case "interview":
        updates.interview_notes = notes
        break
      case "decision":
        updates.final_notes = notes
        break
    }

    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates)
    }
  }

  const advanceToStage = (nextStage: RecruitmentStage, additionalUpdates: Record<string, any> = {}) => {
    const updates: Record<string, any> = {
      status: stageToStatus(nextStage),
      ...additionalUpdates,
    }

    updateMutation.mutate(updates)
  }

  const handleReject = (stage: RecruitmentStage) => {
    saveStageNotes(stage, stage === "test_stage" ? testStageNotes : stage === "interview" ? interviewNotes : finalNotes)
    updateMutation.mutate({
      status: "rejected",
    })
  }

  const handleHire = () => {
    saveStageNotes("decision", finalNotes)
    updateMutation.mutate({
      status: "accepted",
    })
  }

  const parseEducation = (education: any): string => {
    if (!education || !Array.isArray(education) || education.length === 0) return "Not specified"
    const latest = education[0]
    return (
      `${latest.degree || ""} ${latest.school ? `at ${latest.school}` : ""} ${latest.year ? `(${latest.year})` : ""}`.trim() ||
      "Not specified"
    )
  }

  const currentStage = statusToStage(application?.status || "pending")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Application not found</p>
        <Button variant="link" onClick={() => navigate("/applications")}>
          Back to Applications
        </Button>
      </div>
    )
  }

  const applicant = application.applicant
  const avatarUrl = applicant?.avatar_url || getRandomAvatar(applicant?.gender, applicant?.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/applications")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Application Details</h1>
          <p className="text-sm text-muted-foreground">
            {application.job?.title} • Applied {format(new Date(application.applied_at), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Applicant Profile */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary text-lg font-medium">
                  {applicant?.first_name?.slice(0, 1).toUpperCase()}
                  {applicant?.last_name?.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {applicant?.first_name} {applicant?.last_name}
                </CardTitle>
                <Badge variant="outline" className="mt-1">
                  {application.status}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Separator />

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{applicant?.email}</span>
              </div>
              {applicant?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{applicant.phone}</span>
                </div>
              )}
              {applicant?.wilaya && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{applicant.wilaya}</span>
                </div>
              )}
              {applicant?.gender && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">
                    {applicant.gender}
                    {applicant.age ? `, ${applicant.age} years` : ""}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Education */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Education</span>
              </div>
              <p className="text-sm text-muted-foreground">{parseEducation(applicant?.education)}</p>
            </div>

            {/* Experience */}
            {applicant?.experience && Array.isArray(applicant.experience) && applicant.experience.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Experience</span>
                  </div>
                  <div className="space-y-2">
                    {applicant.experience.slice(0, 3).map((exp: any, i: number) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium">{exp.title}</p>
                        <p className="text-muted-foreground">
                          {exp.company} • {exp.duration}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* CV Link */}
            {application.cv_url && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                  onClick={() => window.open(application.cv_url!, "_blank")}
                >
                  <FileText className="h-4 w-4" />
                  View CV
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Recruitment Timeline & Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recruitment Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Timeline Stepper */}
            <RecruitmentTimeline currentStage={currentStage} activeStage={activeStage} onStageClick={setActiveStage} />

            <Separator />

            {/* Stage Content */}
            <div className="min-h-[300px]">
              {activeStage === "applied" && (
                <StageApplied
                  appliedAt={application.applied_at}
                  hrNotes={hrNotes}
                  onHrNotesChange={setHrNotes}
                  onSave={() => saveStageNotes("applied", hrNotes)}
                  onAdvance={() => {
                    saveStageNotes("applied", hrNotes)
                    advanceToStage("test_stage")
                  }}
                  isSaving={updateMutation.isPending}
                />
              )}

              {activeStage === "test_stage" && (
                <StageScreening
                  screeningNotes={testStageNotes}
                  onScreeningNotesChange={setTestStageNotes}
                  onPassToInterview={() => {
                    saveStageNotes("test_stage", testStageNotes)
                    advanceToStage("interview")
                  }}
                  onReject={() => handleReject("test_stage")}
                  isSaving={updateMutation.isPending}
                />
              )}

              {activeStage === "interview" && (
                <StageInterview
                  interviewDate={interviewDate}
                  onInterviewDateChange={(date) => {
                    setInterviewDate(date)
                    if (date) {
                      updateMutation.mutate({ interview_date: date.toISOString() })
                    }
                  }}
                  interviewNotes={interviewNotes}
                  onInterviewNotesChange={setInterviewNotes}
                  technicalScore={technicalScore}
                  onTechnicalScoreChange={(score) => {
                    setTechnicalScore(score)
                    updateMutation.mutate({ technical_score: score })
                  }}
                  onMoveToOffer={() => {
                    saveStageNotes("interview", interviewNotes)
                    advanceToStage("offer")
                  }}
                  onReject={() => handleReject("interview")}
                  isSaving={updateMutation.isPending}
                />
              )}

              {activeStage === "offer" && (
                <StageOffer
                  proposedSalary={proposedSalary}
                  onProposedSalaryChange={(salary) => {
                    setProposedSalary(salary)
                    updateMutation.mutate({ proposed_salary: salary })
                  }}
                  offerStatus={offerStatus}
                  onOfferStatusChange={(status) => {
                    setOfferStatus(status)
                    updateMutation.mutate({ offer_status: status })
                  }}
                  onMoveToDecision={() => {
                    advanceToStage("decision")
                  }}
                  onReject={() => handleReject("offer")}
                  isSaving={updateMutation.isPending}
                />
              )}

              {activeStage === "decision" && (
                <StageDecision
                  finalNotes={finalNotes}
                  onFinalNotesChange={setFinalNotes}
                  finalDecision={
                    application.status === "accepted" ? "hired" : application.status === "rejected" ? "rejected" : null
                  }
                  onHire={handleHire}
                  onReject={() => handleReject("decision")}
                  isSaving={updateMutation.isPending}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
