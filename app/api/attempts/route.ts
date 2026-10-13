import { getDbBinding } from '@/db';

type AttemptInput = {
  exerciseId?: unknown;
  skillKey?: unknown;
  answer?: unknown;
  isCorrect?: unknown;
  helpCount?: unknown;
  responseMs?: unknown;
};

const organizationId = 'taalroute-demo';
const learnerId = 'fatima-a';

export async function GET() {
  const db = getDbBinding();
  const mastery = await db
    .prepare(
      `SELECT
        skill_key AS skillKey,
        score,
        correct_count AS correctCount,
        attempt_count AS attemptCount
      FROM mastery
      WHERE organization_id = ? AND learner_id = ?
      ORDER BY updated_at DESC`,
    )
    .bind(organizationId, learnerId)
    .all();

  return Response.json({ mastery: mastery.results });
}

export async function POST(request: Request) {
  const input = (await request.json()) as AttemptInput;
  if (
    typeof input.exerciseId !== 'string' ||
    typeof input.skillKey !== 'string' ||
    typeof input.answer !== 'string' ||
    typeof input.isCorrect !== 'boolean' ||
    typeof input.helpCount !== 'number' ||
    typeof input.responseMs !== 'number'
  ) {
    return Response.json({ error: 'Ongeldige poging.' }, { status: 400 });
  }

  const db = getDbBinding();
  const now = new Date().toISOString();
  const initialScore = input.isCorrect ? 12 : 0;

  await db.batch([
    db
      .prepare(
        `INSERT INTO attempts
        (id, organization_id, learner_id, session_id, exercise_id, skill_key, answer, is_correct, help_count, response_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        organizationId,
        learnerId,
        'pb-start-02',
        input.exerciseId,
        input.skillKey,
        input.answer,
        input.isCorrect ? 1 : 0,
        Math.max(0, Math.round(input.helpCount)),
        Math.max(0, Math.round(input.responseMs)),
        now,
      ),
    db
      .prepare(
        `INSERT INTO mastery
        (organization_id, learner_id, skill_key, score, correct_count, attempt_count, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?)
        ON CONFLICT (organization_id, learner_id, skill_key)
        DO UPDATE SET
          score = MAX(0, MIN(100, mastery.score + CASE WHEN excluded.correct_count = 1 THEN 12 ELSE -5 END)),
          correct_count = mastery.correct_count + excluded.correct_count,
          attempt_count = mastery.attempt_count + 1,
          updated_at = excluded.updated_at`,
      )
      .bind(
        organizationId,
        learnerId,
        input.skillKey,
        initialScore,
        input.isCorrect ? 1 : 0,
        now,
      ),
  ]);

  return Response.json({ saved: true });
}
