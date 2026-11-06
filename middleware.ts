import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import delivery from './data/klink-practice-delivery.json' with { type: 'json' };
import { practiceBundleResponse } from './lib/practice-bundle-response';

export function middleware(request: Request) {
  // Public-file routing precedes app routes, so restore old URLs here.
  if (Object.hasOwn(delivery, new URL(request.url).pathname)) return practiceBundleResponse(request, env.ASSETS);
  return NextResponse.next();
}
export const config = { matcher: '/practice-content/:path*' };
