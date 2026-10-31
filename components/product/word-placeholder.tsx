export function WordPlaceholder({ word, className = '', decorative = false }: { word: string; className?: string; decorative?: boolean }) {
  return <span className={`cp-word-placeholder klink-word-placeholder ${className}`} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : `${word} — afbeelding volgt`} aria-hidden={decorative || undefined} data-long-word={word.length > 16 || undefined}><span className="klink-placeholder-word">{word}</span></span>;
}
