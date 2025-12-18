import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type PersonName = {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
};

export function getPersonDisplayName(person?: PersonName | null): string {
  const first = (person?.first_name || '').trim();
  const last = (person?.last_name || '').trim();
  const combined = `${first} ${last}`.trim();

  if (combined) return combined;

  // Fallback for older datasets/backends that still store a single name
  const full = (person?.full_name || '').trim();
  return full || 'Unknown';
}

export function getPersonInitials(person?: PersonName | null): string {
  const name = getPersonDisplayName(person);
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  return (initials || '??').toUpperCase();
}
