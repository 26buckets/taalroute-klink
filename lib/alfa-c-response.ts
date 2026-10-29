import type { FunctionalStep, FunctionalRecord } from './alfa-c-functioneel';

export type FunctionalResponse = { text: string; fields: Record<string, string>; crossed: number[]; actions: number[] };
export const emptyFunctionalResponse = (): FunctionalResponse => ({ text: '', fields: {}, crossed: [], actions: [] });
export function parseFunctionalResponse(value: unknown): FunctionalResponse | undefined {
  if (!value || typeof value !== 'object') return;
  const v = value as Partial<FunctionalResponse>;
  if (typeof v.text !== 'string' || !v.fields || typeof v.fields !== 'object' || Array.isArray(v.fields) || !Object.values(v.fields).every(x => typeof x === 'string') || !Array.isArray(v.crossed) || !Array.isArray(v.actions)) return;
  if (![...v.crossed, ...v.actions].every(n => Number.isInteger(n) && n >= 0 && n < 100)) return;
  return { text: v.text.slice(0, 10000), fields: Object.fromEntries(Object.entries(v.fields).slice(0, 20).map(([k, x]) => [k, x.slice(0, 1000)])), crossed: [...new Set(v.crossed)], actions: [...new Set(v.actions)] };
}
export function responseForStep(step: FunctionalStep, value: unknown) {
  const parsed = parseFunctionalResponse(value);
  if (!parsed) return;
  const actions = functionalActions(step), lines = responseLines(step);
  let count = 0;
  while (count < actions.length && parsed.actions[count] === count) count++;
  return { ...parsed, crossed: parsed.crossed.filter(n => n < lines.length), actions: actions.slice(0, count).map((_, n) => n) };
}
export const responseLines = (step: FunctionalStep) => (step.responseSetup?.initialText ?? '').replaceAll('\\n', '\n').split('\n').filter(Boolean);
export const isStrikeResponse = (step: FunctionalStep) => Boolean(step.responseSetup?.initialText && /streep/i.test(step.instruction));
export function functionalActions(step: FunctionalStep) {
  if (!/-werk-(05|09|11)$/.test(step.id)) return [];
  return step.presentation.flatMap(view => view.text.split('\n').filter(line => /^\d+ /.test(line)).map(line => line.replace(/^\d+ /, '')));
}
export function functionalResponseReady(step: FunctionalStep, response: FunctionalResponse) {
  const actions = functionalActions(step);
  if (actions.length && !actions.every((_, n) => response.actions.includes(n))) return false;
  const setup = step.responseSetup;
  if (!setup) return true;
  if (isStrikeResponse(step) && (setup.fields.length ? response.crossed.length !== responseLines(step).length : response.crossed.length === 0)) return false;
  if (setup.fields.length) return setup.fields.every(field => Boolean(response.fields[field]?.trim()));
  return isStrikeResponse(step) || Boolean(response.text.trim());
}
export function functionalResponseText(step: FunctionalStep, record?: FunctionalRecord) {
  const response = record?.response;
  if (!response) return '';
  if (step.responseSetup?.fields.length) return Object.entries(response.fields).filter(([, text]) => text.trim()).map(([label, text]) => `${label}: ${text}`).join('\n');
  if (isStrikeResponse(step)) return responseLines(step).filter((_, n) => !response.crossed.includes(n)).join('\n');
  return response.text;
}
