"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Save,
  X,
  Edit,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  Star,
  FileText,
  Upload,
  Trash2,
  Plus,
  GraduationCap,
  Briefcase,
  Award,
  Download,
} from "lucide-react"
import { toast } from "sonner"
import { cn, getPersonDisplayName, getPersonInitials } from "@/lib/utils"
import { getRandomAvatar } from "@/components/applicants/ApplicantCard"
import { format } from "date-fns"
import { EmptyState } from "@/components/common/EmptyState"

// Algerian Wilayas
const WILAYAS = [
  "Adrar",
  "Chlef",
  "Laghouat",
  "Oum El Bouaghi",
  "Batna",
  "Béjaïa",
  "Biskra",
  "Béchar",
  "Blida",
  "Bouira",
  "Tamanrasset",
  "Tébessa",
  "Tlemcen",
  "Tiaret",
  "Tizi Ouzou",
  "Alger",
  "Djelfa",
  "Jijel",
  "Sétif",
  "Saïda",
  "Skikda",
  "Sidi Bel Abbès",
  "Annaba",
  "Guelma",
  "Constantine",
  "Médéa",
  "Mostaganem",
  "M'Sila",
  "Mascara",
  "Ouargla",
  "Oran",
  "El Bayadh",
  "Illizi",
  "Bordj Bou Arréridj",
  "Boumerdès",
  "El Tarf",
  "Tindouf",
  "Tissemsilt",
  "El Oued",
  "Khenchela",
  "Souk Ahras",
  "Tipaza",
  "Mila",
  "Aïn Defla",
  "Naâma",
  "Aïn Témouchent",
  "Ghardaïa",
  "Relizane",
  "Timimoun",
  "Bordj Badji Mokhtar",
  "Ouled Djellal",
  "Béni Abbès",
  "In Salah",
  "In Guezzam",
  "Touggourt",
  "Djanet",
  "El M'Ghair",
  "El Meniaa",
]

interface EducationItem {
  degree: string
  school: string
  year: string
}

interface ExperienceItem {
  title: string
  company: string
  duration: string
}

export default function ApplicantProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [uploadingCV, setUploadingCV] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
    wilaya: "",
    age: "",
    skills: "",
    education: [] as EducationItem[],
    experience: [] as ExperienceItem[],
  })

  // Fetch applicant data
  const { data: applicant, isLoading } = useQuery({
    queryKey: ["applicant-profile", id],
    queryFn: async () => {
      if (!id) throw new Error("No applicant ID provided")
      const { data, error } = await supabase.from("applicants").select("*").eq("id", id).maybeSingle()
      if (error) throw error
      if (!data) throw new Error("Applicant not found")

      // Initialize form data
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        gender: data.gender || "",
        wilaya: data.wilaya || "",
        age: data.age?.toString() || "",
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
        education: Array.isArray(data.education) ? data.education : [],
        experience: Array.isArray(data.experience) ? data.experience : [],
      })

      return data
    },
    enabled: !!id,
  })

  // Fetch applications for this applicant
  const { data: applications } = useQuery({
    queryKey: ["applicant-applications", id],
    queryFn: async () => {
      if (!id) return []
      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(*)")
        .eq("applicant_id", id)
        .order("applied_at", { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!id,
  })

  // Update applicant mutation
  const updateApplicantMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("applicants").update(data).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicant-profile", id] })
      queryClient.invalidateQueries({ queryKey: ["applicants"] })
      toast.success("Profile updated successfully")
      setIsEditing(false)
    },
    onError: () => {
      toast.error("Failed to update profile")
    },
  })

  // Update rating mutation
  const updateRatingMutation = useMutation({
    mutationFn: async (rating: number) => {
      const { error } = await supabase.from("applicants").update({ rating }).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicant-profile", id] })
      toast.success("Rating updated successfully")
    },
    onError: () => {
      toast.error("Failed to update rating")
    },
  })

  const handleSave = () => {
    // Parse skills
    const skillsArray = formData.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    updateApplicantMutation.mutate({
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone || null,
      address: formData.address || null,
      gender: formData.gender || null,
      wilaya: formData.wilaya || null,
      age: formData.age ? Number.parseInt(formData.age) : null,
      skills: skillsArray,
      education: formData.education,
      experience: formData.experience,
      updated_at: new Date().toISOString(),
    })
  }

  const handleCancel = () => {
    if (applicant) {
      setFormData({
        first_name: applicant.first_name || "",
        last_name: applicant.last_name || "",
        email: applicant.email || "",
        phone: applicant.phone || "",
        address: applicant.address || "",
        gender: applicant.gender || "",
        wilaya: applicant.wilaya || "",
        age: applicant.age?.toString() || "",
        skills: Array.isArray(applicant.skills) ? applicant.skills.join(", ") : "",
        education: Array.isArray(applicant.education) ? applicant.education : [],
        experience: Array.isArray(applicant.experience) ? applicant.experience : [],
      })
    }
    setIsEditing(false)
  }

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !id) return

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setUploadingCV(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${id}-${Date.now()}.${fileExt}`
      const filePath = `cvs/${fileName}`

      const { error: uploadError } = await supabase.storage.from("applicant-files").upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("applicant-files").getPublicUrl(filePath)

      // Update the most recent application or create a placeholder
      const latestApp = applications?.[0]
      if (latestApp) {
        const { error } = await supabase.from("applications").update({ cv_url: publicUrl }).eq("id", latestApp.id)
        if (error) throw error
      }

      queryClient.invalidateQueries({ queryKey: ["applicant-applications", id] })
      toast.success("CV uploaded successfully")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload CV")
    } finally {
      setUploadingCV(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !id) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPG, PNG, or WebP)")
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB")
      return
    }

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("applicant-files").upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("applicant-files").getPublicUrl(filePath)

      const { error } = await supabase.from("applicants").update({ avatar_url: publicUrl }).eq("id", id)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ["applicant-profile", id] })
      toast.success("Avatar updated successfully")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload avatar")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDeleteCV = async (cvUrl: string, applicationId: string) => {
    try {
      const { error } = await supabase.from("applications").update({ cv_url: null }).eq("id", applicationId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ["applicant-applications", id] })
      toast.success("CV removed successfully")
    } catch (error) {
      toast.error("Failed to remove CV")
    }
  }

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { degree: "", school: "", year: "" }],
    })
  }

  const removeEducation = (index: number) => {
    setFormData({
      ...formData,
      education: formData.education.filter((_, i) => i !== index),
    })
  }

  const updateEducation = (index: number, field: keyof EducationItem, value: string) => {
    const updated = [...formData.education]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, education: updated })
  }

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, { title: "", company: "", duration: "" }],
    })
  }

  const removeExperience = (index: number) => {
    setFormData({
      ...formData,
      experience: formData.experience.filter((_, i) => i !== index),
    })
  }

  const updateExperience = (index: number, field: keyof ExperienceItem, value: string) => {
    const updated = [...formData.experience]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, experience: updated })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!applicant) {
    return (
      <EmptyState
        icon={User}
        title="Candidate not found"
        description="The candidate you're looking for doesn't exist."
        actionLabel="Back to Candidates"
        onAction={() => navigate("/applicants")}
      />
    )
  }

  const avatarUrl = applicant.avatar_url || getRandomAvatar(applicant.gender, applicant.id)
  const latestCV = applications?.find((app) => app.cv_url)?.cv_url

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/applicants")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Candidate Profile</h1>
            <p className="text-sm text-muted-foreground">View and manage candidate information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateApplicantMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <Avatar className="h-32 w-32 ring-4 ring-background shadow-lg">
                    <AvatarImage src={avatarUrl || "/placeholder.svg"} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary text-3xl font-bold">
                      {getPersonInitials(applicant)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload className="h-6 w-6 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  )}
                  {applicant.gender && (
                    <div
                      className={cn(
                        "absolute -bottom-2 -right-2 h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold shadow-md",
                        applicant.gender === "female"
                          ? "bg-pink-500/20 text-pink-600 border-2 border-pink-500/30"
                          : "bg-blue-500/20 text-blue-600 border-2 border-blue-500/30",
                      )}
                    >
                      {applicant.gender === "female" ? "♀" : "♂"}
                    </div>
                  )}
                </div>

                <h2 className="mt-4 text-2xl font-bold text-foreground">{getPersonDisplayName(applicant)}</h2>

                {applicant.age && <p className="text-sm text-muted-foreground mt-1">{applicant.age} years old</p>}

                {/* Star Rating */}
                <div className="flex justify-center gap-1 mt-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => updateRatingMutation.mutate(i + 1)}
                      disabled={updateRatingMutation.isPending}
                      className="focus:outline-none transition-transform hover:scale-125 disabled:opacity-50"
                    >
                      <Star
                        className={cn(
                          "h-6 w-6 transition-all duration-200",
                          i < (applicant.rating || 0)
                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                            : "text-muted-foreground/30 hover:text-amber-400/50",
                        )}
                      />
                    </button>
                  ))}
                </div>

                <div className="mt-2 text-sm font-medium text-muted-foreground">
                  {applicant.rating ? `${applicant.rating}/5 Rating` : "Not rated yet"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Applications</span>
                <Badge variant="secondary">{applications?.length || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-sm font-medium">{format(new Date(applicant.created_at), "MMM yyyy")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm font-medium">{format(new Date(applicant.updated_at), "MMM d, yyyy")}</span>
              </div>
            </CardContent>
          </Card>

          {/* CV Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                CV/Resume
              </CardTitle>
              <CardDescription>Upload and manage candidate's CV</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestCV ? (
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Current CV</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(latestCV, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          const app = applications?.find((a) => a.cv_url)
                          if (app) handleDeleteCV(latestCV, app.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">No CV uploaded yet</div>
              )}

              {isEditing && (
                <label className="block">
                  <Button variant="outline" className="w-full bg-transparent" disabled={uploadingCV} asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingCV ? "Uploading..." : latestCV ? "Replace CV" : "Upload CV"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleCVUpload}
                    disabled={uploadingCV}
                  />
                </label>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{applicant.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{applicant.last_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{applicant.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-sm font-medium">{applicant.phone || "Not provided"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  {isEditing ? (
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium capitalize">{applicant.gender || "Not specified"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Age
                  </Label>
                  {isEditing ? (
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      max="65"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Enter age"
                    />
                  ) : (
                    <p className="text-sm font-medium">{applicant.age || "Not provided"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wilaya" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Wilaya
                  </Label>
                  {isEditing ? (
                    <Select
                      value={formData.wilaya}
                      onValueChange={(value) => setFormData({ ...formData, wilaya: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select wilaya" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {WILAYAS.map((wilaya) => (
                          <SelectItem key={wilaya} value={wilaya}>
                            {wilaya}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium">{applicant.wilaya || "Not provided"}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter full address"
                    rows={2}
                  />
                ) : (
                  <p className="text-sm font-medium">{applicant.address || "Not provided"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Skills
              </CardTitle>
              <CardDescription>
                {isEditing ? "Comma-separated list of skills" : "Technical and soft skills"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="e.g., JavaScript, React, Node.js, Communication"
                  rows={3}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(applicant.skills) ? applicant.skills : []).length > 0 ? (
                    (applicant.skills as string[]).map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills added yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Education
                  </CardTitle>
                  <CardDescription>Academic background and qualifications</CardDescription>
                </div>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={addEducation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                formData.education.length > 0 ? (
                  formData.education.map((edu, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Education #{index + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeEducation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        <Input
                          placeholder="Degree (e.g., Bachelor's in Computer Science)"
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, "degree", e.target.value)}
                        />
                        <Input
                          placeholder="School/University"
                          value={edu.school}
                          onChange={(e) => updateEducation(index, "school", e.target.value)}
                        />
                        <Input
                          placeholder="Year (e.g., 2015-2019)"
                          value={edu.year}
                          onChange={(e) => updateEducation(index, "year", e.target.value)}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No education added. Click "Add" to include education history.
                  </p>
                )
              ) : Array.isArray(applicant.education) && applicant.education.length > 0 ? (
                applicant.education.map((edu: EducationItem, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground">{edu.degree}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{edu.school}</p>
                    <p className="text-xs text-muted-foreground mt-1">{edu.year}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No education history available</p>
              )}
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Work Experience
                  </CardTitle>
                  <CardDescription>Professional work history</CardDescription>
                </div>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={addExperience}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                formData.experience.length > 0 ? (
                  formData.experience.map((exp, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Experience #{index + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeExperience(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        <Input
                          placeholder="Job Title (e.g., Senior Developer)"
                          value={exp.title}
                          onChange={(e) => updateExperience(index, "title", e.target.value)}
                        />
                        <Input
                          placeholder="Company Name"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, "company", e.target.value)}
                        />
                        <Input
                          placeholder="Duration (e.g., 2020-2023)"
                          value={exp.duration}
                          onChange={(e) => updateExperience(index, "duration", e.target.value)}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No experience added. Click "Add" to include work history.
                  </p>
                )
              ) : Array.isArray(applicant.experience) && applicant.experience.length > 0 ? (
                applicant.experience.map((exp: ExperienceItem, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground">{exp.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{exp.company}</p>
                    <p className="text-xs text-muted-foreground mt-1">{exp.duration}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No work experience available</p>
              )}
            </CardContent>
          </Card>

          {/* Applications History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application History
              </CardTitle>
              <CardDescription>All job applications from this candidate</CardDescription>
            </CardHeader>
            <CardContent>
              {applications && applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map((app: any) => (
                    <div
                      key={app.id}
                      className="p-4 border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/applications/${app.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{app.jobs?.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Applied on {format(new Date(app.applied_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge
                          variant={
                            app.status === "accepted"
                              ? "default"
                              : app.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="capitalize"
                        >
                          {app.status}
                        </Badge>
                      </div>
                      {app.cv_url && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          CV Attached
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No applications yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
