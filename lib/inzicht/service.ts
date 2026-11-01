import { buildReport, type ReportInput, type ReportFilter } from './reports.ts';
import {
  beginMfa,
  finishMfa,
  cancelMfa,
  challengeCookie,
  MfaError,
} from './mfa.ts';
import { passwordMatches, sessionCookie, sessionToken } from './auth.ts';
import {
  sourceMaterial,
  sourceCriteria,
  SOURCE_KEY,
  SOURCE_VERSION,
  type SourceMode,
} from './source-observation.ts';
import {
  canonical,
  computeMastery,
  csvCell,
  hash,
  permitted,
  recommendations,
  ROUTES,
  RULE_VERSION,
  type Content,
  type Evidence,
  type Mastery,
  type Policy,
  type Skill,
} from './rules.ts';

export type InzichtEnv = {
  INZICHT_DB?: D1Database;
  INZICHT_MODE?: string;
  INZICHT_ORIGIN?: string;
  INZICHT_MFA_KEY?: string;
};
type Row = Record<string, string | number | null>;
type Context = {
  db: D1Database;
  user: string;
  org: string;
  member: string;
  role: string;
  create: boolean;
  routes: string[];
  version: number;
};
class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const string = (v: unknown, max = 100, allowEmpty = false) =>
  typeof v === 'string' &&
  v.trim().length <= max &&
  (allowEmpty || v.trim().length > 0)
    ? v.trim()
    : fail(400, 'Controleer de ingevulde velden.');
const choice = (v: unknown, values: string[]) =>
  typeof v === 'string' && values.includes(v)
    ? v
    : fail(400, 'Ongeldige keuze.');
const json = <T>(v: unknown): T => JSON.parse(String(v));
const stmt = (
  db: D1Database,
  sql: string,
  ...values: (string | number | null)[]
) => db.prepare(sql).bind(...values);
const rows = async (
  db: D1Database,
  sql: string,
  ...values: (string | number | null)[]
) => (await stmt(db, sql, ...values).all<Row>()).results;
const one = async (
  db: D1Database,
  sql: string,
  ...values: (string | number | null)[]
) => stmt(db, sql, ...values).first<Row>();
const audit = (c: Context, action: string, id: string) =>
  stmt(
    c.db,
    'INSERT INTO audit_events VALUES (?,?,?,?,?,?)',
    uid(),
    c.org,
    c.member,
    action,
    id,
    now(),
  );
const loopback = (request: Request) =>
  ['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url).hostname);
export const enabled = (env: InzichtEnv) =>
  ['synthetic-local', 'synthetic-online'].includes(env.INZICHT_MODE ?? '') &&
  Boolean(env.INZICHT_DB);

async function limit(db: D1Database, key: string, max: number) {
  const bucket = `${key}:${Math.floor(Date.now() / 60000)}`;
  const result = await stmt(
    db,
    'INSERT INTO inzicht_rate_limits VALUES (?,1) ON CONFLICT(bucket) DO UPDATE SET requests=requests+1 RETURNING requests',
    bucket,
  ).first<Row>();
  if (Number(result?.requests) > max)
    fail(429, 'Even wachten en opnieuw proberen.');
}
async function actor(request: Request, db: D1Database, online = false) {
  const token = sessionToken(request, online);
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    return fail(401, 'Meld je aan in de testomgeving.');
  const session = await one(
    db,
    `SELECT s.user_id FROM inzicht_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND s.revoked=0 AND u.status='active' ${online ? 'AND EXISTS(SELECT 1 FROM inzicht_mfa f JOIN inzicht_mfa_sessions ms ON ms.token_hash=s.token_hash WHERE f.user_id=s.user_id)' : ''}`,
    await hash(token),
    now(),
  );
  if (!session) return fail(401, 'Je testsessie is verlopen.');
  return String(session.user_id);
}
async function context(
  db: D1Database,
  user: string,
  org: string | null,
): Promise<Context> {
  if (!org) return fail(400, 'Kies een schoolcontext.');
  const row = await one(
    db,
    "SELECT m.*, o.allowed_routes,o.data_version FROM memberships m JOIN organizations o ON o.id=m.organization_id WHERE m.user_id=? AND m.organization_id=? AND m.status='active' AND o.status='active'",
    user,
    org,
  );
  if (!row) return fail(403, 'Geen toegang tot deze schoolcontext.');
  return {
    db,
    user,
    org,
    member: String(row.id),
    role: String(row.role),
    create: row.can_create_class === 1,
    routes: json<string[]>(row.allowed_routes),
    version: Number(row.data_version),
  };
}
async function teacher(
  c: Context,
  group: string,
  write = false,
  allowArchived = false,
) {
  if (
    !['teacher', 'assistant'].includes(c.role) ||
    (write && c.role !== 'teacher')
  )
    return fail(403, 'Geen bevoegdheid voor deze handeling.');
  const g = await one(
    c.db,
    'SELECT g.* FROM groups g JOIN group_teachers t ON t.organization_id=g.organization_id AND t.group_id=g.id WHERE g.organization_id=? AND g.id=? AND t.membership_id=?',
    c.org,
    group,
    c.member,
  );
  if (!g) return fail(404, 'Niet beschikbaar.');
  if (write && !allowArchived && g.status !== 'active')
    fail(409, 'Deze klas is gearchiveerd.');
  return g;
}
async function learner(c: Context, group: string, id: string, active = true) {
  const l = await one(
    c.db,
    'SELECT l.*, gm.status AS enrollment_status FROM school_learners l JOIN group_memberships gm ON gm.organization_id=l.organization_id AND gm.learner_id=l.id WHERE l.organization_id=? AND gm.group_id=? AND l.id=?',
    c.org,
    group,
    id,
  );
  if (!l || (active && l.enrollment_status !== 'active'))
    return fail(404, 'Niet beschikbaar.');
  return l;
}
async function policy(
  c: Context,
  group: string,
  learnerId = '*',
): Promise<Policy> {
  const p = await one(
    c.db,
    "SELECT * FROM class_access_policies WHERE organization_id=? AND group_id=? AND subject_id IN (?,'*') ORDER BY CASE WHEN subject_id='*' THEN 1 ELSE 0 END LIMIT 1",
    c.org,
    group,
    learnerId,
  );
  return p
    ? {
        allowed_routes: json(p.allowed_routes),
        exercise_mode: p.exercise_mode as Policy['exercise_mode'],
        version: Number(p.version),
      }
    : { allowed_routes: [], exercise_mode: 'assigned', version: 0 };
}
async function skills(db: D1Database): Promise<Skill[]> {
  return (await rows(db, 'SELECT * FROM skill_definitions ORDER BY id')).map(
    (s) => ({
      id: String(s.id),
      label: String(s.label),
      measurement_approved: Number(s.measurement_approved),
      rubric: json(s.rubric_json),
    }),
  );
}
async function catalog(c: Context): Promise<Content[]> {
  return (
    await rows(
      c.db,
      "SELECT * FROM content_versions WHERE release_status='published' ORDER BY id",
    )
  )
    .filter((r) => c.routes.includes(String(r.level_code)))
    .map((r) => ({ ...r, metadata: json(r.metadata) }) as Content);
}
async function evidence(c: Context, group: string, id: string, skill: string) {
  const events = await rows(
    c.db,
    `SELECT e.*, r.event_id AS revoked, o.current_revision FROM evidence_events e
    LEFT JOIN evidence_revocations r ON r.organization_id=e.organization_id AND r.event_id=e.id
    LEFT JOIN teacher_observations o ON o.organization_id=e.organization_id AND o.id=e.source_id AND e.source_type='observation'
    WHERE e.organization_id=? AND e.group_id=? AND e.learner_id=? AND e.skill_id=? ORDER BY e.created_at,e.id`,
    c.org,
    group,
    id,
    skill,
  );
  return events.map((e) => ({
    ...json<Evidence>(e.payload),
    id: String(e.id),
    revoked: Boolean(
      e.revoked ||
      (e.source_type === 'observation' &&
        e.current_revision !== e.source_revision),
    ),
    source_id: e.source_id,
    source_revision: e.source_revision,
    source_type: e.source_type,
    event_hash: e.event_hash,
  }));
}
async function classEvidence(c: Context, group: string) {
  const events = await rows(
    c.db,
    `SELECT e.*,r.event_id AS revoked,o.current_revision FROM evidence_events e
    LEFT JOIN evidence_revocations r ON r.organization_id=e.organization_id AND r.event_id=e.id
    LEFT JOIN teacher_observations o ON o.organization_id=e.organization_id AND o.id=e.source_id AND e.source_type='observation'
    WHERE e.organization_id=? AND e.group_id=? ORDER BY e.created_at,e.id`,
    c.org,
    group,
  );
  const grouped = new Map<string, Evidence[]>();
  for (const e of events) {
    const key = `${e.learner_id}:${e.skill_id}`;
    const list = grouped.get(key) ?? [];
    list.push({
      ...json<Evidence>(e.payload),
      id: String(e.id),
      revoked: Boolean(
        e.revoked ||
        (e.source_type === 'observation' &&
          e.current_revision !== e.source_revision),
      ),
    });
    grouped.set(key, list);
  }
  return grouped;
}
async function matrix(c: Context, group: string, process = false) {
  const defs = await skills(c.db);
  const learners = await rows(
    c.db,
    "SELECT l.* FROM school_learners l JOIN group_memberships gm ON gm.organization_id=l.organization_id AND gm.learner_id=l.id WHERE gm.organization_id=? AND gm.group_id=? AND gm.status='active' ORDER BY l.display_name,l.id",
    c.org,
    group,
  );
  const queued = await rows(
    c.db,
    "SELECT id FROM outbox_events WHERE organization_id=? AND group_id=? AND status<>'processed' ORDER BY id",
    c.org,
    group,
  );
  const calculated = now();
  const allEvidence = await classEvidence(c, group);
  const result = [];
  const writes: D1PreparedStatement[] = [];
  for (const l of learners) {
    const cells: Record<string, Mastery> = {};
    for (const skill of defs) {
      const events = allEvidence.get(`${l.id}:${skill.id}`) ?? [];
      const value = computeMastery(skill, events, calculated);
      cells[skill.id] = value;
      if (process && events.length)
        writes.push(
          stmt(
            c.db,
            'INSERT INTO mastery_snapshots VALUES (?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING',
            c.org,
            group,
            String(l.id),
            skill.id,
            await hash(events),
            RULE_VERSION,
            canonical(value),
            calculated,
          ),
        );
    }
    result.push({ id: String(l.id), name: String(l.display_name), cells });
  }
  if (process && (writes.length || queued.length)) {
    for (const q of queued)
      writes.push(
        stmt(
          c.db,
          "UPDATE outbox_events SET status='processed',processed_at=? WHERE organization_id=? AND id=?",
          calculated,
          c.org,
          String(q.id),
        ),
      );
    await c.db.batch(writes);
  }
  return {
    skills: defs,
    rows: result,
    processing: process ? 'processed' : queued.length ? 'queued' : 'processed',
    pending: process ? 0 : queued.length,
    calculated_at: calculated,
    rule_version: RULE_VERSION,
  };
}
// Bounded scheduled retry; unprocessed rows remain durable when a batch fails.
export async function processPending(db: D1Database) {
  const pending = await rows(
    db,
    "SELECT e.organization_id,e.group_id,COALESCE(r.failures,0) failures FROM outbox_events e LEFT JOIN inzicht_outbox_retries r ON r.organization_id=e.organization_id AND r.group_id=e.group_id WHERE e.status<>'processed' AND (r.next_attempt_at IS NULL OR r.next_attempt_at<=?) GROUP BY e.organization_id,e.group_id ORDER BY MIN(e.created_at),e.organization_id,e.group_id LIMIT 5",
    now(),
  );
  const result = { processed_groups: 0, failed_groups: 0 };
  for (const item of pending) {
    try {
      await matrix(
        {
          db,
          org: String(item.organization_id),
          user: '',
          member: '',
          role: '',
          create: false,
          routes: [],
          version: 0,
        },
        String(item.group_id),
        true,
      );
      await stmt(
        db,
        'INSERT INTO inzicht_outbox_retries VALUES (?,?,0,NULL,?,?) ON CONFLICT(organization_id,group_id) DO UPDATE SET failures=0,next_attempt_at=NULL,last_attempt_at=excluded.last_attempt_at,last_success_at=excluded.last_success_at',
        String(item.organization_id),
        String(item.group_id),
        now(),
        now(),
      ).run();
      result.processed_groups++;
    } catch {
      // Preserve the queued events; back off this class so other classes can continue.
      const delay = Math.min(
        3600000,
        300000 * 2 ** Math.min(Number(item.failures), 4),
      );
      await stmt(
        db,
        'INSERT INTO inzicht_outbox_retries VALUES (?,?,1,?,?,NULL) ON CONFLICT(organization_id,group_id) DO UPDATE SET failures=failures+1,next_attempt_at=excluded.next_attempt_at,last_attempt_at=excluded.last_attempt_at',
        String(item.organization_id),
        String(item.group_id),
        new Date(Date.now() + delay).toISOString(),
        now(),
      ).run();
      result.failed_groups++;
      console.error('inzicht.processing_failed');
    }
  }
  await stmt(
    db,
    'DELETE FROM inzicht_sessions WHERE expires_at<? OR revoked=1',
    now(),
  ).run();
  await stmt(
    db,
    'DELETE FROM inzicht_mfa_challenges WHERE expires_at<?',
    now(),
  ).run();
  // All rate windows are at most fifteen minutes. Keep the current windows only.
  const minute = Math.floor(Date.now() / 60000),
    quarter = Math.floor(Date.now() / 900000);
  await stmt(
    db,
    "DELETE FROM inzicht_rate_limits WHERE (bucket LIKE 'login-%' AND CAST(substr(bucket,length(rtrim(bucket,'0123456789'))+1) AS INTEGER)<?) OR (bucket NOT LIKE 'login-%' AND CAST(substr(bucket,length(rtrim(bucket,'0123456789'))+1) AS INTEGER)<?)",
    quarter - 1,
    minute - 1,
  ).run();
  return result;
}
async function inputs(c: Context, group: string) {
  const version = c.version;
  const g = await teacher(c, group, true);
  const m = await matrix(c, group);
  const content = await catalog(c);
  const policies = await rows(
    c.db,
    'SELECT * FROM class_access_policies WHERE organization_id=? AND group_id=? ORDER BY subject_id',
    c.org,
    group,
  );
  const links = await rows(
    c.db,
    'SELECT learner_id,membership_id,revoked_at FROM account_links WHERE organization_id=? ORDER BY id',
    c.org,
  );
  if (
    Number(
      (await one(
        c.db,
        'SELECT data_version FROM organizations WHERE id=?',
        c.org,
      ))!.data_version,
    ) !== version
  )
    return fail(409, 'Gegevens zijn gewijzigd. Bereken opnieuw.');
  return {
    version,
    group: g,
    matrix: { skills: m.skills, rows: m.rows, rule_version: m.rule_version },
    content,
    policies,
    links,
    routes: c.routes,
  };
}
function dates(body: Record<string, unknown>) {
  const start = string(body.starts_at, 30);
  const end = body.ends_at ? string(body.ends_at, 30) : null;
  if (
    !Number.isFinite(Date.parse(start)) ||
    (end &&
      (!Number.isFinite(Date.parse(end)) ||
        Date.parse(end) < Date.parse(start)))
  )
    fail(400, 'Controleer start- en einddatum.');
  return {
    start: new Date(start).toISOString(),
    end: end ? new Date(end).toISOString() : null,
  };
}
async function assignmentStatements(
  c: Context,
  group: string,
  body: Record<string, unknown>,
) {
  await teacher(c, group, true);
  const contentId = string(body.content_id);
  const content = (await catalog(c)).find((item) => item.id === contentId);
  if (!content || content.product !== 'klink')
    return fail(422, 'Geen vrijgegeven individuele oefening beschikbaar.');
  const ids = Array.isArray(body.learner_ids)
    ? [...new Set(body.learner_ids.map((x) => string(x)))]
    : [];
  if (!ids.length || ids.length > 100) return fail(400, 'Selecteer cursisten.');
  for (const id of ids) {
    await learner(c, group, id);
    if (!permitted(await policy(c, group, id), c.routes, content, true))
      return fail(409, 'De oefening past niet binnen de huidige toegang.');
  }
  const { start, end } = dates(body),
    id = uid();
  return {
    id,
    statements: [
      stmt(
        c.db,
        'INSERT INTO assignments VALUES (?,?,?,?,?,?,?,?,?,?)',
        id,
        c.org,
        group,
        contentId,
        c.member,
        start,
        end,
        string(body.instructions ?? '', 1000, true),
        'active',
        now(),
      ),
      ...ids.map((l) =>
        stmt(
          c.db,
          "INSERT INTO assignment_recipients VALUES (?,?,?,'ready')",
          c.org,
          id,
          l,
        ),
      ),
      audit(c, 'assignment.create', id),
    ],
  };
}
async function schoolAccess(
  c: Context,
  group: string | null,
  contentId: string | null,
  assignmentId: string | null,
) {
  if (c.role !== 'learner' || !group)
    return fail(403, 'Kies een geldige schoolklas.');
  const link = await one(
    c.db,
    'SELECT learner_id FROM account_links WHERE organization_id=? AND membership_id=? AND revoked_at IS NULL',
    c.org,
    c.member,
  );
  if (!link) return fail(403, 'Account nog niet geverifieerd gekoppeld.');
  const lid = String(link.learner_id);
  await learner(c, group, lid);
  const g = await one(
    c.db,
    'SELECT status FROM groups WHERE organization_id=? AND id=?',
    c.org,
    group,
  );
  if (g?.status !== 'active') return fail(403, 'Deze klas is niet actief.');
  const content = (await catalog(c)).find((item) => item.id === contentId);
  const assignment = assignmentId
    ? await one(
        c.db,
        "SELECT a.* FROM assignments a JOIN assignment_recipients ar ON ar.organization_id=a.organization_id AND ar.assignment_id=a.id WHERE a.organization_id=? AND a.group_id=? AND a.id=? AND ar.learner_id=? AND a.status='active' AND a.starts_at<=? AND (a.ends_at IS NULL OR a.ends_at>?)",
        c.org,
        group,
        assignmentId,
        lid,
        now(),
        now(),
      )
    : null;
  if (
    !content ||
    content.product !== 'klink' ||
    (assignmentId &&
      (!assignment || assignment.content_version_id !== content.id)) ||
    !permitted(
      await policy(c, group, lid),
      c.routes,
      content,
      Boolean(assignment),
    )
  )
    return fail(
      403,
      'Deze oefening is niet beschikbaar binnen deze schoolklas.',
    );
  return { content, lid, group, assignment };
}

async function mutate(
  c: Context,
  request: Request,
  body: Record<string, unknown>,
  action: () => Promise<{ data: unknown; statements: D1PreparedStatement[] }>,
  bump = true,
) {
  const version = c.version;
  const key = string(request.headers.get('idempotency-key'), 100);
  const requestHash = await hash({
    path: new URL(request.url).pathname + new URL(request.url).search,
    body,
  });
  const previous = await one(
    c.db,
    'SELECT request_hash,response FROM inzicht_requests WHERE organization_id=? AND actor_id=? AND request_key=?',
    c.org,
    c.member,
    key,
  );
  if (previous) {
    if (previous.request_hash !== requestHash)
      return fail(409, 'Deze bewaaractie is al voor andere gegevens gebruikt.');
    return json(previous.response);
  }
  const { data, statements } = await action();
  const guard = uid();
  statements.unshift(
    stmt(
      c.db,
      `INSERT INTO inzicht_write_guards VALUES (?, CASE WHEN EXISTS(SELECT 1 FROM organizations o JOIN memberships m ON m.organization_id=o.id JOIN users u ON u.id=m.user_id WHERE o.id=? AND o.data_version=? AND o.status='active' AND m.id=? AND m.status='active' AND m.role=? AND u.status='active') THEN 1 ELSE 0 END)`,
      guard,
      c.org,
      version,
      c.member,
      c.role,
    ),
  );
  if (bump)
    statements.push(
      stmt(
        c.db,
        'UPDATE organizations SET data_version=data_version+1 WHERE id=?',
        c.org,
      ),
    );
  statements.push(
    stmt(c.db, 'DELETE FROM inzicht_write_guards WHERE id=?', guard),
  );
  statements.push(
    stmt(
      c.db,
      'INSERT INTO inzicht_requests VALUES (?,?,?,?,?,?)',
      c.org,
      c.member,
      key,
      requestHash,
      canonical(data),
      now(),
    ),
  );
  try {
    await c.db.batch(statements);
  } catch (error) {
    const retry = await one(
      c.db,
      'SELECT request_hash,response FROM inzicht_requests WHERE organization_id=? AND actor_id=? AND request_key=?',
      c.org,
      c.member,
      key,
    );
    if (retry?.request_hash === requestHash) return json(retry.response);
    if (String(error).includes('UNIQUE') || String(error).includes('CHECK'))
      return fail(
        409,
        'Gegevens zijn gewijzigd of al gekoppeld. Vernieuw en vergelijk.',
      );
    throw error;
  }
  return data;
}

async function readBody(request: Request) {
  if (Number(request.headers.get('content-length')) > 16000)
    return fail(413, 'Te veel gegevens.');
  const reader = request.body?.getReader();
  if (!reader) return '';
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 16000) {
        void reader.cancel().catch(() => {});
        return fail(413, 'Te veel gegevens.');
      }
      parts.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    data.set(part, offset);
    offset += part.byteLength;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(data);
  } catch {
    return fail(400, 'Ongeldige tekstcodering.');
  }
}

export async function handleInzicht(
  request: Request,
  env: InzichtEnv,
): Promise<Response> {
  const headers = {
    'Cache-Control': 'no-store, private',
    Vary: 'Cookie',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  };
  const response = (
    data: unknown,
    status = 200,
    extra: Record<string, string> = {},
  ) => Response.json(data, { status, headers: { ...headers, ...extra } });
  try {
    const online = env.INZICHT_MODE === 'synthetic-online';
    const validHost = online
      ? new URL(request.url).origin === env.INZICHT_ORIGIN &&
        new URL(request.url).protocol === 'https:'
      : loopback(request);
    if (!enabled(env) || !validHost)
      return response({ error: 'Niet beschikbaar.' }, 404);
    const db = env.INZICHT_DB!;
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/inzicht\/?/, '').split('/');
    const writing = request.method === 'POST';
    if (!writing && request.method !== 'GET')
      return response({ error: 'Niet toegestaan.' }, 405);
    if (
      writing &&
      (request.headers.get('origin') !== url.origin ||
        !request.headers.get('content-type')?.startsWith('application/json'))
    )
      return response({ error: 'Ongeldige verzoekherkomst.' }, 403);
    const raw = writing ? await readBody(request) : '';
    let body: Record<string, unknown> = {};
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')
          throw new Error();
        body = parsed;
      } catch {
        return response({ error: 'Ongeldige gegevens.' }, 400);
      }
    }
    if (path[0] === 'login' && writing && online) {
      const email = string(body.email, 254).toLowerCase();
      const password =
        typeof body.password === 'string' && body.password.length <= 200
          ? body.password
          : fail(400, 'Controleer je aanmelding.');
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
      const window = Math.floor(Date.now() / 900000);
      for (const [key, max] of [
        [`login-ip:${await hash(ip)}:${window}`, 40],
        [`login-account:${await hash(email)}:${window}`, 10],
      ] as const) {
        const result = await stmt(
          db,
          'INSERT INTO inzicht_rate_limits VALUES (?,1) ON CONFLICT(bucket) DO UPDATE SET requests=requests+1 RETURNING requests',
          key,
        ).first<Row>();
        if (Number(result?.requests) > max)
          fail(
            429,
            'Te veel aanmeldpogingen. Probeer het over vijftien minuten opnieuw.',
          );
      }
      const credentials = await one(
        db,
        "SELECT c.* FROM inzicht_credentials c JOIN users u ON u.id=c.user_id WHERE c.email=? AND u.status='active' AND u.auth_subject LIKE 'synthetic:%'",
        email,
      );
      if (!(await passwordMatches(password, credentials?.password_hash)))
        fail(401, 'E-mailadres of wachtwoord klopt niet.');
      const next = await beginMfa(
        db,
        String(credentials!.user_id),
        email,
        String(credentials!.password_hash),
        env.INZICHT_MFA_KEY,
      );
      const oldToken = sessionToken(request, true);
      if (oldToken)
        await stmt(
          db,
          'DELETE FROM inzicht_sessions WHERE token_hash=?',
          await hash(oldToken),
        ).run();
      await stmt(
        db,
        'DELETE FROM inzicht_rate_limits WHERE bucket=?',
        `login-account:${await hash(email)}:${window}`,
      ).run();
      const result = response(next.data, 200, {
        'Set-Cookie': challengeCookie(next.token),
      });
      result.headers.append('Set-Cookie', sessionCookie(true, ''));
      return result;
    }
    if (path[0] === 'mfa' && writing && online) {
      if (path[1] === 'cancel') {
        await cancelMfa(db, request);
        return response({ ok: true }, 200, {
          'Set-Cookie': challengeCookie(''),
        });
      }
      if (path[1]) return response({ error: 'Niet beschikbaar.' }, 404);
      const next = await finishMfa(db, request, body.code, env.INZICHT_MFA_KEY);
      const result = response(next.data, 200, {
        'Set-Cookie': sessionCookie(true, next.token),
      });
      result.headers.append('Set-Cookie', challengeCookie(''));
      return result;
    }
    if (path[0] === 'session' && online)
      return response({ error: 'Niet beschikbaar.' }, 404);
    if (path[0] === 'session' && writing) {
      await limit(db, 'login', 20);
      const token = string(body.token, 64);
      if (!/^[a-f0-9]{64}$/.test(token))
        return fail(401, 'Ongeldige testtoegang.');
      const s = await one(
        db,
        'SELECT user_id FROM inzicht_sessions WHERE token_hash=? AND expires_at>? AND revoked=0',
        await hash(token),
        now(),
      );
      if (!s) return fail(401, 'Ongeldige testtoegang.');
      return response({ ok: true }, 200, {
        'Set-Cookie': `inzicht_session=${token}; HttpOnly; SameSite=Strict; Path=/api/inzicht; Max-Age=28800${url.protocol === 'https:' ? '; Secure' : ''}`,
      });
    }
    const user = await actor(request, db, online);
    await limit(
      db,
      `${user}:${writing ? 'write' : 'read'}`,
      writing ? 120 : 600,
    );
    if (path[0] === 'logout' && writing) {
      const token = sessionToken(request, online)!;
      await stmt(
        db,
        'UPDATE inzicht_sessions SET revoked=1 WHERE token_hash=?',
        await hash(token),
      ).run();
      return response({ ok: true }, 200, {
        'Set-Cookie': sessionCookie(online, ''),
      });
    }
    if (path[0] === 'me' && !writing)
      return response({
        user,
        synthetic: true,
        schools: await rows(
          db,
          "SELECT o.id,o.name,m.role FROM memberships m JOIN organizations o ON o.id=m.organization_id WHERE m.user_id=? AND m.status='active' AND o.status='active' ORDER BY o.id",
          user,
        ),
      });
    const c = await context(db, user, url.searchParams.get('school'));
    const group =
      path[0] === 'classes' ? path[1] : url.searchParams.get('class');
    if (path[0] === 'operations' && !writing) {
      if (!['school_admin', 'support'].includes(c.role))
        return fail(403, 'Geen beheerrechten.');
      const state = await one(
        db,
        "SELECT COUNT(*) pending_groups,COALESCE(SUM(CASE WHEN r.failures>0 THEN 1 ELSE 0 END),0) failed_groups,MIN(p.created_at) oldest_pending_at FROM (SELECT group_id,MIN(created_at) created_at FROM outbox_events WHERE organization_id=? AND status<>'processed' GROUP BY group_id) p LEFT JOIN inzicht_outbox_retries r ON r.group_id=p.group_id AND r.organization_id=?",
        c.org,
        c.org,
      );
      const history = await one(
        db,
        'SELECT MAX(last_attempt_at) last_attempt_at,MAX(last_success_at) last_success_at FROM inzicht_outbox_retries WHERE organization_id=?',
        c.org,
      );
      return response({ ...state, ...history });
    }
    if (path[0] === 'registrar' && !writing) {
      if (c.role !== 'registrar') return fail(403, 'Geen registrarrechten.');
      return response({
        classes: await rows(
          db,
          "SELECT id,name FROM groups WHERE organization_id=? AND status='active' ORDER BY name",
          c.org,
        ),
        learners: await rows(
          db,
          'SELECT id,display_name FROM school_learners WHERE organization_id=? ORDER BY display_name',
          c.org,
        ),
        memberships: await rows(
          db,
          "SELECT id,user_id FROM memberships WHERE organization_id=? AND role='learner' AND status='active' ORDER BY id",
          c.org,
        ),
        links: await rows(
          db,
          'SELECT id,learner_id,membership_id FROM account_links WHERE organization_id=? AND revoked_at IS NULL',
          c.org,
        ),
      });
    }
    if (path[0] === 'enrollments' && writing) {
      if (c.role !== 'registrar')
        return fail(
          403,
          'Alleen de schoolregistrar mag bestaande cursisten indelen.',
        );
      const lid = string(body.learner_id),
        gid = string(body.class_id),
        status = choice(body.status, ['active', 'ended']);
      if (body.confirmed !== true)
        return fail(422, 'Bevestig de klasindeling.');
      if (
        !(await one(
          db,
          'SELECT id FROM school_learners WHERE organization_id=? AND id=?',
          c.org,
          lid,
        )) ||
        !(await one(
          db,
          "SELECT id FROM groups WHERE organization_id=? AND id=? AND status='active'",
          c.org,
          gid,
        ))
      )
        return fail(404, 'Niet beschikbaar.');
      return response(
        await mutate(c, request, body, async () => ({
          data: { learner_id: lid, class_id: gid, status },
          statements: [
            stmt(
              db,
              'INSERT INTO group_memberships VALUES (?,?,?,?,?,?) ON CONFLICT(organization_id,group_id,learner_id) DO UPDATE SET status=excluded.status,ended_at=excluded.ended_at',
              c.org,
              gid,
              lid,
              status,
              now(),
              status === 'ended' ? now() : null,
            ),
            audit(c, 'enrollment.' + status, lid),
          ],
        })),
      );
    }
    if (path[0] === 'my-school' && !writing) {
      if (c.role !== 'learner')
        return fail(403, 'Alleen eigen cursistgegevens.');
      const link = await one(
        db,
        'SELECT learner_id FROM account_links WHERE organization_id=? AND membership_id=? AND revoked_at IS NULL',
        c.org,
        c.member,
      );
      if (!link)
        return response({
          classes: [],
          assignments: [],
          attempts: [],
          linked: false,
        });
      const lid = String(link.learner_id);
      const available = await rows(
        db,
        "SELECT a.id,a.group_id,a.content_version_id,a.instructions,v.title,ar.status FROM assignments a JOIN assignment_recipients ar ON ar.organization_id=a.organization_id AND ar.assignment_id=a.id JOIN content_versions v ON v.id=a.content_version_id WHERE a.organization_id=? AND ar.learner_id=? AND a.status='active' AND v.release_status='published' ORDER BY a.created_at DESC",
        c.org,
        lid,
      );
      const visible: Row[] = [];
      for (const assignment of available) {
        try {
          await schoolAccess(
            c,
            String(assignment.group_id),
            String(assignment.content_version_id),
            String(assignment.id),
          );
          visible.push(assignment);
        } catch (error) {
          if (
            !(error instanceof HttpError && [403, 404].includes(error.status))
          )
            throw error;
        }
      }
      const classes = await rows(
        db,
        "SELECT g.id,g.name FROM groups g JOIN group_memberships gm ON gm.organization_id=g.organization_id AND gm.group_id=g.id WHERE g.organization_id=? AND gm.learner_id=? AND gm.status='active' AND g.status='active'",
        c.org,
        lid,
      );
      const freePractice: {
        group_id: string;
        content_id: string;
        title: string;
      }[] = [];
      const freeCatalog = await catalog(c);
      // shortcut: three-item staging catalog; batch authorization before enabling a full catalog.
      for (const g of classes)
        for (const content of freeCatalog) {
          try {
            await schoolAccess(c, String(g.id), content.id, null);
            freePractice.push({
              group_id: String(g.id),
              content_id: content.id,
              title: content.title,
            });
          } catch (error) {
            if (
              !(error instanceof HttpError && [403, 404].includes(error.status))
            )
              throw error;
          }
        }
      return response({
        linked: true,
        classes,
        free_practice: freePractice,
        assignments: visible,
        attempts: await rows(
          db,
          'SELECT id,group_id,content_version_id,correct,created_at FROM school_attempts WHERE organization_id=? AND learner_id=? ORDER BY created_at DESC LIMIT 100',
          c.org,
          lid,
        ),
      });
    }
    if (
      path[0] === 'skills' &&
      !writing &&
      ['teacher', 'assistant', 'learner'].includes(c.role)
    )
      return response(await skills(db));
    if (path[0] === 'classes' && !path[1] && !writing) {
      if (!['teacher', 'assistant'].includes(c.role))
        return fail(403, 'Geen onderwijsinzage voor deze rol.');
      return response(
        await rows(
          db,
          `SELECT g.*, (SELECT COUNT(*) FROM group_memberships gm WHERE gm.organization_id=g.organization_id AND gm.group_id=g.id AND gm.status='active') AS learners_count
        FROM groups g JOIN group_teachers t ON t.organization_id=g.organization_id AND t.group_id=g.id WHERE g.organization_id=? AND t.membership_id=? ORDER BY g.name,g.id`,
          c.org,
          c.member,
        ),
      );
    }
    if (path[0] === 'classes' && !path[1] && writing) {
      if (c.role !== 'teacher' || !c.create)
        return fail(403, 'Geen recht om een klas te maken.');
      return response(
        await mutate(c, request, body, async () => {
          const id = uid(),
            level = choice(body.start_level, ROUTES);
          return {
            data: { id },
            statements: [
              stmt(
                db,
                "INSERT INTO groups VALUES (?,?,?,?,?,'active',1,?)",
                id,
                c.org,
                string(body.name),
                level,
                string(body.period ?? '', 100, true),
                now(),
              ),
              stmt(
                db,
                'INSERT INTO group_teachers VALUES (?,?,?)',
                c.org,
                id,
                c.member,
              ),
              stmt(
                db,
                "INSERT INTO class_access_policies VALUES (?,?,'*',1,?,'free')",
                c.org,
                id,
                canonical(c.routes),
              ),
              audit(c, 'class.create', id),
            ],
          };
        }),
        201,
      );
    }
    if (path[0] === 'classes' && group) {
      const g = await teacher(c, group, writing, !path[2]);
      if (!path[2] && !writing)
        return response({
          group: g,
          learners: await rows(
            db,
            `SELECT l.*, gm.status AS enrollment_status, al.membership_id FROM school_learners l JOIN group_memberships gm ON gm.organization_id=l.organization_id AND gm.learner_id=l.id LEFT JOIN account_links al ON al.organization_id=l.organization_id AND al.learner_id=l.id AND al.revoked_at IS NULL WHERE gm.organization_id=? AND gm.group_id=? ORDER BY l.display_name,l.id`,
            c.org,
            group,
          ),
          policy: await policy(c, group),
        });
      if (!path[2] && writing)
        return response(
          await mutate(c, request, body, async () => {
            if (Number(body.expected_version) !== g.version)
              return fail(409, 'De klas is gewijzigd. Vernieuw en vergelijk.');
            return {
              data: { id: group, version: Number(g.version) + 1 },
              statements: [
                stmt(
                  db,
                  'UPDATE groups SET name=?,status=?,version=version+1 WHERE organization_id=? AND id=? AND version=?',
                  string(body.name),
                  choice(body.status, ['active', 'archived']),
                  c.org,
                  group,
                  Number(g.version),
                ),
                audit(c, 'class.update', group),
              ],
            };
          }),
        );
      if (path[2] === 'learners' && writing)
        return response(
          await mutate(c, request, body, async () => {
            if (body.membership_id || body.user_id || body.learner_id)
              return fail(
                403,
                'Bestaande accounts vereisen een geverifieerde koppeling.',
              );
            const id = uid();
            return {
              data: { id, status: 'VERIFIED_LINK_REQUIRED' },
              statements: [
                stmt(
                  db,
                  'INSERT INTO school_learners VALUES (?,?,?,?,?)',
                  id,
                  c.org,
                  string(body.name),
                  c.member,
                  now(),
                ),
                stmt(
                  db,
                  "INSERT INTO group_memberships VALUES (?,?,?,'active',?,NULL)",
                  c.org,
                  group,
                  id,
                  now(),
                ),
                audit(c, 'learner.provisional', id),
              ],
            };
          }),
          201,
        );
      if (path[2] === 'matrix')
        return response(await matrix(c, group, writing));
      if (path[2] === 'catalog' && !writing) return response(await catalog(c));
      if (path[2] === 'policy') {
        const target = string(
          body.learner_id ?? url.searchParams.get('learner') ?? '*',
        );
        if (target !== '*') await learner(c, group, target);
        if (!writing) return response(await policy(c, group, target));
        const inherit = body.inherit === true && target !== '*';
        const standard = await policy(c, group);
        const routes = inherit
          ? standard.allowed_routes
          : Array.isArray(body.allowed_routes)
            ? [...new Set(body.allowed_routes.map((r) => choice(r, ROUTES)))]
            : fail(400, 'Kies toegestane routes.');
        if (routes.some((r) => !c.routes.includes(r)))
          return fail(403, 'Deze route valt buiten de schoollicentie.');
        const mode = inherit
          ? standard.exercise_mode
          : choice(body.exercise_mode, ['free', 'assigned']);
        const current = await policy(c, group, target);
        const affected = await rows(
          db,
          `SELECT DISTINCT a.id,a.content_version_id FROM assignments a JOIN content_versions v ON v.id=a.content_version_id JOIN assignment_recipients ar ON ar.organization_id=a.organization_id AND ar.assignment_id=a.id WHERE a.organization_id=? AND a.group_id=? AND a.status='active' AND ar.status<>'finished' AND (?='*' OR ar.learner_id=?)`,
          c.org,
          group,
          target,
          target,
        );
        const impactHash = await hash({
          current,
          inherit,
          standard,
          affected,
          routes,
          mode,
          target,
          group,
        });
        if (body.preview === true)
          return response({
            impact_hash: impactHash,
            affected,
            policy: { allowed_routes: routes, exercise_mode: mode },
          });
        return response(
          await mutate(c, request, body, async () => {
            if (body.impact_hash !== impactHash || body.confirmed !== true)
              return fail(409, 'Bekijk eerst de actuele gevolgen en bevestig.');
            return {
              data: { ok: true },
              statements: [
                inherit
                  ? stmt(
                      db,
                      'DELETE FROM class_access_policies WHERE organization_id=? AND group_id=? AND subject_id=?',
                      c.org,
                      group,
                      target,
                    )
                  : stmt(
                      db,
                      'INSERT INTO class_access_policies VALUES (?,?,?,?,?,?) ON CONFLICT(organization_id,group_id,subject_id) DO UPDATE SET version=class_access_policies.version+1,allowed_routes=excluded.allowed_routes,exercise_mode=excluded.exercise_mode',
                      c.org,
                      group,
                      target,
                      current.version + 1,
                      canonical(routes),
                      mode,
                    ),
                audit(
                  c,
                  inherit ? 'policy.inherit' : 'policy.update',
                  `${group}:${target}`,
                ),
              ],
            };
          }),
        );
      }
      if (path[2] === 'assignments') {
        if (!writing)
          return response(
            await rows(
              db,
              'SELECT a.*,v.title FROM assignments a JOIN content_versions v ON v.id=a.content_version_id WHERE a.organization_id=? AND a.group_id=? ORDER BY a.created_at DESC',
              c.org,
              group,
            ),
          );
        if (path[3]) {
          const existing = await one(
            db,
            'SELECT id FROM assignments WHERE organization_id=? AND group_id=? AND id=?',
            c.org,
            group,
            path[3],
          );
          if (!existing) fail(404, 'Niet beschikbaar.');
          if (body.action !== 'withdraw' || body.confirmed !== true)
            fail(400, 'Bevestig het intrekken van deze opdracht.');
          return response(
            await mutate(c, request, body, async () => ({
              data: { ok: true },
              statements: [
                stmt(
                  db,
                  "UPDATE assignments SET status='withdrawn' WHERE organization_id=? AND group_id=? AND id=?",
                  c.org,
                  group,
                  path[3],
                ),
                audit(c, 'assignment.withdraw', path[3]),
              ],
            })),
          );
        }
        return response(
          await mutate(c, request, body, async () => {
            const a = await assignmentStatements(c, group, body);
            return { data: { id: a.id }, statements: a.statements };
          }),
          201,
        );
      }
      if (path[2] === 'recommendations' && writing) {
        const input = await inputs(c, group);
        const target = string(body.target_date, 10);
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(target) ||
          !Number.isFinite(Date.parse(target))
        )
          return fail(400, 'Kies een geldige lesdatum.');
        const source = choice(body.schedule_source, [
          'UNKNOWN',
          'TEACHER_SELECTED',
        ]);
        const output = recommendations(
          input.matrix.skills,
          input.matrix.rows,
          input.content,
        );
        return response(
          await mutate(
            c,
            request,
            body,
            async () => {
              const id = uid();
              const data = {
                id,
                target_date: target,
                schedule_source: source,
                rule_version: RULE_VERSION,
                suggestions: output,
                warning:
                  source === 'UNKNOWN'
                    ? 'Geen bevestigd rooster; kies de werkelijke lesdatum.'
                    : null,
              };
              return {
                data,
                statements: [
                  stmt(
                    db,
                    "INSERT INTO recommendation_previews VALUES (?,?,?,?,?,?,?,?,?,?,'pending')",
                    id,
                    c.org,
                    group,
                    c.member,
                    await hash(input),
                    target,
                    source,
                    canonical(data),
                    now(),
                    new Date(Date.now() + 15 * 60000).toISOString(),
                  ),
                  audit(c, 'recommendation.preview', id),
                ],
              };
            },
            false,
          ),
          201,
        );
      }
      if (path[2] === 'report' && !writing) {
        const report = {
          format: 'klink-inzicht-class-report',
          version: 1,
          exported_at: now(),
          school: c.org,
          group: g,
          matrix: await matrix(c, group),
          learners: await rows(
            db,
            'SELECT l.*,gm.status AS enrollment_status FROM school_learners l JOIN group_memberships gm ON gm.organization_id=l.organization_id AND gm.learner_id=l.id WHERE l.organization_id=? AND gm.group_id=?',
            c.org,
            group,
          ),
          revisions: await rows(
            db,
            'SELECT o.id,o.learner_id,o.skill_id,o.current_revision,r.* FROM teacher_observations o JOIN observation_revisions r ON r.organization_id=o.organization_id AND r.observation_id=o.id WHERE o.organization_id=? AND o.group_id=? ORDER BY o.id,r.revision',
            c.org,
            group,
          ),
          source_revisions: await rows(
            db,
            'SELECT o.id,o.learner_id,o.material_id,o.mode,o.current_revision,r.* FROM source_observations o JOIN source_observation_revisions r ON r.organization_id=o.organization_id AND r.observation_id=o.id WHERE o.organization_id=? AND o.group_id=? ORDER BY o.id,r.revision',
            c.org,
            group,
          ),
          attended_minutes_revisions: await rows(
            db,
            'SELECT h.id,h.learner_id,h.current_revision,r.* FROM learning_hours h JOIN learning_hour_revisions r ON r.organization_id=h.organization_id AND r.entry_id=h.id WHERE h.organization_id=? AND h.group_id=? ORDER BY h.id,r.revision',
            c.org,
            group,
          ),
          evidence: await rows(
            db,
            'SELECT e.*,r.reason AS revocation_reason,r.created_at AS revoked_at FROM evidence_events e LEFT JOIN evidence_revocations r ON r.organization_id=e.organization_id AND r.event_id=e.id WHERE e.organization_id=? AND e.group_id=?',
            c.org,
            group,
          ),
          attempts: await rows(
            db,
            'SELECT * FROM school_attempts WHERE organization_id=? AND group_id=?',
            c.org,
            group,
          ),
          assignments: await rows(
            db,
            'SELECT a.*,ar.learner_id,ar.status AS learner_status FROM assignments a JOIN assignment_recipients ar ON ar.organization_id=a.organization_id AND ar.assignment_id=a.id WHERE a.organization_id=? AND a.group_id=?',
            c.org,
            group,
          ),
          warning:
            'Observaties en TRAIN zijn geen gevalideerd beheersingsbewijs. Dit onderwijsrapport is geen databaseback-up.',
        };
        if (
          Number(
            (
              await one(
                db,
                'SELECT data_version FROM organizations WHERE id=?',
                c.org,
              )
            )?.data_version,
          ) !== c.version
        )
          fail(409, 'Gegevens zijn gewijzigd. Download opnieuw.');
        await audit(c, 'class.report', group).run();
        return response(report, 200, {
          'Content-Disposition':
            'attachment; filename="klink-inzicht-onderwijsrapport.json"',
        });
      }
      if (path[2] === 'export' && !writing) {
        await audit(c, 'class.export', group).run();
        const list = await rows(
          db,
          'SELECT l.id,l.display_name,gm.status FROM school_learners l JOIN group_memberships gm ON gm.organization_id=l.organization_id AND gm.learner_id=l.id WHERE gm.organization_id=? AND gm.group_id=? ORDER BY l.id',
          c.org,
          group,
        );
        const csv = [
          ['School', 'Klas', 'Cursist-ID', 'Naam', 'Status'],
          ...list.map((l) => [c.org, g.name, l.id, l.display_name, l.status]),
        ]
          .map((r) => r.map(csvCell).join(','))
          .join('\r\n');
        return new Response(csv, {
          headers: {
            ...headers,
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition':
              'attachment; filename="klink-inzicht-klas.csv"',
          },
        });
      }
    }
    if (path[0] === 'learners' && path[1] && group && !writing) {
      await teacher(c, group);
      const l = await learner(c, group, path[1], false);
      const observations = await rows(
        db,
        `SELECT o.*,r.payload,r.reason,r.recorded_at FROM teacher_observations o JOIN observation_revisions r ON r.organization_id=o.organization_id AND r.observation_id=o.id AND r.revision=o.current_revision WHERE o.organization_id=? AND o.group_id=? AND o.learner_id=? ORDER BY r.recorded_at DESC`,
        c.org,
        group,
        path[1],
      );
      const history = await rows(
        db,
        'SELECT r.* FROM observation_revisions r JOIN teacher_observations o ON o.organization_id=r.organization_id AND o.id=r.observation_id WHERE o.organization_id=? AND o.group_id=? AND o.learner_id=? ORDER BY r.recorded_at DESC',
        c.org,
        group,
        path[1],
      );
      return response({
        learner: l,
        observations: observations.map((o) => ({
          ...o,
          payload: json(o.payload),
        })),
        history: history.map((r) => ({ ...r, payload: json(r.payload) })),
        link: await one(
          db,
          'SELECT id,membership_id FROM account_links WHERE organization_id=? AND learner_id=? AND revoked_at IS NULL',
          c.org,
          path[1],
        ),
      });
    }
    if (path[0] === 'evidence' && group && !writing) {
      await teacher(c, group);
      const id = string(url.searchParams.get('learner')),
        skillId = string(url.searchParams.get('skill'));
      await learner(c, group, id, false);
      const skill = (await skills(db)).find((s) => s.id === skillId);
      if (!skill) return fail(404, 'Niet beschikbaar.');
      const events = await evidence(c, group, id, skillId);
      return response({
        skill,
        events,
        mastery: computeMastery(skill, events, now()),
      });
    }
    if (path[0] === 'learning-hours') {
      const gid = string(
        writing ? body.class_id : url.searchParams.get('class'),
      );
      const lid = string(
        writing ? body.learner_id : url.searchParams.get('learner'),
      );
      await teacher(c, gid, writing);
      await learner(c, gid, lid, writing);
      if (!writing)
        return response(
          await rows(
            db,
            `SELECT h.id,h.current_revision,r.* FROM learning_hours h JOIN learning_hour_revisions r ON r.organization_id=h.organization_id AND r.entry_id=h.id WHERE h.organization_id=? AND h.group_id=? AND h.learner_id=? ORDER BY r.attended_at,r.revision`,
            c.org,
            gid,
            lid,
          ),
        );
      return response(
        await mutate(c, request, body, async () => {
          const id = string(body.id, 36),
            expected = body.expected_revision;
          if (
            !/^[0-9a-f-]{36}$/i.test(id) ||
            !Number.isSafeInteger(expected) ||
            Number(expected) < 0
          )
            return fail(400, 'Ongeldige registratie.');
          const minutes = body.minutes;
          const at = string(body.attended_at, 32),
            date = Date.parse(at);
          if (
            !Number.isInteger(minutes) ||
            Number(minutes) < 0 ||
            Number(minutes) > 720 ||
            !Number.isFinite(date) ||
            date > Date.now() ||
            date < Date.now() - 366 * 86400000
          )
            return fail(
              400,
              'Controleer lesdatum en werkelijk gevolgde minuten (0–720).',
            );
          const old = await one(
            db,
            'SELECT * FROM learning_hours WHERE organization_id=? AND group_id=? AND learner_id=? AND id=?',
            c.org,
            gid,
            lid,
            id,
          );
          if (Number(old?.current_revision ?? 0) !== expected)
            return fail(
              409,
              'De urenregistratie is gewijzigd. Vernieuw en vergelijk.',
            );
          const reason = string(body.reason, 500);
          const revision = Number(expected) + 1;
          const statements = old
            ? [
                stmt(
                  db,
                  'UPDATE learning_hours SET current_revision=? WHERE organization_id=? AND id=?',
                  revision,
                  c.org,
                  id,
                ),
              ]
            : [
                stmt(
                  db,
                  'INSERT INTO learning_hours VALUES (?,?,?,?,?)',
                  id,
                  c.org,
                  gid,
                  lid,
                  revision,
                ),
              ];
          statements.push(
            stmt(
              db,
              'INSERT INTO learning_hour_revisions VALUES (?,?,?,?,?,?,?,?)',
              c.org,
              id,
              revision,
              new Date(date).toISOString(),
              Number(minutes),
              reason,
              c.member,
              now(),
            ),
            audit(c, 'learning-hours.save', id),
          );
          return { data: { id, revision }, statements };
        }),
        201,
      );
    }
    if (path[0] === 'visual-reports' && !writing) {
      const gid = string(url.searchParams.get('class'));
      await teacher(c, gid);
      const filter: ReportFilter = {};
      for (const key of [
        'learner',
        'mode',
        'material',
        'level',
        'condition',
        'from',
        'to',
      ] as const) {
        const value = url.searchParams.get(key);
        if (value) filter[key] = string(value, 100);
      }
      if (filter.learner) await learner(c, gid, filter.learner, false);
      if (filter.level) choice(filter.level, ROUTES);
      if (filter.mode) choice(filter.mode, ['word', 'sentence', 'text']);
      if (filter.material && !sourceMaterial(filter.material))
        return fail(400, 'Onbekend materiaal.');
      for (const key of ['from', 'to'] as const)
        if (
          filter[key] &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(filter[key]!) ||
            !Number.isFinite(Date.parse(filter[key]!)))
        )
          return fail(400, 'Ongeldige periode.');
      if (filter.from && filter.to && filter.from > filter.to)
        return fail(400, 'Begindatum ligt na einddatum.');
      for (const key of ['minHours', 'maxHours'] as const) {
        const raw = url.searchParams.get(key);
        if (raw !== null && raw !== '') {
          const value = Number(raw);
          if (!Number.isFinite(value) || value < 0 || value > 100000)
            return fail(400, 'Ongeldig urenfilter.');
          filter[key] = value;
        }
      }
      if (
        filter.minHours !== undefined &&
        filter.maxHours !== undefined &&
        filter.minHours > filter.maxHours
      )
        return fail(400, 'Ongeldig urenbereik.');
      const observations = await rows(
        db,
        `SELECT o.id,o.learner_id,o.current_revision,o.author_id,r.payload FROM source_observations o JOIN source_observation_revisions r ON r.organization_id=o.organization_id AND r.observation_id=o.id AND r.revision=o.current_revision WHERE o.organization_id=? AND o.group_id=?`,
        c.org,
        gid,
      );
      const hours = await rows(
        db,
        `SELECT h.id,h.learner_id,h.current_revision,r.attended_at,r.minutes FROM learning_hours h JOIN learning_hour_revisions r ON r.organization_id=h.organization_id AND r.entry_id=h.id AND r.revision=h.current_revision WHERE h.organization_id=? AND h.group_id=?`,
        c.org,
        gid,
      );
      const learners = await rows(
        db,
        `SELECT l.id,l.display_name,gm.started_at,gm.ended_at FROM school_learners l JOIN group_memberships gm ON gm.organization_id=l.organization_id AND gm.learner_id=l.id WHERE gm.organization_id=? AND gm.group_id=?`,
        c.org,
        gid,
      );
      const input = {
        observations: observations.map((o) => ({
          ...o,
          payload: json(o.payload),
        })),
        hours,
        learners,
      } as unknown as ReportInput;
      const report = buildReport(input, filter);
      // Existing evidence is a separate channel, never inferred from source marks.
      const registeredRows = await rows(
        db,
        `SELECT e.*,r.event_id AS revoked,o.current_revision FROM evidence_events e LEFT JOIN evidence_revocations r ON r.organization_id=e.organization_id AND r.event_id=e.id LEFT JOIN teacher_observations o ON o.organization_id=e.organization_id AND o.id=e.source_id AND e.source_type='observation' WHERE e.organization_id=? AND e.group_id=?`,
        c.org,
        gid,
      );
      const registered = registeredRows.map((e) => ({
        ...json<Evidence>(e.payload),
        id: String(e.id),
        learner_id: String(e.learner_id),
        skill_id: String(e.skill_id),
        source_id: String(e.source_id),
        source_revision: Number(e.source_revision),
        revoked: Boolean(
          e.revoked ||
          (e.source_type === 'observation' &&
            e.current_revision !== e.source_revision),
        ),
      }));
      const catalog = await skills(db);
      const proofs = registered
        .filter(
          (e) =>
            (!filter.learner || e.learner_id === filter.learner) &&
            (!filter.from || e.occurred_at.slice(0, 10) >= filter.from) &&
            (!filter.to || e.occurred_at.slice(0, 10) <= filter.to),
        )
        .map((e) => {
          const skill = catalog.find((s) => s.id === e.skill_id);
          return {
            ...e,
            eligible: Boolean(
              skill && computeMastery(skill, [e], now()).measured,
            ),
            skill_label: skill?.label ?? e.skill_id,
          };
        });
      if (
        Number(
          (
            await one(
              db,
              'SELECT data_version FROM organizations WHERE id=?',
              c.org,
            )
          )?.data_version,
        ) !== c.version
      )
        return fail(
          409,
          'De schoolgegevens zijn gewijzigd tijdens het ophalen. Vernieuw de rapportage.',
        );
      return response({
        ...report,
        learners,
        proofs,
        hours: input.hours.filter(
          (h) => !filter.learner || h.learner_id === filter.learner,
        ),
        generated_at: now(),
        school: c.org,
        class_id: gid,
      });
    }
    // Original Word/Zin/Tekst instrument, separated from general teacher observations.
    // No skill id or MEASURE event is assigned to these source-bound marks.
    if (path[0] === 'source-observations') {
      const gid = string(
        writing ? body.class_id : url.searchParams.get('class'),
      );
      const lid = string(
        writing ? body.learner_id : url.searchParams.get('learner'),
      );
      await teacher(c, gid, writing);
      await learner(c, gid, lid, writing);
      if (!writing && path[1]) {
        const found = await one(
          db,
          `SELECT o.*,g.name AS class_name,l.display_name AS learner_name,org.name AS school_name FROM source_observations o JOIN groups g ON g.organization_id=o.organization_id AND g.id=o.group_id JOIN school_learners l ON l.organization_id=o.organization_id AND l.id=o.learner_id JOIN organizations org ON org.id=o.organization_id WHERE o.organization_id=? AND o.group_id=? AND o.learner_id=? AND o.id=?`,
          c.org,
          gid,
          lid,
          path[1],
        );
        if (!found) return fail(404, 'Niet beschikbaar.');
        const history = await rows(
          db,
          'SELECT revision,payload,changed_by,recorded_at FROM source_observation_revisions WHERE organization_id=? AND observation_id=? ORDER BY revision',
          c.org,
          path[1],
        );
        const revision = url.searchParams.get('revision')
          ? Number(url.searchParams.get('revision'))
          : Number(found.current_revision);
        const selected = history.find((r) => r.revision === revision);
        if (!selected) return fail(404, 'Revisie niet beschikbaar.');
        if (path[2] === 'export')
          await audit(c, 'source-observation.export', path[1]).run();
        return response({
          observation: found,
          revision,
          payload: json(selected.payload),
          history: history.map((r) => ({ ...r, payload: json(r.payload) })),
          exported_at: now(),
        });
      }
      if (!writing) {
        const found = await rows(
          db,
          `SELECT o.id,o.material_id,o.mode,o.current_revision,o.author_id,
                  o.created_at,o.updated_at,r.payload
             FROM source_observations o
             JOIN source_observation_revisions r
               ON r.organization_id=o.organization_id AND r.observation_id=o.id
              AND r.revision=o.current_revision
            WHERE o.organization_id=? AND o.group_id=? AND o.learner_id=?
            ORDER BY o.updated_at DESC,o.id LIMIT 200`,
          c.org,
          gid,
          lid,
        );
        return response(
          found.map((o) => ({
            ...o,
            editable: o.author_id === c.member,
            payload: json(o.payload),
          })),
        );
      }
      return response(
        await mutate(c, request, body, async () => {
          const id = string(body.id, 36);
          if (
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              id,
            )
          )
            return fail(400, 'Ongeldige observatie-identificatie.');
          const materialId = string(body.material_id, 10);
          const mode = choice(body.mode, [
            'word',
            'sentence',
            'text',
          ]) as SourceMode;
          if (
            !sourceMaterial(materialId) ||
            sourceCriteria(mode, materialId).length !== 6
          )
            return fail(400, 'Onbekend observatiemateriaal.');
          const values = body.values;
          if (
            !Array.isArray(values) ||
            values.length !== 6 ||
            !values.every((v) => v === null || v === 0 || v === 1 || v === 2)
          )
            return fail(
              400,
              'Een observatie heeft precies zes geldige vakjes.',
            );
          const expected = body.expected_revision;
          if (!Number.isSafeInteger(expected) || Number(expected) < 0)
            return fail(400, 'Ongeldige revisie.');
          const observed = string(body.observed_at, 32);
          const moment = Date.parse(observed);
          if (
            !Number.isFinite(moment) ||
            moment > Date.now() + 60000 ||
            moment < Date.now() - 366 * 86400000
          )
            return fail(
              400,
              'Kies een observatiedatum binnen het afgelopen jaar.',
            );
          const payload = {
            source: SOURCE_KEY,
            source_version: SOURCE_VERSION,
            material_id: materialId,
            mode,
            values,
            level: body.level ? choice(body.level, ROUTES) : '',
            condition: string(body.condition ?? '', 100, true),
            reason: string(body.reason ?? '', 500, true),
            note: string(body.note ?? '', 1000, true),
            next: string(body.next ?? '', 1000, true),
            observed_at: new Date(moment).toISOString(),
          };
          const existing = await one(
            db,
            'SELECT * FROM source_observations WHERE organization_id=? AND group_id=? AND learner_id=? AND id=?',
            c.org,
            gid,
            lid,
            id,
          );
          if (
            existing &&
            (existing.author_id !== c.member ||
              existing.mode !== mode ||
              existing.material_id !== materialId)
          )
            return fail(403, 'Deze observatie mag je niet aanpassen.');
          if ((existing ? Number(existing.current_revision) : 0) !== expected)
            return fail(
              409,
              'De observatie is gewijzigd. Vernieuw de gegevens.',
            );
          const revision = Number(expected) + 1;
          const timestamp = now();
          const statements = existing
            ? [
                stmt(
                  db,
                  'UPDATE source_observations SET current_revision=?,updated_at=? WHERE organization_id=? AND group_id=? AND learner_id=? AND id=? AND current_revision=?',
                  revision,
                  timestamp,
                  c.org,
                  gid,
                  lid,
                  id,
                  expected,
                ),
              ]
            : [
                stmt(
                  db,
                  'INSERT INTO source_observations VALUES (?,?,?,?,?,?,?,?,?,?)',
                  id,
                  c.org,
                  gid,
                  lid,
                  c.member,
                  materialId,
                  mode,
                  revision,
                  timestamp,
                  timestamp,
                ),
              ];
          statements.push(
            stmt(
              db,
              'INSERT INTO source_observation_revisions VALUES (?,?,?,?,?,?)',
              c.org,
              id,
              revision,
              canonical(payload),
              c.member,
              timestamp,
            ),
            audit(
              c,
              existing
                ? 'source-observation.revise'
                : 'source-observation.create',
              id,
            ),
          );
          return {
            data: { id, revision, saved_at: timestamp, source: SOURCE_KEY },
            statements,
          };
        }),
        201,
      );
    }
    if (path[0] === 'observations' && writing) {
      const gid = string(body.class_id),
        lid = string(body.learner_id);
      await teacher(c, gid, true);
      await learner(c, gid, lid);
      return response(
        await mutate(c, request, body, async () => {
          const existing = path[1]
            ? await one(
                db,
                'SELECT * FROM teacher_observations WHERE organization_id=? AND group_id=? AND learner_id=? AND id=?',
                c.org,
                gid,
                lid,
                path[1],
              )
            : null;
          if (path[1] && (!existing || existing.author_id !== c.member))
            return fail(
              403,
              'Alleen de auteur kan deze observatie corrigeren.',
            );
          if (existing && existing.current_revision !== body.expected_revision)
            return fail(
              409,
              'De observatie is gewijzigd. Vernieuw en vergelijk.',
            );
          const skill = (await skills(db)).find((s) => s.id === body.skill_id);
          if (!skill || (existing && existing.skill_id !== skill.id))
            return fail(400, 'Kies de oorspronkelijke geldige vaardigheid.');
          const observed = string(body.observed_at, 30);
          const t = Date.parse(observed);
          if (
            !Number.isFinite(t) ||
            t > Date.now() + 60000 ||
            t < Date.now() - 366 * 86400000
          )
            return fail(
              400,
              'Kies een observatiedatum binnen het afgelopen jaar.',
            );
          const payload = {
            skill_version: skill.rubric.version,
            situation: string(body.situation, 300),
            outcome: choice(body.outcome, [
              'successful',
              'partial',
              'not_yet',
              'not_assessed',
            ]),
            independence: choice(body.independence, [
              'independent',
              'hint',
              'model',
              'unknown',
            ]),
            note: string(body.note ?? '', 1000, true),
            observed_at: new Date(t).toISOString(),
          };
          const id = existing ? String(existing.id) : uid(),
            revision = existing ? Number(existing.current_revision) + 1 : 1;
          const reason = existing
            ? string(body.reason, 300)
            : 'Nieuwe observatie';
          const evId = uid();
          // No existing Klink instrument has a reviewed MEASURE contract. Notes remain TRAIN evidence.
          const ev: Evidence = {
            id: evId,
            occurred_at: payload.observed_at,
            day: new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Europe/Amsterdam',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(new Date(t)),
            session_id: id,
            item_set: id,
            identity_valid: true,
            source_valid: true,
            relation: 'TRAIN',
            rubric_version: skill.rubric.version,
            independent: false,
            feedback_reused: false,
            transfer: false,
            independence: payload.independence,
            total: 0,
            correct: 0,
            outcome: payload.outcome,
          };
          const statements = existing
            ? [
                stmt(
                  db,
                  'UPDATE teacher_observations SET current_revision=? WHERE organization_id=? AND id=? AND current_revision=?',
                  revision,
                  c.org,
                  id,
                  revision - 1,
                ),
              ]
            : [
                stmt(
                  db,
                  'INSERT INTO teacher_observations VALUES (?,?,?,?,?,?,1,?)',
                  id,
                  c.org,
                  gid,
                  lid,
                  c.member,
                  skill.id,
                  now(),
                ),
              ];
          statements.push(
            stmt(
              db,
              'INSERT INTO observation_revisions VALUES (?,?,?,?,?,?,?)',
              c.org,
              id,
              revision,
              canonical(payload),
              c.member,
              reason,
              now(),
            ),
            stmt(
              db,
              "INSERT INTO evidence_events VALUES (?,?,?,?,?,'observation',?,?,?,?,?)",
              evId,
              c.org,
              gid,
              lid,
              skill.id,
              id,
              revision,
              canonical(ev),
              await hash(ev),
              now(),
            ),
            stmt(
              db,
              "INSERT INTO outbox_events VALUES (?,?,?,?,?,'queued',?,NULL)",
              uid(),
              c.org,
              gid,
              lid,
              skill.id,
              now(),
            ),
            audit(
              c,
              existing ? 'observation.correct' : 'observation.create',
              id,
            ),
          );
          return {
            data: {
              id,
              revision,
              status: 'SAVED',
              mastery_refresh_status: 'QUEUED',
              evidence_eligible: false,
              message: 'Opgeslagen als observatie; geen meetbewijs.',
            },
            statements,
          };
        }),
        201,
      );
    }
    if (path[0] === 'plans' && path[1] && writing) {
      const p = await one(
        db,
        'SELECT * FROM recommendation_previews WHERE organization_id=? AND id=?',
        c.org,
        path[1],
      );
      if (!p) return fail(404, 'Niet beschikbaar.');
      await teacher(c, String(p.group_id), true);
      return response(
        await mutate(c, request, body, async () => {
          // A committed decision must remain replayable when its response was lost.
          if (p.status !== 'pending')
            return fail(409, 'Dit voorstel is al afgehandeld.');
          const action = choice(body.action, ['approve', 'reject']);
          if (action === 'reject')
            return {
              data: { ok: true },
              statements: [
                stmt(
                  db,
                  "UPDATE recommendation_previews SET status='rejected' WHERE organization_id=? AND id=?",
                  c.org,
                  path[1],
                ),
                audit(c, 'recommendation.reject', path[1]),
              ],
            };
          if (
            body.confirmed !== true ||
            String(p.expires_at) < now() ||
            (await hash(await inputs(c, String(p.group_id)))) !== p.input_hash
          )
            return fail(
              409,
              'Voorstel verouderd. Bereken opnieuw en controleer het resultaat.',
            );
          const selections = Array.isArray(body.assignments)
            ? (body.assignments as Record<string, unknown>[])
            : [];
          if (selections.length > 20) return fail(400, 'Te veel opdrachten.');
          const statements: D1PreparedStatement[] = [];
          const ids: string[] = [];
          for (const selection of selections) {
            const a = await assignmentStatements(
              c,
              String(p.group_id),
              selection,
            );
            statements.push(...a.statements);
            ids.push(a.id);
          }
          const id = uid();
          statements.push(
            stmt(
              db,
              'INSERT INTO approved_lesson_plans VALUES (?,?,?,?,?,?)',
              id,
              c.org,
              path[1],
              c.member,
              canonical({
                note: string(body.note ?? '', 1000, true),
                assignments: ids,
              }),
              now(),
            ),
            stmt(
              db,
              "UPDATE recommendation_previews SET status='approved' WHERE organization_id=? AND id=?",
              c.org,
              path[1],
            ),
            audit(c, 'recommendation.approve', id),
          );
          return { data: { id, assignments: ids }, statements };
        }),
      );
    }
    if (path[0] === 'invites' && writing) {
      if (c.role !== 'registrar')
        return fail(
          403,
          'Alleen de bevoegde schoolregistrar kan een uitnodiging maken.',
        );
      const lid = string(body.learner_id),
        mid = string(body.membership_id);
      if (
        !(await one(
          db,
          'SELECT id FROM school_learners WHERE organization_id=? AND id=?',
          c.org,
          lid,
        )) ||
        !(await one(
          db,
          "SELECT id FROM memberships WHERE organization_id=? AND id=? AND role='learner' AND status='active'",
          c.org,
          mid,
        ))
      )
        return fail(404, 'Niet beschikbaar.');
      if (body.identity_checked !== true)
        return fail(422, 'Identiteitscontrole is vereist.');
      const token = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (v) => v.toString(16).padStart(2, '0'),
      ).join('');
      const id = uid();
      const saved = await mutate(c, request, body, async () => ({
        data: { id },
        statements: [
          stmt(
            db,
            "INSERT INTO school_invites VALUES (?,?,?,?,?,?,?,'created')",
            id,
            c.org,
            lid,
            mid,
            c.member,
            await hash(token),
            new Date(Date.now() + 30 * 60000).toISOString(),
          ),
          audit(c, 'invite.create', id),
        ],
      }));
      if ((saved as { id: string }).id !== id)
        return fail(
          409,
          'Deze uitnodiging is al gemaakt. Maak zo nodig een nieuwe uitnodiging; de geheime code wordt niet opnieuw getoond.',
        );
      return response({ id, token, synthetic_only: true }, 201);
    }
    if (path[0] === 'accept-invite' && writing) {
      if (c.role !== 'learner')
        return fail(403, 'De bedoelde cursist moet zelf bevestigen.');
      return response(
        await mutate(c, request, body, async () => {
          const invite = await one(
            db,
            "SELECT * FROM school_invites WHERE organization_id=? AND membership_id=? AND token_hash=? AND status='created' AND expires_at>?",
            c.org,
            c.member,
            await hash(string(body.token, 64)),
            now(),
          );
          if (!invite) return fail(409, 'Uitnodiging niet beschikbaar.');
          const id = uid();
          return {
            data: { id },
            statements: [
              stmt(
                db,
                'INSERT INTO account_links VALUES (?,?,?,?,?,?,?,NULL)',
                id,
                c.org,
                String(invite.learner_id),
                c.member,
                String(invite.created_by),
                String(invite.id),
                now(),
              ),
              stmt(
                db,
                "UPDATE school_invites SET status='accepted' WHERE organization_id=? AND id=?",
                c.org,
                String(invite.id),
              ),
              audit(c, 'link.accept', id),
            ],
          };
        }),
      );
    }
    if (path[0] === 'unlink' && writing) {
      if (c.role !== 'registrar')
        return fail(403, 'Alleen de bevoegde schoolregistrar kan ontkoppelen.');
      const id = string(body.link_id);
      return response(
        await mutate(c, request, body, async () => {
          if (
            !(await one(
              db,
              'SELECT id FROM account_links WHERE organization_id=? AND id=? AND revoked_at IS NULL',
              c.org,
              id,
            ))
          )
            return fail(404, 'Niet beschikbaar.');
          return {
            data: { ok: true },
            statements: [
              stmt(
                db,
                'UPDATE account_links SET revoked_at=? WHERE organization_id=? AND id=?',
                now(),
                c.org,
                id,
              ),
              audit(c, 'link.revoke', id),
            ],
          };
        }),
      );
    }
    if (path[0] === 'school-practice') {
      const access = await schoolAccess(
        c,
        group,
        url.searchParams.get('content'),
        url.searchParams.get('assignment'),
      );
      if (!writing)
        return response({
          content: access.content,
          school: c.org,
          class: group,
          learner: access.lid,
          assignment: access.assignment?.id ?? null,
          context: 'school',
          measurement: 'TRAIN',
        });
      return response(
        await mutate(c, request, body, async () => {
          const answer = string(body.answer, 200),
            id = uid(),
            at = now();
          const exercise = access.content.metadata.exercise as {
            answer: { correctOptionIds: string[] };
            options: { id: string }[];
          };
          if (!exercise?.options?.some((o) => o.id === answer))
            return fail(422, 'Dit antwoord hoort niet bij deze oefenversie.');
          const correct = exercise.answer.correctOptionIds.includes(answer);
          const ev: Evidence = {
            id,
            occurred_at: at,
            day: at.slice(0, 10),
            session_id: id,
            item_set: access.content.version_hash,
            identity_valid: true,
            source_valid: true,
            relation: 'TRAIN',
            rubric_version: 'draft-1',
            independent: false,
            feedback_reused: true,
            transfer: false,
            independence: 'unknown',
            total: 1,
            correct: correct ? 1 : 0,
            outcome: correct ? 'successful' : 'not_yet',
          };
          const storedEvidence = {
            ...ev,
            content_version_id: access.content.id,
            content_hash: access.content.version_hash,
          };
          const statements = [
            stmt(
              db,
              'INSERT INTO school_attempts VALUES (?,?,?,?,?,?,?,?,?)',
              id,
              c.org,
              access.group,
              access.lid,
              access.assignment ? String(access.assignment.id) : null,
              access.content.id,
              answer,
              correct ? 1 : 0,
              at,
            ),
            stmt(
              db,
              "INSERT INTO evidence_events VALUES (?,?,?,?,?,'assessment',?,1,?,?,?)",
              id,
              c.org,
              access.group,
              access.lid,
              access.content.skill_id,
              id,
              canonical(storedEvidence),
              await hash(storedEvidence),
              at,
            ),
            stmt(
              db,
              "INSERT INTO outbox_events VALUES (?,?,?,?,?,'queued',?,NULL)",
              uid(),
              c.org,
              access.group,
              access.lid,
              access.content.skill_id,
              at,
            ),
            audit(c, 'attempt.submit', id),
          ];
          if (access.assignment)
            statements.push(
              stmt(
                db,
                'UPDATE assignment_recipients SET status=? WHERE organization_id=? AND assignment_id=? AND learner_id=?',
                correct ? 'finished' : 'started',
                c.org,
                String(access.assignment.id),
                access.lid,
              ),
            );
          return {
            data: {
              id,
              correct,
              status: 'SAVED',
              evidence_eligible: false,
              mastery_refresh_status: 'QUEUED',
            },
            statements,
          };
        }),
        201,
      );
    }
    return response({ error: 'Niet beschikbaar.' }, 404);
  } catch (error) {
    if (error instanceof HttpError || error instanceof MfaError)
      return response({ error: error.message }, error.status);
    // Do not log names, notes, answers, tokens or database error text.
    if (
      error instanceof Error &&
      error.message.startsWith('D1_ERROR:') &&
      /daily.*limit|limit.*daily/i.test(error.message)
    ) {
      console.error('inzicht.database_daily_limit');
      return response(
        {
          error:
            'De testomgeving heeft de dagelijkse databaselimiet bereikt. Probeer later opnieuw.',
        },
        503,
        {
          'Retry-After': String(
            Math.ceil((86400000 - (Date.now() % 86400000)) / 1000),
          ),
        },
      );
    }
    console.error('inzicht.request_failed');
    return response(
      { error: 'Opslaan of ophalen is niet gelukt. Probeer opnieuw.' },
      500,
    );
  }
}
