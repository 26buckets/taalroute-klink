import { getDbBinding } from '@/db';
import { teachingRequest } from '@/lib/teaching-server';
export async function GET(request: Request) {
  try {
    return await teachingRequest(request, getDbBinding());
  } catch {
    return Response.json(
      { error: 'Opslaan of laden lukt nu niet. Probeer het opnieuw.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
export const POST = GET;
