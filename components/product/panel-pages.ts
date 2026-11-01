export type PanelBox = { top: number; bottom: number };

export function panelPageStarts(height: number, total: number, boxes: PanelBox[]) {
  if (height <= 0 || total <= height + 1) return [0];
  const units = boxes.filter(r => r.bottom > r.top && r.bottom - r.top <= height + 1);
  const cuts = [...new Set(units.flatMap(r => [r.top, r.bottom]))]
    .filter(c => c > 0 && c < total && units.every(r => c <= r.top + .5 || c >= r.bottom - .5))
    .sort((a, b) => a - b);
  const starts = [0];
  while (total - starts.at(-1)! > height + 1) {
    const start = starts.at(-1)!;
    const next = cuts.filter(c => c > start + 1 && c <= start + height + .5).at(-1);
    if (next === undefined) throw new Error('De beschikbare ruimte is kleiner dan een leesbare regel of bediening.');
    starts.push(next);
  }
  return starts;
}
