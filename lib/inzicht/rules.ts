export const RULE_VERSION = 'inzicht-r2-20261101';
export const ROUTES = ['Alfa A', 'Alfa B', 'Alfa C', 'A1', 'A2', 'B1'];
export type Evidence = {
  id: string;
  occurred_at: string;
  day: string;
  session_id: string;
  item_set: string;
  identity_valid: boolean;
  source_valid: boolean;
  relation: 'TRAIN' | 'MEASURE';
  rubric_version: string;
  independent: boolean;
  feedback_reused: boolean;
  transfer: boolean;
  independence: string;
  total: number;
  correct: number;
  outcome: string;
  revoked?: boolean;
};
export type Rubric = {
  version: string;
  minimum_items: number;
  pass_ratio: number;
  stale_days: number | null;
};
export type Skill = {
  id: string;
  label: string;
  measurement_approved: number;
  rubric: Rubric;
};
export type Mastery = {
  status: 'UNKNOWN' | 'DEVELOPING' | 'MASTERED';
  attention: boolean;
  recheck: boolean;
  stale: boolean;
  evidence_ids: string[];
  measured: boolean;
  latest_day: string | null;
  rule_version: string;
};

export function computeMastery(
  skill: Skill,
  input: Evidence[],
  asOf: string,
): Mastery {
  const events = input
    .filter(
      (e) =>
        !e.revoked &&
        e.identity_valid &&
        e.source_valid &&
        e.relation === 'MEASURE' &&
        skill.measurement_approved === 1 &&
        e.rubric_version === skill.rubric.version &&
        e.occurred_at <= asOf &&
        e.independence !== 'unknown' &&
        e.independent &&
        !e.feedback_reused &&
        Number.isInteger(e.total) &&
        e.total >= skill.rubric.minimum_items &&
        Number.isInteger(e.correct) &&
        e.correct >= 0 &&
        e.correct <= e.total,
    )
    .sort(
      (a, b) =>
        a.occurred_at.localeCompare(b.occurred_at) || a.id.localeCompare(b.id),
    );
  const passed = (e: Evidence) =>
    e.independence === 'independent' &&
    e.correct / e.total >= skill.rubric.pass_ratio;
  const enough = events.filter(passed);
  // Two dates alone are insufficient: session, item set and transfer must also be independent.
  const pair = enough.flatMap((a, i) =>
    enough
      .slice(i + 1)
      .filter(
        (b) =>
          a.day !== b.day &&
          a.session_id !== b.session_id &&
          a.item_set !== b.item_set &&
          (a.transfer || b.transfer),
      )
      .map((b) => [a, b]),
  );
  const failures = events.filter((e) => !passed(e));
  const latest = events.at(-1);
  const attainedAt = pair.length
    ? pair.map((p) => p[1].occurred_at).sort()[0]
    : null;
  const stale = Boolean(
    latest &&
    skill.rubric.stale_days !== null &&
    Date.parse(asOf) - Date.parse(latest.occurred_at) >
      skill.rubric.stale_days * 86400000,
  );
  return {
    status: pair.length ? 'MASTERED' : events.length ? 'DEVELOPING' : 'UNKNOWN',
    attention: new Set(failures.map((e) => e.day)).size >= 2,
    recheck: Boolean(
      attainedAt && failures.some((e) => e.occurred_at > attainedAt),
    ),
    stale,
    evidence_ids: events.map((e) => e.id),
    measured: events.length > 0 && !stale,
    latest_day: latest?.day ?? null,
    rule_version: RULE_VERSION,
  };
}

export type Policy = {
  allowed_routes: string[];
  exercise_mode: 'free' | 'assigned';
  version: number;
};
export type Content = {
  id: string;
  title: string;
  level_code: string;
  product: string;
  release_status: string;
  skill_id: string;
  relation_type: string;
  version_hash: string;
  deep_link: string;
  metadata: Record<string, unknown>;
};
export function permitted(
  policy: Policy,
  entitlement: string[],
  content: Content,
  assigned: boolean,
) {
  return (
    content.release_status === 'published' &&
    entitlement.includes(content.level_code) &&
    policy.allowed_routes.includes(content.level_code) &&
    (policy.exercise_mode === 'free' || assigned)
  );
}
export type Suggestion = {
  rule_id: string;
  type: string;
  skill_id: string;
  learner_ids: string[];
  evidence_ids: string[];
  measured: number;
  active: number;
  attention: number;
  rationale: string;
  content_id: string | null;
  duration: number | null;
};
export function recommendations(
  skills: Skill[],
  rows: { id: string; cells: Record<string, Mastery> }[],
  catalog: Content[],
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  for (const skill of [...skills].sort((a, b) => a.id.localeCompare(b.id))) {
    const sorted = [...rows].sort((a, b) => a.id.localeCompare(b.id));
    const measured = sorted.filter((row) => row.cells[skill.id]?.measured);
    const attention = measured.filter((row) => row.cells[skill.id]?.attention);
    const unknown = sorted.filter((row) => !row.cells[skill.id]?.measured);
    const recheck = measured.filter((row) => row.cells[skill.id]?.recheck);
    const mastered = measured.filter(
      (row) =>
        row.cells[skill.id]?.status === 'MASTERED' &&
        !row.cells[skill.id]?.recheck,
    );
    const add = (
      rule: string,
      type: string,
      targets: typeof rows,
      rationale: string,
      relation: string,
    ) => {
      if (!targets.length) return;
      const match = catalog
        .filter(
          (c) =>
            c.release_status === 'published' &&
            c.skill_id === skill.id &&
            c.relation_type === relation,
        )
        .sort((a, b) => a.id.localeCompare(b.id))[0];
      suggestions.push({
        rule_id: rule,
        type,
        skill_id: skill.id,
        learner_ids: targets.map((t) => t.id),
        evidence_ids: [
          ...new Set(
            targets.flatMap((t) => t.cells[skill.id]?.evidence_ids ?? []),
          ),
        ].sort(),
        measured: measured.length,
        active: rows.length,
        attention: attention.length,
        rationale,
        content_id: match?.id ?? null,
        duration:
          typeof match?.metadata.duration_minutes === 'number'
            ? match.metadata.duration_minutes
            : null,
      });
    };
    add(
      'R-001',
      'diagnostic',
      unknown,
      'Eerst meten; ontbrekende metingen zijn geen onvoldoende.',
      'MEASURE',
    );
    add(
      'R-060',
      'recheck',
      recheck,
      'Tegenstrijdig bewijs: controleer opnieuw met een onafhankelijke taak.',
      'MEASURE',
    );
    const whole =
      attention.length >= 3 &&
      attention.length / rows.length >= 0.3 &&
      measured.length / rows.length >= 0.6;
    add(
      whole ? 'R-070' : 'R-050',
      whole ? 'whole-class' : 'small-group',
      whole ? sorted : attention,
      whole
        ? 'Voorstel voor gezamenlijke herhaling: minimaal 3 aandacht, 30% van de klas en 60% meetdekking.'
        : 'Gerichte ondersteuning voor deze cursisten; geen conclusie over ongemeten cursisten.',
      'TRAIN',
    );
    add(
      'R-080',
      'extension',
      mastered,
      'Vervolg verkennen met de docent; geen automatische niveauwisseling.',
      'TRAIN',
    );
  }
  return suggestions;
}

export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
export async function hash(value: unknown) {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonical(value)),
  );
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
export function csvCell(value: unknown) {
  const text =
    typeof value === 'string'
      ? value
      : value == null
        ? ''
        : JSON.stringify(value);
  return `"${(/^[\s]*[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`;
}
