export function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function smsPhone(value: string) {
  const numeric = value.replace(/\D/g, "");
  return value.trim().startsWith("+") ? `+${numeric}` : numeric;
}

export function smsLink(phone: string, body: string, ios: boolean) {
  return `sms:${phone}${ios ? "&" : "?"}body=${encodeURIComponent(body)}`;
}

export function guestShareText(name: string, url: string) {
  return `${name}, your personal invitation is ready: ${url}`;
}
