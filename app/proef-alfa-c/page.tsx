import { notFound } from 'next/navigation';
import { AlfaCPreview } from '@/components/preview/alfa-c';
export default function Page() {
  // Owner review is local only; this route must never expose unapproved content in production.
  if (process.env.NODE_ENV === 'production') notFound();
  return <AlfaCPreview />;
}
