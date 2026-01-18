// Characters excluding O/0 and I/1 for clarity
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateSessionCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return code;
}

export function isValidSessionCode(code: string): boolean {
  if (code.length !== 6) return false;
  return code.split('').every(char => CHARSET.includes(char.toUpperCase()));
}
