export const PROFILE_STORAGE_KEY = 'legalforge_lawyer_profile_details';

export function readStoredProfiles() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeStoredProfiles(profiles) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Ignore storage failures and keep profile flows responsive.
  }
}

export function splitCommaValues(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitLineValues(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinList(value) {
  return Array.isArray(value) ? value.join(', ') : '';
}

export function joinLines(value) {
  return Array.isArray(value) ? value.join('\n') : '';
}
