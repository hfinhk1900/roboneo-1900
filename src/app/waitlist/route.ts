export async function GET(): Promise<Response> {
  return new Response(null, { status: 410 });
}

export async function HEAD(): Promise<Response> {
  return new Response(null, { status: 410 });
}
