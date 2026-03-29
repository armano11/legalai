import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function generateUniqueId(prefix = '') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
