import { assignedLesson } from './teaching.ts';

export type TeachingRole = 'teacher' | 'learner';
const roles = ['teacher', 'learner'];
const cookieName = (role: TeachingRole) => `klink_${role}`;
const fail = (message: string, status = 400) =>
  Response.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
const reply = (body: unknown) =>
  Response.json(body, { headers: { 'Cache-Control': 'no-store' } });
export const normalizeCode = (value: string) =>
  value.replace(/[\s-]/g, '').toUpperCase();
export async function codeHash(value: string) {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(bytes)]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
}
export function newCode(role: TeachingRole) {
  if (role === 'teacher')
    return [...crypto.getRandomValues(new Uint8Array(16))]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  let code = '';
  while (code.length < 16)
    for (const byte of crypto.getRandomValues(new Uint8Array(24))) {
      if (byte < 250 && code.length < 16) code += byte % 10;
    }
  return code;
}
export async function teachingRequest(request: Request, db: D1Database) {
  const url = new URL(request.url);
  if (
    url.protocol !== 'https:' &&
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
  )
    return fail('Open Klink via een beveiligde verbinding.', 403);
  const role = url.searchParams.get('role') as TeachingRole;
  if (!roles.includes(role)) return fail('Kies docent of cursist.');
  if (!['GET', 'POST'].includes(request.method))
    return fail('Niet ondersteund.', 405);
  let data: Record<string, unknown> = {};
  if (request.method === 'POST') {
    if (request.headers.get('origin') !== url.origin)
      return fail('Open Klink opnieuw en probeer het nog eens.', 403);
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader)
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 16000) {
          await reader.cancel();
          return fail('Te veel gegevens.', 413);
        }
        chunks.push(value);
      }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const text = new TextDecoder().decode(bytes);
    try {
      data = JSON.parse(text);
    } catch {
      return fail('De gegevens zijn niet leesbaar.');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data))
      return fail('De gegevens zijn niet leesbaar.');
  }
  const now = Date.now();
  const cookie =
    (request.headers.get('cookie') ?? '')
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(cookieName(role) + '='))
      ?.split('=')[1] ?? '';
  const tokenHash = await codeHash(cookie);
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  const setCookie = (value: string, seconds: number) =>
    `${cookieName(role)}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${secure}`;
  if (data.action === 'logout') {
    await db
      .prepare(
        'DELETE FROM teaching_sessions WHERE token_hash = ? AND role = ?',
      )
      .bind(tokenHash, role)
      .run();
    return Response.json(
      { ok: true },
      {
        headers: {
          'Set-Cookie': setCookie('', 0),
          'Cache-Control': 'no-store',
        },
      },
    );
  }
  if (data.action === 'login') {
    if (typeof data.code !== 'string' || data.code.length > 100)
      return fail('Vul je code in.');
    const code = normalizeCode(data.code);
    const ipKey = await codeHash(
      `${role}:${request.headers.get('cf-connecting-ip') ?? 'local'}`,
    );
    await db
      .prepare('DELETE FROM teaching_login_limits WHERE expires_at < ?')
      .bind(now)
      .run();
    const limit = await db
      .prepare(
        'INSERT INTO teaching_login_limits (key, attempts, expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1 RETURNING attempts',
      )
      .bind(ipKey, now + 600000)
      .first<{ attempts: number }>();
    if ((limit?.attempts ?? 999) > (role === 'teacher' ? 20 : 100))
      return fail(
        'Te vaak geprobeerd. Probeer het over tien minuten opnieuw.',
        429,
      );
    const table =
      role === 'teacher' ? 'teaching_teachers' : 'teaching_learners';
    const person = await db
      .prepare(`SELECT id FROM ${table} WHERE code_hash = ?`)
      .bind(await codeHash(code))
      .first<{ id: string }>();
    if (!person)
      return fail(
        'Deze code klopt niet. Controleer de code en probeer opnieuw.',
        401,
      );
    const token = newCode('teacher') + newCode('teacher');
    const results = await db.batch([
      db
        .prepare(
          'DELETE FROM teaching_sessions WHERE expires_at < ? OR (token_hash = ? AND role = ?)',
        )
        .bind(now, tokenHash, role),
      db
        .prepare(
          `INSERT INTO teaching_sessions (token_hash, role, person_id, expires_at) SELECT ?,?,id,? FROM ${table} WHERE id = ? AND code_hash = ?`,
        )
        .bind(
          await codeHash(token),
          role,
          now + 8 * 3600000,
          person.id,
          await codeHash(code),
        ),
    ]);
    if (!results[1].meta.changes)
      return fail('Deze code is niet meer beschikbaar.', 401);
    return Response.json(
      { ok: true },
      {
        headers: {
          'Set-Cookie': setCookie(token, 8 * 3600),
          'Cache-Control': 'no-store',
        },
      },
    );
  }
  const session = await db
    .prepare(
      'SELECT person_id FROM teaching_sessions WHERE token_hash = ? AND role = ? AND expires_at > ?',
    )
    .bind(tokenHash, role, now)
    .first<{ person_id: string }>();
  if (!session) return fail('Log in met je eigen code.', 401);
  const table = role === 'teacher' ? 'teaching_teachers' : 'teaching_learners';
  const person = await db
    .prepare(`SELECT id, name FROM ${table} WHERE id = ?`)
    .bind(session.person_id)
    .first<{ id: string; name: string }>();
  if (!person) return fail('Deze toegang is niet meer beschikbaar.', 401);
  if (role === 'learner') {
    if (request.method === 'GET') {
      const assignments = await db
        .prepare(
          'SELECT * FROM teaching_assignments WHERE learner_id = ? ORDER BY created_at DESC, id',
        )
        .bind(person.id)
        .all();
      return reply({ person, assignments: assignments.results });
    }
    if (data.action !== 'complete' || typeof data.id !== 'string')
      return fail('Niet toegestaan.', 403);
    const assignment = await db
      .prepare(
        'SELECT * FROM teaching_assignments WHERE id = ? AND learner_id = ?',
      )
      .bind(data.id, person.id)
      .first<{ package_id: string; lesson_id: string }>();
    if (!assignment) return fail('Deze opdracht is niet beschikbaar.', 404);
    if (!assignedLesson(assignment.package_id, assignment.lesson_id))
      return fail('Deze leesstap is niet beschikbaar.', 409);
    await db
      .prepare(
        'UPDATE teaching_assignments SET completed_at = COALESCE(completed_at,?) WHERE id = ? AND learner_id = ?',
      )
      .bind(new Date(now).toISOString(), data.id, person.id)
      .run();
    return reply({ ok: true });
  }
  if (request.method === 'GET') {
    const [groups, learners, assignments] = await db.batch([
      db
        .prepare(
          'SELECT id, name FROM teaching_groups WHERE teacher_id = ? ORDER BY name, id',
        )
        .bind(person.id),
      db
        .prepare(
          'SELECT l.id, l.group_id, l.name FROM teaching_learners l JOIN teaching_groups g ON g.id = l.group_id WHERE g.teacher_id = ? ORDER BY l.name, l.id',
        )
        .bind(person.id),
      db
        .prepare(
          'SELECT a.* FROM teaching_assignments a JOIN teaching_learners l ON l.id = a.learner_id JOIN teaching_groups g ON g.id = l.group_id WHERE g.teacher_id = ? ORDER BY a.created_at DESC, a.id',
        )
        .bind(person.id),
    ]);
    return reply({
      person,
      groups: groups.results,
      learners: learners.results,
      assignments: assignments.results,
    });
  }
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const validName =
    name.length > 0 && name.length <= 80 && !/\p{Cc}/u.test(name);
  if (data.action === 'create-group') {
    if (!validName)
      return fail('Vul een groepsnaam in van maximaal 80 tekens.');
    const id = crypto.randomUUID();
    await db
      .prepare(
        'INSERT INTO teaching_groups (id,teacher_id,name) VALUES (?,?,?)',
      )
      .bind(id, person.id, name)
      .run();
    return reply({ id });
  }
  if (typeof data.groupId !== 'string') return fail('Kies een groep.');
  const group = await db
    .prepare('SELECT id FROM teaching_groups WHERE id = ? AND teacher_id = ?')
    .bind(data.groupId, person.id)
    .first();
  if (!group) return fail('Deze groep is niet beschikbaar.', 404);
  if (data.action === 'rename-group') {
    if (!validName)
      return fail('Vul een groepsnaam in van maximaal 80 tekens.');
    await db
      .prepare(
        'UPDATE teaching_groups SET name = ? WHERE id = ? AND teacher_id = ?',
      )
      .bind(name, data.groupId, person.id)
      .run();
    return reply({ ok: true });
  }
  if (data.action === 'create-learner') {
    if (!validName)
      return fail('Vul een cursistnaam in van maximaal 80 tekens.');
    const id = crypto.randomUUID(),
      code = newCode('learner');
    await db
      .prepare(
        'INSERT INTO teaching_learners (id,group_id,name,code_hash) VALUES (?,?,?,?)',
      )
      .bind(id, data.groupId, name, await codeHash(code))
      .run();
    return reply({ id, name, code });
  }
  const learners = await db
    .prepare('SELECT id FROM teaching_learners WHERE group_id = ?')
    .bind(data.groupId)
    .all<{ id: string }>();
  const ids = new Set(learners.results.map((l) => l.id));
  if (data.action === 'assign') {
    if (
      typeof data.packageId !== 'string' ||
      typeof data.lessonId !== 'string' ||
      !assignedLesson(data.packageId, data.lessonId)
    )
      return fail('Kies een beschikbare leesstap.');
    if (
      !Array.isArray(data.learnerIds) ||
      !data.learnerIds.length ||
      data.learnerIds.length > 100 ||
      data.learnerIds.some((id) => typeof id !== 'string' || !ids.has(id)) ||
      new Set(data.learnerIds).size !== data.learnerIds.length
    )
      return fail('Kies één tot honderd cursisten uit deze groep.');
    const results = await db.batch(
      data.learnerIds.map((id) =>
        db
          .prepare(
            'INSERT OR IGNORE INTO teaching_assignments (id,learner_id,package_id,lesson_id,created_at) VALUES (?,?,?,?,?)',
          )
          .bind(
            crypto.randomUUID(),
            id,
            data.packageId,
            data.lessonId,
            new Date(now).toISOString(),
          ),
      ),
    );
    return reply({ added: results.reduce((n, r) => n + r.meta.changes, 0) });
  }
  if (typeof data.learnerId !== 'string' || !ids.has(data.learnerId))
    return fail('Deze cursist is niet beschikbaar.', 404);
  if (data.action === 'rename-learner') {
    if (!validName)
      return fail('Vul een cursistnaam in van maximaal 80 tekens.');
    await db
      .prepare(
        'UPDATE teaching_learners SET name = ? WHERE id = ? AND group_id = ?',
      )
      .bind(name, data.learnerId, data.groupId)
      .run();
    return reply({ ok: true });
  }
  if (data.action === 'reset-code') {
    const code = newCode('learner');
    await db.batch([
      db
        .prepare(
          'UPDATE teaching_learners SET code_hash = ? WHERE id = ? AND group_id = ?',
        )
        .bind(await codeHash(code), data.learnerId, data.groupId),
      db
        .prepare(
          "DELETE FROM teaching_sessions WHERE role = 'learner' AND person_id = ?",
        )
        .bind(data.learnerId),
    ]);
    return reply({ code });
  }
  return fail('Onbekende handeling.');
}
