// Shared demo storage is retired; existing records stay untouched.
export function GET() {
  return Response.json({ error: 'Online voortgang opslaan is niet beschikbaar.' }, { status: 410 });
}

export const POST = GET;
