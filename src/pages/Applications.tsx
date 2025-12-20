"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import type { ApplicationStatus } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/common/EmptyState"
import { CardSkeleton } from "@/components/common/Skeleton"
import { ApplicationFilters, type ApplicationFiltersState } from "@/components/applications/ApplicationFilters"
import { ApplicationCard } from "@/components/applications/ApplicationCard"
import { ApplicantCompareModal } from "@/components/applications/ApplicantCompareModal"
import { InterviewCalendar } from "@/components/recruitment/InterviewCalendar"
import { getRandomAvatar } from "@/components/applicants/ApplicantCard"
import {
  FileText,
  Download,
  Mail,
  Phone,
  MapPin,
  Star,
  Briefcase,
  GraduationCap,
  GitCompare,
  LayoutGrid,
  List,
  Users,
  CalendarDays,
} from "lucide-react"
import { cn, getPersonDisplayName, getPersonInitials } from "@/lib/utils"

const statusTabs: { value: ApplicationStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "accepted", label: "Accepted" },
]

const statusOptions: ApplicationStatus[] = ["pending", "reviewing", "shortlisted", "rejected", "accepted"]

export default function Applications() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<ApplicationStatus | "all">("all")
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "calendar">("grid")
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [filters, setFilters] = useState<ApplicationFiltersState>({
    search: "",
    jobId: null,
    gender: null,
    wilaya: null,
    minRating: 0,
    maxAge: null,
    minAge: null,
    dateFrom: null,
    dateTo: null,
  })

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          job:jobs(id, title, location),
          applicant:applicants(*)
        `)
        .order("applied_at", { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: jobs } = useQuery({
    queryKey: ["jobs-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("id, title").order("title")
      if (error) throw error
      return data || []
    },
  })

  const { data: interviewSchedule } = useQuery({
    queryKey: ["interview-schedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          interview_date,
          job:jobs(id, title, location),
          applicant:applicants(id, full_name, email, avatar_url, gender)
        `)
        .not("interview_date", "is", null)
        .order("interview_date", { ascending: true })

      if (error) throw error
      return data
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { data, error } = await supabase.rpc("update_application_status", {
        application_id_param: id,
        new_status: status,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      queryClient.invalidateQueries({ queryKey: ["recent-applications"] })
      toast({
        title: "Status Updated",
        description: `Application marked as ${status}.`,
      })
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  // Get unique wilayas for filter
  const wilayas = useMemo(() => {
    if (!applications) return []
    const uniqueWilayas = new Set<string>()
    applications.forEach((app) => {
      if (app.applicant?.wilaya) {
        uniqueWilayas.add(app.applicant.wilaya)
      }
    })
    return Array.from(uniqueWilayas).sort()
  }, [applications])

  // Filter applications
  const filteredApplications = useMemo(() => {
    if (!applications) return []

    return applications.filter((app) => {
      // Status filter
      if (activeTab !== "all" && app.status !== activeTab) return false

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesName = getPersonDisplayName(app.applicant).toLowerCase().includes(searchLower)
        const matchesEmail = app.applicant?.email?.toLowerCase().includes(searchLower)
        const matchesJob = app.job?.title?.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesEmail && !matchesJob) return false
      }

      // Job filter
      if (filters.jobId && app.job?.id !== filters.jobId) return false

      // Gender filter
      if (filters.gender && app.applicant?.gender !== filters.gender) return false

      // Wilaya filter
      if (filters.wilaya && app.applicant?.wilaya !== filters.wilaya) return false

      // Rating filter
      if (filters.minRating > 0 && (!app.applicant?.rating || app.applicant.rating < filters.minRating)) return false

      // Age filters
      if (filters.minAge && (!app.applicant?.age || app.applicant.age < filters.minAge)) return false
      if (filters.maxAge && (!app.applicant?.age || app.applicant.age > filters.maxAge)) return false

      // Date filters
      if (filters.dateFrom && new Date(app.applied_at) < new Date(filters.dateFrom)) return false
      if (filters.dateTo && new Date(app.applied_at) > new Date(filters.dateTo)) return false

      return true
    })
  }, [applications, activeTab, filters])

  const handleStatusUpdate = (id: string, status: ApplicationStatus) => {
    updateStatusMutation.mutate({ id, status })
  }

  const toggleCompareSelection = (id: string, checked: boolean) => {
    if (checked && selectedForCompare.length < 4) {
      setSelectedForCompare([...selectedForCompare, id])
    } else if (!checked) {
      setSelectedForCompare(selectedForCompare.filter((s) => s !== id))
    } else {
      toast({
        title: "Maximum reached",
        description: "You can compare up to 4 applicants at a time.",
        variant: "destructive",
      })
    }
  }

  const compareApplications = useMemo(() => {
    if (!applications) return []
    return applications.filter((app) => selectedForCompare.includes(app.id))
  }, [applications, selectedForCompare])

  const parseSkills = (skills: any): string[] => {
    if (!skills) return []
    if (Array.isArray(skills)) return skills
    if (typeof skills === "string") {
      try {
        return JSON.parse(skills)
      } catch {
        return []
      }
    }
    return []
  }

  const renderRating = (rating: number | null) => {
    if (!rating) return null
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review and manage job applications</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Compare Button */}
          {selectedForCompare.length >= 2 && (
            <Button
              onClick={() => setShowCompareModal(true)}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80"
            >
              <GitCompare className="h-4 w-4" />
              Compare ({selectedForCompare.length})
            </Button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border/50 bg-secondary/30 p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 px-3", viewMode === "grid" && "bg-background shadow-sm")}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 px-3", viewMode === "list" && "bg-background shadow-sm")}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 px-3", viewMode === "calendar" && "bg-background shadow-sm")}
              onClick={() => setViewMode("calendar")}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ApplicationFilters filters={filters} onFiltersChange={setFilters} jobs={jobs || []} wilayas={wilayas} />

      {/* Selection Info */}
      {selectedForCompare.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
          <span className="text-sm text-foreground">
            <Users className="inline h-4 w-4 mr-2" />
            {selectedForCompare.length} applicant{selectedForCompare.length > 1 ? "s" : ""} selected for comparison
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedForCompare([])}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ApplicationStatus | "all")}>
        <TabsList className="w-full justify-start overflow-x-auto bg-secondary/30 p-1">
          {statusTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="capitalize data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {tab.label}
              {applications && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs bg-muted">
                  {tab.value === "all"
                    ? applications.length
                    : applications.filter((a) => a.status === tab.value).length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {viewMode === "calendar" ? (
            <InterviewCalendar
              interviews={interviewSchedule || []}
              onInterviewClick={(interview) => {
                const app = applications?.find((a) => a.id === interview.id)
                if (app) setSelectedApplication(app)
              }}
            />
          ) : isLoading ? (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1",
              )}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : !filteredApplications || filteredApplications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No applications found"
              description={
                filters.search || filters.jobId || filters.gender
                  ? "Try adjusting your filters."
                  : activeTab === "all"
                    ? "No applications have been submitted yet."
                    : `No ${activeTab} applications.`
              }
            />
          ) : (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1",
              )}
            >
              {filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  isSelected={selectedForCompare.includes(app.id)}
                  onSelect={(checked) => toggleCompareSelection(app.id, checked)}
                  onView={() => setSelectedApplication(app)}
                  onStatusChange={(status) => handleStatusUpdate(app.id, status as ApplicationStatus)}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Compare Modal */}
      <ApplicantCompareModal
        open={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        applications={compareApplications}
        onRemove={(id) => setSelectedForCompare(selectedForCompare.filter((s) => s !== id))}
      />

      {/* Application Detail Modal */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-background shadow-lg">
                  <AvatarImage
                    src={
                      selectedApplication.applicant?.avatar_url ||
                      getRandomAvatar(selectedApplication.applicant?.gender, selectedApplication.applicant?.id) ||
                      "/placeholder.svg" ||
                      "/placeholder.svg"
                    }
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary text-lg font-medium">
                    {getPersonInitials(selectedApplication.applicant)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedApplication.applicant?.full_name || getPersonDisplayName(selectedApplication.applicant)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Applied for {selectedApplication.job?.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedApplication.applicant?.gender && (
                      <Badge variant="outline" className="capitalize">
                        {selectedApplication.applicant.gender}
                      </Badge>
                    )}
                    {selectedApplication.applicant?.age && (
                      <Badge variant="outline">{selectedApplication.applicant.age} yrs</Badge>
                    )}
                    {selectedApplication.applicant?.rating && (
                      <div className="flex items-center gap-1">
                        {renderRating(selectedApplication.applicant.rating)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">Status:</span>
                <Select
                  value={selectedApplication.status}
                  onValueChange={(value) => handleStatusUpdate(selectedApplication.id, value as ApplicationStatus)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedApplication.applicant?.email}</span>
                </div>
                {selectedApplication.applicant?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedApplication.applicant.phone}</span>
                  </div>
                )}
                {selectedApplication.applicant?.wilaya && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedApplication.applicant.wilaya}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {parseSkills(selectedApplication.applicant?.skills).length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {parseSkills(selectedApplication.applicant?.skills).map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {selectedApplication.applicant?.education &&
                Array.isArray(selectedApplication.applicant.education) &&
                selectedApplication.applicant.education.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Education
                    </h4>
                    <div className="space-y-2">
                      {selectedApplication.applicant.education.map((edu: any, i: number) => (
                        <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                          <p className="font-medium text-foreground">{edu.degree}</p>
                          <p className="text-sm text-muted-foreground">
                            {edu.school} • {edu.year}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Experience */}
              {selectedApplication.applicant?.experience?.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Experience
                  </h4>
                  <div className="space-y-2">
                    {selectedApplication.applicant.experience.map((exp: any, i: number) => (
                      <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                        <p className="font-medium text-foreground">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {exp.company} • {exp.duration}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">Cover Letter</h4>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <p className="whitespace-pre-wrap text-sm text-foreground">{selectedApplication.cover_letter}</p>
                  </div>
                </div>
              )}

              {/* CV Download */}
              {selectedApplication.cv_url && (
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => window.open(selectedApplication.cv_url, "_blank", "noopener,noreferrer")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  View CV
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
