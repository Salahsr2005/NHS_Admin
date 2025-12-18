"use client"

import { useState } from "react"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { format, isSameDay } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { getPersonDisplayName, getPersonInitials } from "@/lib/utils"
import { getRandomAvatar } from "@/components/applicants/ApplicantCard"

interface InterviewSchedule {
  id: string
  applicant: {
    id: number
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
    gender?: string
  }
  job: {
    id: number
    title: string
    location?: string
  }
  interview_date: string
  status: string
}

interface InterviewCalendarProps {
  interviews: InterviewSchedule[]
  onInterviewClick?: (interview: InterviewSchedule) => void
}

export function InterviewCalendar({ interviews, onInterviewClick }: InterviewCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Get dates that have interviews
  const interviewDates = useMemo(() => {
    return interviews
      .filter((interview) => interview.interview_date)
      .map((interview) => new Date(interview.interview_date))
  }, [interviews])

  // Get interviews for selected date
  const selectedDateInterviews = useMemo(() => {
    if (!selectedDate) return []
    return interviews.filter((interview) => {
      if (!interview.interview_date) return false
      return isSameDay(new Date(interview.interview_date), selectedDate)
    })
  }, [interviews, selectedDate])

  // Get upcoming interviews (next 7 days)
  const upcomingInterviews = useMemo(() => {
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return interviews
      .filter((interview) => {
        if (!interview.interview_date) return false
        const interviewDate = new Date(interview.interview_date)
        return interviewDate >= now && interviewDate <= sevenDaysLater
      })
      .sort((a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime())
  }, [interviews])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Interview Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              interview: interviewDates,
            }}
            modifiersClassNames={{
              interview: "bg-primary/10 font-semibold text-primary",
            }}
          />

          {/* Selected Date Interviews */}
          {selectedDate && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h3>
              {selectedDateInterviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No interviews scheduled for this date.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateInterviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => onInterviewClick?.(interview)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            interview.applicant.avatar_url ||
                            getRandomAvatar(interview.applicant.gender, interview.applicant.id) ||
                            "/placeholder.svg"
                          }
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary">
                          {getPersonInitials(interview.applicant)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getPersonDisplayName(interview.applicant)}</p>
                        <p className="text-xs text-muted-foreground truncate">{interview.job.title}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(interview.interview_date), "h:mm a")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Interviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Interviews</CardTitle>
          <p className="text-xs text-muted-foreground">Next 7 days</p>
        </CardHeader>
        <CardContent>
          {upcomingInterviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming interviews scheduled.</p>
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.map((interview) => (
                <Button
                  key={interview.id}
                  variant="outline"
                  className="w-full h-auto p-3 flex flex-col items-start gap-2 hover:bg-secondary/50 bg-transparent"
                  onClick={() => onInterviewClick?.(interview)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          interview.applicant.avatar_url ||
                          getRandomAvatar(interview.applicant.gender, interview.applicant.id) ||
                          "/placeholder.svg"
                        }
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary text-xs">
                        {getPersonInitials(interview.applicant)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{getPersonDisplayName(interview.applicant)}</p>
                      <p className="text-xs text-muted-foreground truncate">{interview.job.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(interview.interview_date), "MMM d")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(interview.interview_date), "h:mm a")}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
