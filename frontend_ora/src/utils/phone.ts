// src/utils/phone.ts
export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}
