"use client"

import type React from "react"
import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn, getPersonDisplayName, getPersonInitials } from "@/lib/utils"
import { getRandomAvatar } from "@/components/applicants/ApplicantCard"
import { EmptyState } from "@/components/common/EmptyState"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
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
  Clock,
  ExternalLink,
  Loader2
} from "lucide-react"

// Types
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

const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", 
  "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Algiers", 
  "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", 
  "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran"
]

export default function ApplicantProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // UI States
  const [isEditing, setIsEditing] = useState(false)
  const [uploadingCV, setUploadingCV] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Form State
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

  // --- QUERIES ---

  const { data: applicant, isLoading } = useQuery({
    queryKey: ["applicant-profile", id],
    queryFn: async () => {
      if (!id) throw new Error("No applicant ID provided")
      const { data, error } = await supabase.from("applicants").select("*").eq("id", id).maybeSingle()
      if (error) throw error
      if (!data) throw new Error("Applicant not found")

      // Initialize form
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

  // --- MUTATIONS ---

  const updateApplicantMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("applicants").update(data).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicant-profile", id] })
      toast.success("Profile updated successfully")
      setIsEditing(false)
    },
    onError: () => {
      toast.error("Failed to update profile")
    },
  })

  const updateRatingMutation = useMutation({
    mutationFn: async (rating: number) => {
      const { error } = await supabase.from("applicants").update({ rating }).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicant-profile", id] })
      toast.success("Rating updated")
    },
  })

  // --- HANDLERS ---

  const handleSave = () => {
    const skillsArray = formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
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

  // --- ROBUST FILE UPLOAD HANDLERS ---

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !id) return

    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setUploadingCV(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from("cvs")
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from("cvs").getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from("applicants")
        .update({ cv_url: publicUrl })
        .eq("id", id)

      if (dbError) throw dbError

      queryClient.invalidateQueries({ queryKey: ["applicant-profile", id] })
      toast.success("CV uploaded successfully")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to upload CV")
    } finally {
      setUploadingCV(false)
      if (event.target) event.target.value = ""
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !id) return

    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      toast.error("Please upload a valid image under 2MB")
      return
    }

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("applicant-files").upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from("applicant-files").getPublicUrl(filePath)
      
      await supabase.from("applicants").update({ avatar_url: publicUrl }).eq("id", id)

      queryClient.invalidateQueries({ queryKey: ["applicant-profile", id] })
      toast.success("Avatar updated")
    } catch (error) {
      toast.error("Failed to upload avatar")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDeleteCV = async () => {
    // Determine the CV URL to delete
    const cvUrlToDelete = applicant?.cv_url || applications?.find((app) => app.cv_url)?.cv_url
    if (!cvUrlToDelete) return

    try {
      if (applicant?.cv_url === cvUrlToDelete) {
        await supabase.from("applicants").update({ cv_url: null }).eq("id", id)
      } else {
        // Fallback for older data where CV might be on the application
        const app = applications?.find(a => a.cv_url === cvUrlToDelete)
        if (app) await supabase.from("applications").update({ cv_url: null }).eq("id", app.id)
      }
      queryClient.invalidateQueries({ queryKey: ["applicant-profile", id] })
      toast.success("CV removed")
    } catch (error) {
      toast.error("Failed to remove CV")
    }
  }

  // --- DYNAMIC FIELD HANDLERS ---

  const manageList = (field: 'education' | 'experience', action: 'add' | 'remove' | 'update', index?: number, key?: string, value?: string) => {
    const list = [...formData[field]] as any[]
    
    if (action === 'add') {
      const item = field === 'education' 
        ? { degree: "", school: "", year: "" } 
        : { title: "", company: "", duration: "" }
      setFormData({ ...formData, [field]: [...list, item] })
    } else if (action === 'remove' && typeof index === 'number') {
      setFormData({ ...formData, [field]: list.filter((_, i) => i !== index) })
    } else if (action === 'update' && typeof index === 'number' && key) {
      list[index][key] = value
      setFormData({ ...formData, [field]: list })
    }
  }

  // --- RENDER HELPERS ---

  if (isLoading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  
  if (!applicant) return <EmptyState icon={User} title="Applicant Not Found" description="This profile does not exist." actionLabel="Go Back" onAction={() => navigate("/applicants")} />

  const avatarUrl = applicant.avatar_url || getRandomAvatar(applicant.gender, applicant.id)
  // Fix: Prioritize Profile CV, then fallback to latest application CV
  const latestCV = applicant.cv_url || applications?.find((app) => app.cv_url)?.cv_url

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* --- TOP BAR --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/applicants")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Applicant Profile</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Manage candidate details and documents</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={updateApplicantMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateApplicantMutation.isPending}>
                {updateApplicantMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="default">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- LEFT COLUMN (SIDEBAR) --- */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Identity Card */}
          <Card className="overflow-hidden border-t-4 border-t-primary">
            <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
              <div className="relative group mb-4">
                <Avatar className="h-32 w-32 ring-4 ring-background shadow-xl">
                  <AvatarImage src={avatarUrl} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {getPersonInitials(applicant)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
                    {uploadingAvatar ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Upload className="h-6 w-6 text-white" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                )}
              </div>

              <div className="space-y-1 mb-4">
                <h2 className="text-2xl font-bold">{getPersonDisplayName(applicant)}</h2>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  {applicant.age && <span>{applicant.age} years</span>}
                  {applicant.gender && (
                    <Badge variant="outline" className="capitalize px-2 py-0 h-5">
                      {applicant.gender}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Rating Star System */}
              <div className="flex flex-col items-center gap-2 p-3 bg-secondary/30 rounded-xl w-full">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => !isEditing && updateRatingMutation.mutate(star)}
                      disabled={isEditing || updateRatingMutation.isPending}
                      className="hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "h-6 w-6 transition-colors",
                          star <= (applicant.rating || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/20 hover:text-amber-400/50"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {applicant.rating ? "Candidate Rating" : "Rate this candidate"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information (Moved to Sidebar for easy access) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="group">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  {isEditing ? (
                    <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-8 mt-1" />
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium mt-0.5 truncate" title={applicant.email}>
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {applicant.email}
                    </div>
                  )}
                </div>

                <div className="group">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  {isEditing ? (
                    <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-8 mt-1" />
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium mt-0.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {applicant.phone || <span className="text-muted-foreground italic">Not provided</span>}
                    </div>
                  )}
                </div>

                <div className="group">
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  {isEditing ? (
                    <div className="space-y-2 mt-1">
                      <Select value={formData.wilaya} onValueChange={(v) => setFormData({...formData, wilaya: v})}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Wilaya" /></SelectTrigger>
                        <SelectContent><div className="max-h-48 overflow-y-auto">{WILAYAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</div></SelectContent>
                      </Select>
                      <Textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Full Address" className="min-h-[60px] text-sm" />
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-sm font-medium mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                      <span>
                        {applicant.wilaya && <span className="font-semibold">{applicant.wilaya}</span>}
                        {applicant.address && <span className="block text-muted-foreground font-normal text-xs">{applicant.address}</span>}
                        {!applicant.wilaya && !applicant.address && <span className="text-muted-foreground italic">Not provided</span>}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CV Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Resume / CV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestCV ? (
                <div className="group relative border rounded-lg p-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 rounded bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate">Candidate CV</span>
                      <span className="text-xs text-muted-foreground">PDF/DOC Document</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(latestCV, '_blank')}>
                      <Download className="h-4 w-4" />
                    </Button>
                    {isEditing && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={handleDeleteCV}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground bg-secondary/10">
                  <FileText className="h-8 w-8 opacity-50" />
                  <span className="text-xs">No resume uploaded</span>
                </div>
              )}

              {isEditing && (
                <div>
                   <input type="file" id="cv-upload" className="hidden" accept=".pdf,.doc,.docx" onChange={handleCVUpload} disabled={uploadingCV} />
                   <Button variant="outline" className="w-full dashed border-primary/30 text-primary hover:bg-primary/5" disabled={uploadingCV} asChild>
                     <label htmlFor="cv-upload" className="cursor-pointer">
                       {uploadingCV ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Upload className="h-4 w-4 mr-2" />}
                       {latestCV ? "Replace File" : "Upload File"}
                     </label>
                   </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Applications</span>
                <Badge variant="secondary" className="rounded-sm">{applications?.length || 0}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{format(new Date(applicant.created_at), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Update</span>
                <span className="font-medium">{format(new Date(applicant.updated_at), "MMM d, yyyy")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN (MAIN CONTENT) --- */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Edit Name Inputs (Only visible when editing) */}
          {isEditing && (
             <Card>
               <CardContent className="pt-6 grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>First Name</Label>
                   <Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>Last Name</Label>
                   <Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>Age</Label>
                   <Input type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>Gender</Label>
                   <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
                     <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                     <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                   </Select>
                 </div>
               </CardContent>
             </Card>
          )}

          {/* Skills Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Skills & Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea 
                    value={formData.skills} 
                    onChange={(e) => setFormData({...formData, skills: e.target.value})} 
                    placeholder="Enter skills separated by commas (e.g. React, Node.js, Leadership)"
                  />
                  <p className="text-xs text-muted-foreground">Separate tags with commas</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(applicant.skills) && applicant.skills.length > 0) ? (
                    applicant.skills.map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm italic">No skills listed</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experience Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> Work Experience
              </CardTitle>
              {isEditing && (
                <Button size="sm" variant="outline" onClick={() => manageList('experience', 'add')}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  {formData.experience.map((exp, i) => (
                    <div key={i} className="flex gap-2 items-start p-4 border rounded-md bg-secondary/10">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                         <Input placeholder="Job Title" value={exp.title} onChange={(e) => manageList('experience', 'update', i, 'title', e.target.value)} />
                         <Input placeholder="Company" value={exp.company} onChange={(e) => manageList('experience', 'update', i, 'company', e.target.value)} />
                         <Input placeholder="Duration (e.g. 2020 - Present)" className="md:col-span-2" value={exp.duration} onChange={(e) => manageList('experience', 'update', i, 'duration', e.target.value)} />
                       </div>
                       <Button size="icon" variant="ghost" className="text-destructive" onClick={() => manageList('experience', 'remove', i)}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  ))}
                  {formData.experience.length === 0 && <p className="text-sm text-center text-muted-foreground">No experience added.</p>}
                </div>
              ) : (
                <div className="space-y-8 relative pl-2">
                  {/* Timeline Line */}
                  {(Array.isArray(applicant.experience) && applicant.experience.length > 0) && (
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                  )}
                  
                  {(Array.isArray(applicant.experience) && applicant.experience.length > 0) ? (
                    applicant.experience.map((exp: ExperienceItem, i: number) => (
                      <div key={i} className="relative pl-6">
                        {/* Timeline Dot */}
                        <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-primary bg-background z-10" />
                        
                        <h3 className="font-semibold text-lg leading-none">{exp.title}</h3>
                        <div className="text-primary font-medium mt-1">{exp.company}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          {exp.duration}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Briefcase className="h-8 w-8 mb-2 opacity-50" />
                      <p>No work experience recorded</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Education Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> Education
              </CardTitle>
              {isEditing && (
                <Button size="sm" variant="outline" onClick={() => manageList('education', 'add')}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  {formData.education.map((edu, i) => (
                     <div key={i} className="flex gap-2 items-start p-4 border rounded-md bg-secondary/10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                       <Input placeholder="Degree" value={edu.degree} onChange={(e) => manageList('education', 'update', i, 'degree', e.target.value)} />
                       <Input placeholder="School/University" value={edu.school} onChange={(e) => manageList('education', 'update', i, 'school', e.target.value)} />
                       <Input placeholder="Year" className="md:col-span-2" value={edu.year} onChange={(e) => manageList('education', 'update', i, 'year', e.target.value)} />
                     </div>
                     <Button size="icon" variant="ghost" className="text-destructive" onClick={() => manageList('education', 'remove', i)}>
                       <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
                  ))}
                  {formData.education.length === 0 && <p className="text-sm text-center text-muted-foreground">No education added.</p>}
                </div>
              ) : (
                <div className="grid gap-4">
                  {(Array.isArray(applicant.education) && applicant.education.length > 0) ? (
                    applicant.education.map((edu: EducationItem, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base">{edu.degree}</h4>
                          <p className="text-sm font-medium text-muted-foreground">{edu.school}</p>
                          <Badge variant="outline" className="mt-2 text-xs font-normal">
                            {edu.year}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      <GraduationCap className="h-8 w-8 mb-2 opacity-50" />
                      <p>No education history recorded</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}