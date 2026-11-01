// Same scrypt parameters as the separately inspected Klink Inzicht account service.
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
export async function passwordHash(password: string) {
  if (password.length < 16 || password.length > 200)
    throw new Error('Invalid password length');
  const salt = randomBytes(16).toString('hex');
  const key = (await derive(password, salt)) as Buffer;
  return `scrypt$32768$8$3$${salt}$${key.toString('hex')}`;
}
export async function passwordMatches(password: string, encoded: unknown) {
  if (password.length > 200) return false;
  const valid =
    typeof encoded === 'string' &&
    /^scrypt\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded);
  const parts = valid
    ? encoded.split('$')
    : ['', '', '', '', '0'.repeat(32), '0'.repeat(128)];
  const key = (await derive(password, parts[4])) as Buffer;
  return timingSafeEqual(key, Buffer.from(parts[5], 'hex')) && valid;
}
export const newSession = () => randomBytes(32).toString('hex');
export const sessionCookieName = (online: boolean) =>
  online ? '__Host-inzicht_session' : 'inzicht_session';
export const sessionCookie = (online: boolean, token: string) =>
  `${sessionCookieName(online)}=${token}; HttpOnly; SameSite=Strict; Path=${online ? '/' : '/api/inzicht'}; Max-Age=${token ? 28800 : 0}${online ? '; Secure' : ''}`;
export function sessionToken(request: Request, online: boolean) {
  return request.headers
    .get('cookie')
    ?.split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${sessionCookieName(online)}=`))
    ?.split('=')[1];
}
