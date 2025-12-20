import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type PersonName = {
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
}

export function getPersonDisplayName(person?: PersonName | null): string {
  // Prioritize full_name since that's what the database uses
  const full = (person?.full_name || "").trim()
  if (full) return full

  // Fallback to first_name + last_name for backwards compatibility
  const first = (person?.first_name || "").trim()
  const last = (person?.last_name || "").trim()
  const combined = `${first} ${last}`.trim()
  if (combined) return combined

  return "Unknown"
}

export function getPersonInitials(person?: PersonName | null): string {
  const name = getPersonDisplayName(person)
  const parts = name.split(/\s+/).filter(Boolean)
  const initials = (parts[0]?.[0] || "") + (parts[1]?.[0] || "")
  return (initials || "??").toUpperCase()
}
