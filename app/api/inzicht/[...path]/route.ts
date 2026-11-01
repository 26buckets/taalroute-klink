import { env } from 'cloudflare:workers';
import { handleInzicht, type InzichtEnv } from '@/lib/inzicht/service';
export function GET(request: Request) {
  return handleInzicht(request, env as unknown as InzichtEnv);
}
export const POST = GET;
