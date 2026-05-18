export const PHONE_DIGITS_MIN = 10;
export const PHONE_DIGITS_MAX = 15;

export const isValidEmail = (value) => {
  const email = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isStrongPassword = (value, minLength = 10) => {
  const password = String(value || "");
  return password.length >= minLength;
};

export const isValidPhone = (value) => {
  const phone = String(value || "").trim();
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= PHONE_DIGITS_MIN && digits.length <= PHONE_DIGITS_MAX;
};

export const sanitizePhoneInput = (value) => {
  const text = String(value || "");
  const hasLeadingPlus = text.trim().startsWith("+");
  const digitsOnly = text.replace(/\D/g, "").slice(0, PHONE_DIGITS_MAX);
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
};
