import { env } from 'cloudflare:workers';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { enabled, type InzichtEnv } from '@/lib/inzicht/service';
import { InzichtApp } from '@/components/inzicht/app';
export default async function Page() {
  if (!enabled(env as unknown as InzichtEnv)) notFound();
  const online =
    (env as unknown as InzichtEnv).INZICHT_MODE === 'synthetic-online';
  const initialAnonymous =
    online && !(await cookies()).has('__Host-inzicht_session');
  return (
    <div className="ki-page">
      <InzichtApp online={online} initialAnonymous={initialAnonymous} />
    </div>
  );
}
