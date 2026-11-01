import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { newSession } from './auth.ts';
import { hash } from './rules.ts';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(bytes: Uint8Array) {
  let bits = 0,
    value = 0,
    result = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += alphabet[(value >>> bits) & 31];
    }
  }
  if (bits) result += alphabet[(value << (5 - bits)) & 31];
  return result;
}
function decode(secret: string) {
  if (!/^[A-Z2-7]{32,128}$/.test(secret)) throw new Error('Invalid MFA secret');
  let bits = 0,
    value = 0;
  const bytes = [];
  for (const char of secret) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 255);
    }
  }
  return Buffer.from(bytes);
}
// RFC 6238: SHA-1 is the interoperable authenticator profile, with a 160-bit random key.
export function totp(
  secret: string,
  step = Math.floor(Date.now() / 30000),
  digits = 6,
) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac('sha1', decode(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits)
    .toString()
    .padStart(digits, '0');
}
export function matchedStep(
  secret: string,
  code: string,
  last: number,
  time = Date.now(),
) {
  if (!/^\d{6}$/.test(code)) return null;
  const current = Math.floor(time / 30000);
  for (const step of [current, current - 1, current + 1])
    if (
      step >= 0 &&
      step > last &&
      timingSafeEqual(Buffer.from(totp(secret, step)), Buffer.from(code))
    )
      return step;
  return null;
}
function key(value: string | undefined) {
  if (!value || !/^[a-f0-9]{64}$/.test(value))
    throw new MfaError(503, 'Aanmelden is tijdelijk niet beschikbaar.');
  return Buffer.from(value, 'hex');
}
export function seal(
  secret: string,
  user: string,
  encryptionKey: string | undefined,
) {
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', key(encryptionKey), iv);
  cipher.setAAD(Buffer.from(`klink-inzicht-mfa:${user}`));
  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((v) => v.toString('hex'))
    .join('.');
}
export function unseal(
  encoded: string,
  user: string,
  encryptionKey: string | undefined,
) {
  if (!/^[a-f0-9]{24}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(encoded))
    throw new Error('Invalid MFA envelope');
  const [iv, tag, data] = encoded.split('.').map((v) => Buffer.from(v, 'hex'));
  const cipher = createDecipheriv('aes-256-gcm', key(encryptionKey), iv);
  cipher.setAAD(Buffer.from(`klink-inzicht-mfa:${user}`));
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8');
}
export class MfaError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
const invalid = () =>
  new MfaError(
    401,
    'Code ongeldig, al gebruikt of verlopen. Meld je zo nodig opnieuw aan.',
  );
const stmt = (
  db: D1Database,
  sql: string,
  ...values: (string | number | null)[]
) => db.prepare(sql).bind(...values);
type Challenge = {
  token_hash: string;
  user_id: string;
  password_hash: string;
  pending_cipher: string | null;
  expires_at: string;
  attempts: number;
};
type Factor = { secret_cipher: string; last_step: number };
export const challengeCookie = (token: string) =>
  `__Host-inzicht_mfa=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${token ? 300 : 0}`;
export const challengeToken = (request: Request) =>
  request.headers
    .get('cookie')
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('__Host-inzicht_mfa='))
    ?.split('=')[1] ?? '';

export async function beginMfa(
  db: D1Database,
  user: string,
  email: string,
  passwordHash: string,
  encryptionKey?: string,
) {
  key(encryptionKey);
  const factor = await stmt(
    db,
    'SELECT secret_cipher,last_step FROM inzicht_mfa WHERE user_id=?',
    user,
  ).first<Factor>();
  const secret = factor ? null : base32(randomBytes(20));
  const pending = secret ? seal(secret, user, encryptionKey) : null;
  const token = newSession(),
    tokenHash = await hash(token),
    guard = crypto.randomUUID();
  await db.batch([
    stmt(
      db,
      "INSERT INTO inzicht_write_guards VALUES (?,CASE WHEN EXISTS(SELECT 1 FROM inzicht_credentials c JOIN users u ON u.id=c.user_id WHERE c.user_id=? AND c.password_hash=? AND u.status='active') THEN 1 ELSE 0 END)",
      guard,
      user,
      passwordHash,
    ),
    stmt(db, 'DELETE FROM inzicht_mfa_challenges WHERE user_id=?', user),
    stmt(
      db,
      'INSERT INTO inzicht_mfa_challenges VALUES (?,?,?,?,?,0)',
      tokenHash,
      user,
      passwordHash,
      pending,
      new Date(Date.now() + 300000).toISOString(),
    ),
    stmt(db, 'DELETE FROM inzicht_write_guards WHERE id=?', guard),
  ]);
  return {
    token,
    data: secret
      ? {
          mfa: 'enroll',
          secret,
          uri: `otpauth://totp/${encodeURIComponent(`Klink Inzicht staging:${email}`)}?secret=${secret}&issuer=Klink%20Inzicht%20staging&algorithm=SHA1&digits=6&period=30`,
        }
      : { mfa: 'verify' },
  };
}

export async function finishMfa(
  db: D1Database,
  request: Request,
  value: unknown,
  encryptionKey?: string,
) {
  key(encryptionKey);
  const token = challengeToken(request);
  if (
    !/^[a-f0-9]{64}$/.test(token) ||
    typeof value !== 'string' ||
    value.length > 64
  )
    throw invalid();
  const tokenHash = await hash(token),
    at = new Date().toISOString();
  const challenge = await stmt(
    db,
    'UPDATE inzicht_mfa_challenges SET attempts=attempts+1 WHERE token_hash=? AND expires_at>? AND attempts<5 RETURNING *',
    tokenHash,
    at,
  ).first<Challenge>();
  if (!challenge) throw invalid();
  const bucket = `login-mfa:${await hash(challenge.user_id)}:${Math.floor(Date.now() / 900000)}`;
  const rate = await stmt(
    db,
    'INSERT INTO inzicht_rate_limits VALUES (?,1) ON CONFLICT(bucket) DO UPDATE SET requests=requests+1 RETURNING requests',
    bucket,
  ).first<{ requests: number }>();
  if (Number(rate?.requests) > 15)
    throw new MfaError(
      429,
      'Te veel codepogingen. Probeer het over vijftien minuten opnieuw.',
    );
  const factor = await stmt(
    db,
    'SELECT secret_cipher,last_step FROM inzicht_mfa WHERE user_id=?',
    challenge.user_id,
  ).first<Factor>();
  if (
    (challenge.pending_cipher && factor) ||
    (!challenge.pending_cipher && !factor)
  )
    throw invalid();
  const encrypted = challenge.pending_cipher ?? factor!.secret_cipher;
  const code = value.trim(),
    recovery = code.replace(/[\s-]/g, '').toLowerCase();
  const recoveryHash =
    !challenge.pending_cipher && /^[a-f0-9]{32}$/.test(recovery)
      ? await hash(`${challenge.user_id}:${recovery}`)
      : null;
  const step = recoveryHash
    ? null
    : matchedStep(
        unseal(encrypted, challenge.user_id, encryptionKey),
        code,
        factor?.last_step ?? -1,
      );
  if (!recoveryHash && step === null) throw invalid();
  const session = newSession(),
    sessionHash = await hash(session),
    guard = crypto.randomUUID();
  const checks = [
    stmt(
      db,
      "INSERT INTO inzicht_write_guards VALUES (?,CASE WHEN EXISTS(SELECT 1 FROM inzicht_mfa_challenges ch JOIN inzicht_credentials c ON c.user_id=ch.user_id AND c.password_hash=ch.password_hash JOIN users u ON u.id=c.user_id WHERE ch.token_hash=? AND ch.expires_at>? AND ch.attempts<=5 AND u.status='active') THEN 1 ELSE 0 END)",
      guard,
      tokenHash,
      at,
    ),
  ];
  const recoveryCodes = challenge.pending_cipher
    ? Array.from({ length: 8 }, () =>
        randomBytes(16).toString('hex').match(/.{8}/g)!.join('-'),
      )
    : [];
  if (challenge.pending_cipher) {
    checks.push(
      stmt(
        db,
        'INSERT INTO inzicht_mfa VALUES (?,?,?,?)',
        challenge.user_id,
        encrypted,
        step!,
        at,
      ),
    );
    for (const code of recoveryCodes)
      checks.push(
        stmt(
          db,
          'INSERT INTO inzicht_mfa_recovery VALUES (?,?,NULL)',
          challenge.user_id,
          await hash(`${challenge.user_id}:${code.replaceAll('-', '')}`),
        ),
      );
  } else {
    const condition = recoveryHash
      ? 'EXISTS(SELECT 1 FROM inzicht_mfa f JOIN inzicht_mfa_recovery r ON r.user_id=f.user_id WHERE f.user_id=? AND f.secret_cipher=? AND r.code_hash=? AND r.used_at IS NULL)'
      : 'EXISTS(SELECT 1 FROM inzicht_mfa WHERE user_id=? AND secret_cipher=? AND last_step<?)';
    checks.push(
      stmt(
        db,
        `UPDATE inzicht_write_guards SET allowed=CASE WHEN ${condition} THEN 1 ELSE 0 END WHERE id=?`,
        challenge.user_id,
        encrypted,
        recoveryHash ?? step!,
        guard,
      ),
    );
    checks.push(
      recoveryHash
        ? stmt(
            db,
            'UPDATE inzicht_mfa_recovery SET used_at=? WHERE user_id=? AND code_hash=? AND used_at IS NULL',
            at,
            challenge.user_id,
            recoveryHash,
          )
        : stmt(
            db,
            'UPDATE inzicht_mfa SET last_step=? WHERE user_id=?',
            step!,
            challenge.user_id,
          ),
    );
  }
  // The guard, replay marker, one-time challenge and new session commit in the same D1 transaction.
  checks.push(
    stmt(
      db,
      'INSERT INTO inzicht_sessions VALUES (?,?,?,0)',
      sessionHash,
      challenge.user_id,
      new Date(Date.now() + 8 * 3600000).toISOString(),
    ),
    stmt(db, 'INSERT INTO inzicht_mfa_sessions VALUES (?)', sessionHash),
    stmt(
      db,
      'DELETE FROM inzicht_mfa_challenges WHERE token_hash=?',
      tokenHash,
    ),
    stmt(db, 'DELETE FROM inzicht_write_guards WHERE id=?', guard),
    stmt(
      db,
      'INSERT INTO inzicht_auth_events VALUES (?,?,?,?)',
      crypto.randomUUID(),
      challenge.user_id,
      challenge.pending_cipher
        ? 'mfa_enrolled'
        : recoveryHash
          ? 'mfa_recovery_used'
          : 'mfa_login',
      at,
    ),
  );
  try {
    await db.batch(checks);
  } catch (error) {
    if (/CHECK|UNIQUE/.test(String(error))) throw invalid();
    throw error;
  }
  return {
    token: session,
    data: {
      ok: true,
      recovery_codes: recoveryCodes,
      recovery_used: Boolean(recoveryHash),
    },
  };
}

export async function cancelMfa(db: D1Database, request: Request) {
  const token = challengeToken(request);
  if (/^[a-f0-9]{64}$/.test(token))
    await stmt(
      db,
      'DELETE FROM inzicht_mfa_challenges WHERE token_hash=?',
      await hash(token),
    ).run();
}
