import {
  sourceCriteria,
  type SourceMark,
  type SourceMode,
} from './source-observation.ts';

export const MIN_GROUP_N = 5;
export type SourcePayload = {
  source: string;
  source_version: number;
  mode: SourceMode;
  material_id: string;
  values: SourceMark[];
  observed_at: string;
  note: string;
  next: string;
  level?: string;
  condition?: string;
  reason?: string;
};
export type ReportObservation = {
  id: string;
  learner_id: string;
  current_revision: number;
  author_id: string;
  payload: SourcePayload;
};
export type Hours = {
  id: string;
  learner_id: string;
  current_revision: number;
  attended_at: string;
  minutes: number;
};
export type ReportInput = {
  observations: ReportObservation[];
  hours: Hours[];
  learners: {
    id: string;
    display_name: string;
    started_at: string;
    ended_at: string | null;
  }[];
};
export type ReportFilter = {
  learner?: string;
  mode?: string;
  material?: string;
  level?: string;
  condition?: string;
  from?: string;
  to?: string;
  minHours?: number;
  maxHours?: number;
};
export function distribution(values: SourceMark[]) {
  const counts = { independent: 0, supported: 0, unobserved: 0, empty: 0 };
  for (const v of values) {
    if (v === 0) counts.independent++;
    else if (v === 1) counts.supported++;
    else if (v === 2) counts.unobserved++;
    else counts.empty++;
  }
  const assessed = counts.independent + counts.supported;
  return {
    ...counts,
    total: values.length,
    assessed,
    coverage: values.length ? assessed / values.length : null,
  };
}
export function hoursAt(hours: Hours[], learner: string, at: string) {
  const found = hours.filter(
    (h) => h.learner_id === learner && h.attended_at <= at,
  );
  return found.length ? found.reduce((n, h) => n + h.minutes, 0) / 60 : null;
}
const inDates = (at: string, f: ReportFilter) =>
  (!f.from || at.slice(0, 10) >= f.from) && (!f.to || at.slice(0, 10) <= f.to);
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.floor(s.length / 2);
  return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2;
};
export function buildReport(input: ReportInput, filter: ReportFilter) {
  const selected = input.observations
    .filter((o) => {
      const p = o.payload,
        h = hoursAt(input.hours, o.learner_id, p.observed_at);
      return (
        (!filter.learner || o.learner_id === filter.learner) &&
        inDates(p.observed_at, filter) &&
        (!filter.mode || p.mode === filter.mode) &&
        (!filter.material || p.material_id === filter.material) &&
        (!filter.level || p.level === filter.level) &&
        (!filter.condition || p.condition === filter.condition) &&
        (filter.minHours === undefined ||
          (h !== null && h >= filter.minHours)) &&
        (filter.maxHours === undefined || (h !== null && h <= filter.maxHours))
      );
    })
    .sort(
      (a, b) =>
        a.payload.observed_at.localeCompare(b.payload.observed_at) ||
        a.id.localeCompare(b.id),
    );
  const points = selected.map((o) => ({
    ...o,
    hours: hoursAt(input.hours, o.learner_id, o.payload.observed_at),
    distribution: distribution(o.payload.values),
    criteria: sourceCriteria(o.payload.mode, o.payload.material_id),
  }));
  // Never pool different items, modes, levels, conditions, or instrument versions.
  const sets = new Map<string, ReportObservation[]>();
  let excluded = 0;
  for (const o of selected) {
    const p = o.payload;
    const membership = input.learners.find((l) => l.id === o.learner_id);
    if (
      !p.level ||
      !p.condition ||
      !membership ||
      membership.started_at > p.observed_at ||
      (membership.ended_at && membership.ended_at < p.observed_at)
    ) {
      excluded++;
      continue;
    }
    const key = JSON.stringify([
      p.source,
      p.source_version,
      p.mode,
      p.material_id,
      p.level,
      p.condition,
      p.observed_at.slice(0, 7),
    ]);
    sets.set(key, [...(sets.get(key) ?? []), o]);
  }
  const groups = [...sets.entries()]
    .map(([key, observations]) => {
      const [source, version, mode, material, level, condition, period] =
        JSON.parse(key) as string[];
      // One latest observation per learner/task/calendar month; repeated practice never adds weight.
      const latest = new Map(observations.map((o) => [o.learner_id, o]));
      const members = [...latest.values()];
      const population = input.learners.filter(
        (l) =>
          l.started_at.slice(0, 7) <= period &&
          (!l.ended_at || l.ended_at.slice(0, 7) >= period),
      ).length;
      const values = members.flatMap((o) => o.payload.values);
      const enough = members.length >= MIN_GROUP_N;
      const criteria = sourceCriteria(mode as SourceMode, material).map(
        (label, i) => {
          const marks = members.map((o) => o.payload.values[i]);
          const d = distribution(marks),
            n = d.assessed;
          return {
            label,
            n,
            distribution: enough && n >= MIN_GROUP_N ? d : null,
            meanIndependent: n >= MIN_GROUP_N ? d.independent / n : null,
          };
        },
      );
      const commonCriteria = [0, 1, 2, 3, 4, 5].filter((i) =>
        members.every(
          (o) => o.payload.values[i] === 0 || o.payload.values[i] === 1,
        ),
      );
      const ratios = commonCriteria.length
        ? members.map(
            (o) =>
              commonCriteria.filter((i) => o.payload.values[i] === 0).length /
              commonCriteria.length,
          )
        : [];
      return {
        key,
        source,
        version,
        mode,
        material,
        level,
        condition,
        period,
        n: members.length,
        population,
        coverage: population ? members.length / population : null,
        suppressed: !enough,
        distribution: enough ? distribution(values) : null,
        criteria,
        medianIndependent:
          enough && ratios.length >= MIN_GROUP_N ? median(ratios) : null,
        medianN: ratios.length,
        commonCriteria,
        cohortIds: members.map((o) => o.learner_id).sort(),
      };
    })
    .sort(
      (a, b) => a.period.localeCompare(b.period) || a.key.localeCompare(b.key),
    );
  const previous = new Map<string, (typeof groups)[number]>();
  const comparedGroups = groups.map((g) => {
    const key = JSON.stringify([
      g.source,
      g.version,
      g.mode,
      g.material,
      g.level,
      g.condition,
    ]);
    const old = previous.get(key);
    previous.set(key, g);
    const sameCohortAsPrevious = old
      ? JSON.stringify(old.cohortIds) === JSON.stringify(g.cohortIds)
      : null;
    return { ...g, sameCohortAsPrevious };
  });
  const mix = [
    ...new Set(selected.map((o) => o.payload.level || 'Niet vastgelegd')),
  ].map(
    (level) =>
      `${level}: ${new Set(selected.filter((o) => (o.payload.level || 'Niet vastgelegd') === level).map((o) => o.learner_id)).size} cursisten`,
  );
  return {
    points,
    groups: comparedGroups,
    excluded,
    mix,
    total: distribution(selected.flatMap((o) => o.payload.values)),
    minGroupN: MIN_GROUP_N,
  };
}
