// Phones only. iPads report a Mac browser and most Android tablets omit "Mobile", so tablets pass.
const PHONE_USER_AGENT_PATTERN = /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|BlackBerry|Opera Mini/i;

/** Whether a User-Agent header belongs to a phone (US-9.1). A changed User-Agent gets past this. */
export function isPhoneUserAgent(userAgent: string): boolean {
  return PHONE_USER_AGENT_PATTERN.test(userAgent);
}
