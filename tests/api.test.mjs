import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGenerate, MAX_BODY_BYTES } from '../src/lib/server/pgm-api.ts';
import { exampleMap } from '../src/lib/pgm/example.ts';

const request = (body, suffix = '', headers = {}) => new Request(`http://localhost/api/pgm${suffix}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body)
});

test('POST returns XML preview and warnings as JSON', async () => {
  const response = await handleGenerate(request(exampleMap()));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.ok(result.xml.includes('<name>Two Towers</name>'));
  assert.ok(Array.isArray(result.warnings));
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('download returns UTF-8 XML with a fixed safe filename', async () => {
  const map = exampleMap(); map.main.name = '../../malicious"\r\n雪';
  const response = await handleGenerate(request(map, '?download=1'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/xml; charset=utf-8');
  assert.equal(response.headers.get('content-disposition'), 'attachment; filename="map.xml"');
  assert.ok((await response.text()).includes('雪'));
});

test('malformed JSON, unsupported content type, and validation failures have distinct statuses', async () => {
  assert.equal((await handleGenerate(request('{bad json'))).status, 400);
  assert.equal((await handleGenerate(request('{}', '', { 'Content-Type': 'text/plain' }))).status, 415);
  const response = await handleGenerate(request({ main: {} }));
  assert.equal(response.status, 422);
  assert.ok((await response.json()).issues.some((issue) => issue.path === 'main.name'));
});

test('limits request bytes even without a content-length header', async () => {
  const response = await handleGenerate(request('x'.repeat(MAX_BODY_BYTES + 1)));
  assert.equal(response.status, 413);
  assert.equal((await handleGenerate(request('{}', '', { 'Content-Length': String(MAX_BODY_BYTES + 1) }))).status, 413);
});

test('requests are isolated and invalid input never produces a downloadable document', async () => {
  const first = exampleMap(); first.main.name = 'First';
  const second = exampleMap(); second.main.name = 'Second';
  const responses = await Promise.all([handleGenerate(request(first)), handleGenerate(request(second))]);
  assert.ok((await responses[0].json()).xml.includes('<name>First</name>'));
  assert.ok((await responses[1].json()).xml.includes('<name>Second</name>'));
  const invalid = await handleGenerate(request({}, '?download=1'));
  assert.equal(invalid.status, 422);
  assert.equal(invalid.headers.get('content-disposition'), null);
});
