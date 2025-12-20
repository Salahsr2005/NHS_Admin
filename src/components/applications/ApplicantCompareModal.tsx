"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Star, Mail, Phone, FileText, X, Minus } from "lucide-react"
import { getRandomAvatar } from "@/components/applicants/ApplicantCard"
import { cn, getPersonDisplayName, getPersonInitials } from "@/lib/utils"

interface Application {
  id: string
  status: string
  applied_at: string
  cv_url: string | null
  cover_letter: string | null
  job: { id: string; title: string; location: string } | null
  applicant: {
    id: string
    full_name: string
    email: string
    phone: string | null
    gender: string | null
    wilaya: string | null
    age: number | null
    avatar_url: string | null
    rating: number | null
    skills: any
    education: any
    experience: any
  } | null
}

interface ApplicantCompareModalProps {
  open: boolean
  onClose: () => void
  applications: Application[]
  onRemove: (id: string) => void
}

export function ApplicantCompareModal({ open, onClose, applications, onRemove }: ApplicantCompareModalProps) {
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
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn("h-4 w-4", i < (rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")}
          />
        ))}
      </div>
    )
  }

  const CompareRow = ({
    label,
    values,
    renderValue,
    highlight = false,
  }: {
    label: string
    values: any[]
    renderValue?: (v: any) => React.ReactNode
    highlight?: boolean
  }) => {
    const defaultRender = (v: any) => v ?? <Minus className="h-4 w-4 text-muted-foreground" />
    const render = renderValue || defaultRender

    return (
      <div
        className={cn("grid gap-4 py-3 border-b border-border/50", highlight && "bg-primary/5")}
        style={{ gridTemplateColumns: `140px repeat(${values.length}, 1fr)` }}
      >
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        {values.map((v, i) => (
          <div key={i} className="text-sm text-foreground">
            {render(v)}
          </div>
        ))}
      </div>
    )
  }

  if (applications.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">Compare Applicants</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6 pt-4">
            {/* Applicant Headers */}
            <div
              className="grid gap-4 mb-6"
              style={{ gridTemplateColumns: `140px repeat(${applications.length}, 1fr)` }}
            >
              <div />
              {applications.map((app) => (
                <div key={app.id} className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
                    onClick={() => onRemove(app.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/20 border border-border/50">
                    <Avatar className="h-16 w-16 mb-3 ring-2 ring-background shadow-lg">
                      <AvatarImage
                        src={
                          app.applicant?.avatar_url ||
                          getRandomAvatar(app.applicant?.gender || null, app.applicant?.id || "")
                        }
                      />
                      <AvatarFallback className="bg-primary/20 text-lg font-bold">
                        {getPersonInitials(app.applicant)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-foreground">{getPersonDisplayName(app.applicant)}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{app.job?.title}</p>
                    <Badge variant="outline" className="mt-2 capitalize text-xs">
                      {app.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison Rows */}
            <div className="space-y-0">
              <CompareRow
                label="Rating"
                values={applications.map((a) => a.applicant?.rating)}
                renderValue={(v) => renderRating(v)}
                highlight
              />
              <CompareRow
                label="Age"
                values={applications.map((a) => a.applicant?.age)}
                renderValue={(v) => (v ? `${v} years` : <Minus className="h-4 w-4 text-muted-foreground" />)}
              />
              <CompareRow
                label="Gender"
                values={applications.map((a) => a.applicant?.gender)}
                renderValue={(v) =>
                  v ? <span className="capitalize">{v}</span> : <Minus className="h-4 w-4 text-muted-foreground" />
                }
              />
              <CompareRow label="Location" values={applications.map((a) => a.applicant?.wilaya)} />
              <CompareRow
                label="Email"
                values={applications.map((a) => a.applicant?.email)}
                renderValue={(v) => (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{v}</span>
                  </span>
                )}
              />
              <CompareRow
                label="Phone"
                values={applications.map((a) => a.applicant?.phone)}
                renderValue={(v) =>
                  v ? (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {v}
                    </span>
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )
                }
              />
              <CompareRow
                label="Skills"
                values={applications.map((a) => parseSkills(a.applicant?.skills))}
                renderValue={(skills: string[]) => (
                  <div className="flex flex-wrap gap-1">
                    {skills.length > 0 ? (
                      skills.slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    {skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{skills.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
                highlight
              />
              <CompareRow
                label="Education"
                values={applications.map((a) => a.applicant?.education)}
                renderValue={(edu: any[]) => (
                  <div className="space-y-1">
                    {edu?.length > 0 ? (
                      edu.slice(0, 2).map((e, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-medium">{e.degree}</span>
                          <span className="text-muted-foreground"> • {e.school}</span>
                        </div>
                      ))
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                )}
              />
              <CompareRow
                label="Experience"
                values={applications.map((a) => a.applicant?.experience)}
                renderValue={(exp: any[]) => (
                  <div className="space-y-1">
                    {exp?.length > 0 ? (
                      exp.slice(0, 2).map((e, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-medium">{e.title}</span>
                          <span className="text-muted-foreground"> at {e.company}</span>
                        </div>
                      ))
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                )}
                highlight
              />
              <CompareRow
                label="CV"
                values={applications.map((a) => a.cv_url)}
                renderValue={(url) =>
                  url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs bg-transparent"
                      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      View CV
                    </Button>
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )
                }
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
