import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMap, MapValidationError } from '../src/lib/pgm/generate.ts';
import { exampleMap } from '../src/lib/pgm/example.ts';
import { createMap, protocols } from '../src/lib/pgm/schema.ts';

function rejects(map, path) {
  assert.throws(() => generateMap(map), (error) => {
    assert.ok(error instanceof MapValidationError);
    assert.ok(error.issues.some((issue) => issue.path === path), JSON.stringify(error.issues));
    return true;
  });
}

test('generates a complete, deterministic TDM document without mutating input', () => {
  const map = exampleMap();
  const before = structuredClone(map);
  const { xml } = generateMap(map);
  assert.equal(xml, `<?xml version="1.0" encoding="UTF-8"?>
<map proto="1.5.1">
  <name>Two Towers</name>
  <version>1.0.0</version>
  <objective>Reach 20 kills to win.</objective>
  <authors>
    <author>Mapmaker</author>
  </authors>
  <teams>
    <team id="red" color="red" max="8">Red</team>
    <team id="blue" color="blue" max="8">Blue</team>
  </teams>
  <kits>
    <kit id="spawn-kit">
      <item material="iron sword" slot="0" unbreakable="true"/>
      <item material="bread" slot="1" amount="16"/>
    </kit>
  </kits>
  <spawns>
    <default>
      <regions>
        <point>0.5,80,0.5</point>
      </regions>
    </default>
    <spawn team="red" yaw="90" kit="spawn-kit">
      <regions>
        <point>20.5,65,0.5</point>
      </regions>
    </spawn>
    <spawn team="blue" yaw="-90" kit="spawn-kit">
      <regions>
        <point>-20.5,65,0.5</point>
      </regions>
    </spawn>
  </spawns>
  <score>
    <kills>1</kills>
    <limit>20</limit>
  </score>
</map>
`);
  assert.equal(generateMap(map).xml, xml);
  assert.deepEqual(map, before);
});

test('escapes XML text and attributes, preserving Unicode and whitespace', () => {
  const map = exampleMap();
  map.main.name = `A & B <"雪"> '😀'`;
  map.authors[0].contribution = 'a"/><bad/>\n\t&';
  map.modules = [{ name: 'rules', children: [{ name: 'rule', text: '<!DOCTYPE map SYSTEM "file:///secret">' }] }];
  const { xml } = generateMap(map);
  assert.ok(xml.includes('A &amp; B &lt;&quot;雪&quot;&gt; &apos;😀&apos;'));
  assert.ok(xml.includes('contribution="a&quot;/&gt;&lt;bad/&gt;&#10;&#9;&amp;"'));
  assert.ok(!xml.includes('<bad/>'));
  assert.ok(!xml.includes('<!DOCTYPE'));
});

test('requires metadata, an author, and exactly one default spawn', () => {
  rejects(createMap(), 'main.name');
  const map = exampleMap();
  map.authors = [];
  rejects(map, 'authors');
  map.authors = [{}];
  rejects(map, 'authors[0]');
  map.spawns = [];
  rejects(map, 'spawns');
  map.spawns = [{ type: 'default', point: '0,0,0' }, { type: 'default', point: '1,1,1' }];
  rejects(map, 'spawns');
});

test('supports every advertised protocol and optional declaration', () => {
  for (const proto of protocols) {
    const map = exampleMap();
    map.main.proto = proto;
    map.main.declaration = false;
    assert.ok(generateMap(map).xml.startsWith(`<map proto="${proto}">`));
  }
});

test('validates dates, versions, UUIDs, control characters, and runtime types', () => {
  for (const [field, value] of [['created', '2025-02-29'], ['version', '1.2'], ['proto', '2.0.0'], ['name', '\u0000'], ['name', '\ud800'], ['declaration', 'false']]) {
    const map = exampleMap(); map.main[field] = value; rejects(map, `main.${field}`);
  }
  const map = exampleMap();
  map.main.created = '2024-02-29';
  map.authors = [{ uuid: '00000000-0000-0000-0000-000000000001' }];
  assert.ok(generateMap(map).xml.includes('<author uuid="00000000-0000-0000-0000-000000000001"/>'));
  map.authors[0].uuid = 'not-a-uuid'; rejects(map, 'authors[0].uuid');
  rejects(null, 'map'); rejects({ main: [] }, 'main');
  rejects({ ...exampleMap(), teams: null }, 'teams');
});

test('preserves zero and false and omits blank optional values', () => {
  const map = exampleMap();
  map.teams[0].min = 0; map.teams[0].plural = false; map.teams[0]['show-name-tags'] = '';
  map.variables = [{ id: 'counter', scope: 'match', default: 0 }];
  map.respawns = [{ delay: 0, auto: false }];
  const { xml } = generateMap(map);
  assert.ok(xml.includes('plural="false" min="0"'));
  assert.ok(xml.includes('default="0"'));
  assert.ok(xml.includes('<respawn delay="0" auto="false"/>'));
  assert.ok(!xml.includes('show-name-tags'));
});

test('validates team sizes, numeric input and duplicate global IDs', () => {
  const map = exampleMap(); map.teams[0].max = 'NaN'; rejects(map, 'teams[0].max');
  map.teams[0].max = 1.5; rejects(map, 'teams[0].max');
  map.teams[0].max = 8; map.teams[0].min = 9; rejects(map, 'teams[0].min');
  map.teams[0].min = 1; map.teams[0]['max-overfill'] = 7; rejects(map, 'teams[0].max-overfill');
  map.kits[0].id = 'red'; rejects(map, 'kits[0].id');
});

test('checks cross references including forward kit parents and inheritance cycles', () => {
  const map = exampleMap();
  map.kits = [{ id: 'spawn-kit', parents: 'base' }, { id: 'base' }];
  generateMap(map);
  map.kits[1].parents = 'spawn-kit'; rejects(map, 'kits');
  map.kits[1].parents = ''; map.spawns[1].team = 'missing'; rejects(map, 'spawns[1].team');
  map.spawns[1].team = 'red'; map.items[0].kit = 'missing'; rejects(map, 'items[0].kit');
  map.items[0].kit = 'spawn-kit'; map.kits[0].filter = 'missing'; rejects(map, 'kits[0].filter');
});

test('serializes regions, custom filters, spawn references and inherited kits', () => {
  const map = exampleMap();
  map.regions = [{ id: 'red-spawn', type: 'cuboid', min: '1,2,3', max: '4,5,6' }];
  map.filters = [{ id: 'only-red', type: 'team', value: 'red' }, { id: 'enabled', type: 'always' }];
  map.spawns[1] = { type: 'spawn', region: 'red-spawn', team: 'red', filter: 'only-red' };
  const { xml } = generateMap(map);
  assert.ok(xml.includes('<cuboid id="red-spawn" min="1,2,3" max="4,5,6"/>'));
  assert.ok(xml.includes('<team>red</team>'));
  assert.ok(xml.includes('<spawn team="red" region="red-spawn" filter="only-red"/>'));
  assert.ok(xml.includes('<all id="enabled">\n      <always/>'));
});

test('rejects malformed coordinates, conflicting spawn locations, unsafe sequential spawns, and item slots', () => {
  const map = exampleMap(); map.spawns[0].point = '1,,3'; rejects(map, 'spawns[0].point');
  map.spawns[0].point = '0,0,0'; map.spawns[0].region = 'anything'; rejects(map, 'spawns[0]');
  delete map.spawns[0].region; map.spawns[0].sequential = true; rejects(map, 'spawns[0].sequential');
  map.spawns[0].safe = true; map.items[1].slot = 0; rejects(map, 'items[1].slot');
});

test('rejects unsafe or ambiguous extension trees and unknown fields', () => {
  for (const node of [{ name: 'x/><evil' }, { name: 'map' }, { name: 'score', attributes: { 'x"': 'v' } }, { name: 'rules', text: 'x', children: [{ name: 'rule' }] }, { name: 'spawns' }, { name: 'score', text: '\u0001' }]) {
    assert.throws(() => generateMap({ ...exampleMap(), modules: [node] }), MapValidationError);
  }
  rejects({ ...exampleMap(), typo: 1 }, 'typo');
  const map = exampleMap(); map.teams[0].maxx = 8; rejects(map, 'teams[0].maxx');
});

test('bounds input collections and recursive module trees', () => {
  rejects({ ...exampleMap(), authors: Array.from({ length: 201 }, () => ({ name: 'a' })) }, 'authors');
  let node = { name: 'rule' };
  for (let i = 0; i < 22; i++) node = { name: 'rules', children: [node] };
  assert.throws(() => generateMap({ ...exampleMap(), modules: [node] }), MapValidationError);
});

test('checks built-in IDs against the selected protocol', () => {
  const map = exampleMap();
  map.kits[0].filter = 'participating';
  generateMap(map);
  map.main.proto = '1.4.2';
  rejects(map, 'kits[0].filter');
  map.filters = [{ id: 'participating', type: 'participating' }];
  generateMap(map);
  map.main.proto = '1.5.1';
  rejects(map, 'filters[0].id');
  map.filters = [];
  map.variables = [{ id: 'score', scope: 'team' }];
  rejects(map, 'variables[0].id');
});

test('malformed discriminators produce validation errors, not runtime exceptions', () => {
  const map = exampleMap();
  map.regions = [{ id: 'bad-region', type: { toString: 'invalid' } }];
  rejects(map, 'regions[0].type');
});
