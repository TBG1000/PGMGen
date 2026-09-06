import { generateMap, MapValidationError } from '../pgm/generate.ts';

export const MAX_BODY_BYTES = 1024 * 1024;
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

/** Shared by the SvelteKit route and HTTP tests; no filesystem or user state. */
export async function handleGenerate(request: Request): Promise<Response> {
  const mediaType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (mediaType !== 'application/json') return json({ error: 'Send an application/json request.' }, 415);
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return json({ error: 'Map requests must be at most 1 MiB.' }, 413);
  if (!request.body) return json({ error: 'A JSON request body is required.' }, 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        return json({ error: 'Map requests must be at most 1 MiB.' }, 413);
      }
      chunks.push(value);
    }
  } catch { return json({ error: 'Unable to read request body.' }, 400); }
  finally { reader.releaseLock(); }
  let input: unknown;
  try {
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch { return json({ error: 'Request body must contain valid UTF-8 JSON.' }, 400); }
  try {
    const result = generateMap(input);
    if (new URL(request.url).searchParams.get('download') === '1') return new Response(result.xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': 'attachment; filename="map.xml"',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
    return json(result, 200);
  } catch (error) {
    if (error instanceof MapValidationError) return json({ error: error.message, issues: error.issues }, 422);
    throw error;
  }
}
