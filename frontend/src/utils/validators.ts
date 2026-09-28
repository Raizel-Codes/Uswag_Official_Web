export function isValidNwssuEmail(email: string): boolean {
  return /^[^\s@]+@nwssu\.edu\.ph$/i.test(email);
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}
