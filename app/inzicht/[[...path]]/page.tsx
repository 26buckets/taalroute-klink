import { env } from 'cloudflare:workers';
import { notFound } from 'next/navigation';
import { enabled, type InzichtEnv } from '@/lib/inzicht/service';
import { InzichtApp } from '@/components/inzicht/app';
export default function Page() {
  if (!enabled(env as unknown as InzichtEnv)) notFound();
  return (
    <div className="ki-page">
      <InzichtApp />
    </div>
  );
}
