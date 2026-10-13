import { getDbBinding } from '@/db';

type ReviewItemInput = { locale?: unknown; word?: unknown };

export async function GET() {
  const db = getDbBinding();
  const items = await db
    .prepare(
      `SELECT id, locale, word, status, updated_at AS updatedAt
      FROM review_items
      WHERE organization_id = ?
      ORDER BY updated_at DESC
      LIMIT 40`,
    )
    .bind('taalroute-demo')
    .all();
  return Response.json({ items: items.results });
}

export async function POST(request: Request) {
  const input = (await request.json()) as ReviewItemInput;
  if (typeof input.locale !== 'string' || typeof input.word !== 'string') {
    return Response.json({ error: 'Ongeldig woorditem.' }, { status: 400 });
  }
  const word = input.word.trim();
  if (!word || word.length > 80) {
    return Response.json({ error: 'Vul een geldig woord in.' }, { status: 400 });
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const db = getDbBinding();
  await db.prepare(
    `INSERT INTO review_items
    (id, organization_id, locale, word, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'draft', ?, ?)`,
  ).bind(id, 'taalroute-demo', input.locale, word, now, now).run();
  return Response.json({ item: { id, locale: input.locale, word, status: 'draft', updatedAt: now } }, { status: 201 });
}
