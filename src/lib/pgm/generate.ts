import { collections, gamemodes, isVisible, mainFields, type Entry, type Field, type Value, type XmlElement } from './schema.ts';

export interface ValidationIssue { path: string; message: string }
export class MapValidationError extends Error {
  issues: ValidationIssue[];
  constructor(issues: ValidationIssue[]) {
    super('The map contains invalid or missing values.');
    this.name = 'MapValidationError';
    this.issues = issues;
  }
}
const xmlCharacters = /^[\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]*$/u;
const xmlName = /^[A-Za-z_][A-Za-z0-9_.-]*$/;
const identifier = /^[A-Za-z_][A-Za-z0-9_.-]*$/;
const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const empty = (v: unknown) => v === undefined || v === '';
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Escape every text/attribute value, including newlines that XML attributes normalize. */
function escape(value: Value): string {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\r/g, '&#13;').replace(/\n/g, '&#10;').replace(/\t/g, '&#9;');
}
function element(name: string, attributes: Entry = {}, children: XmlElement[] = [], text?: string): XmlElement {
  return { name, attributes: Object.fromEntries(Object.entries(attributes).filter(([, value]) => !empty(value))) as Record<string, Value>, children, text };
}
function serialize(node: XmlElement, depth = 0): string {
  const pad = '  '.repeat(depth);
  const attrs = Object.entries(node.attributes ?? {}).map(([key, value]) => ` ${key}="${escape(value)}"`).join('');
  const start = `${pad}<${node.name}${attrs}`;
  if (node.text !== undefined) return `${start}>${escape(node.text)}</${node.name}>`;
  if (!node.children?.length) return `${start}/>`;
  return `${start}>\n${node.children.map((child) => serialize(child, depth + 1)).join('\n')}\n${pad}</${node.name}>`;
}
function attributes(row: Entry, exclude: string[] = []): Entry {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !exclude.includes(key)));
}

/** Runtime validation is deliberately independent of TypeScript and the browser form. */
export function generateMap(input: unknown): { xml: string; warnings: string[] } {
  const issues: ValidationIssue[] = [];
  const issue = (path: string, message: string) => { if (issues.length < 100) issues.push({ path, message }); };
  const vector = (value: unknown, count: number, path: string) => {
    const parts = typeof value === 'string' ? value.split(',').map((part) => part.trim()) : [];
    if (parts.length !== count || parts.some((part) => !numeric.test(part) || !Number.isFinite(Number(part)))) {
      issue(path, `Enter ${count} finite coordinates separated by commas.`);
    }
  };
  const readEntry = (raw: unknown, fields: Field[], path: string): Entry => {
    if (!object(raw)) { issue(path, 'Expected an object.'); return {}; }
    const result: Entry = {};
    for (const key of Object.keys(raw)) if (!fields.some((field) => field.key === key)) issue(`${path}.${key}`, 'Unknown field.');
    for (const field of fields) {
      if (!isVisible(field, raw as Entry)) continue;
      const p = `${path}.${field.key}`;
      let value = raw[field.key];
      if (typeof value === 'string') value = value.trim();
      if (empty(value)) {
        if (field.required) issue(p, `${field.label} is required.`);
        continue;
      }
      if (field.type === 'boolean') {
        if (typeof value !== 'boolean') issue(p, 'Expected true or false.');
        else result[field.key] = value;
        continue;
      }
      if (field.type === 'number') {
        if ((typeof value !== 'number' && (typeof value !== 'string' || !numeric.test(value))) || !Number.isFinite(Number(value))) {
          issue(p, 'Expected a finite number.'); continue;
        }
        const n = Number(value);
        if (field.integer && !Number.isSafeInteger(n)) issue(p, 'Expected a whole number.');
        if (field.min !== undefined && n < field.min) issue(p, `Must be at least ${field.min}.`);
        if (field.max !== undefined && n > field.max) issue(p, `Must be at most ${field.max}.`);
        result[field.key] = n;
        continue;
      }
      if (typeof value !== 'string') { issue(p, 'Expected text.'); continue; }
      if (value.length > 10000 || !xmlCharacters.test(value)) issue(p, 'Text must contain valid XML characters and at most 10,000 characters.');
      if (field.options && !field.options.includes(value)) issue(p, `Choose one of: ${field.options.join(', ')}.`);
      if (field.format === 'id' && !identifier.test(value)) issue(p, 'IDs must start with a letter or underscore and contain only letters, digits, underscores, dots or hyphens.');
      if (field.format === 'uuid' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) issue(p, 'Use a hyphenated UUID.');
      if (field.format === 'version' && !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) issue(p, 'Use a major.minor.patch version, such as 1.0.0.');
      if (field.format === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) issue(p, 'Use a real calendar date in YYYY-MM-DD format.');
      if (field.format === 'vector2' || field.format === 'vector3') vector(value, field.format === 'vector2' ? 2 : 3, p);
      result[field.key] = value;
    }
    return result;
  };
  if (!object(input)) throw new MapValidationError([{ path: 'map', message: 'Expected a JSON map object.' }]);
  const allowed = ['main', 'gamemodes', 'modules', ...Object.keys(collections)];
  for (const key of Object.keys(input)) if (!allowed.includes(key)) issue(key, 'Unknown map field.');
  const main = readEntry(input.main, mainFields, 'main');
  const rows: Record<string, Entry[]> = {};
  for (const [key, schema] of Object.entries(collections)) {
    const raw = input[key] === undefined ? [] : input[key];
    if (!Array.isArray(raw) || raw.length > 200) { issue(key, 'Expected an array of at most 200 entries.'); rows[key] = []; }
    else rows[key] = raw.map((entry, i) => readEntry(entry, schema.fields, `${key}[${i}]`));
  }
  const modes: string[] = [];
  if (input.gamemodes !== undefined) {
    if (!Array.isArray(input.gamemodes) || input.gamemodes.length > gamemodes.length) issue('gamemodes', 'Expected an array of gamemode IDs.');
    else input.gamemodes.forEach((mode, i) => {
      if (typeof mode !== 'string' || !(gamemodes as readonly string[]).includes(mode)) issue(`gamemodes[${i}]`, 'Unknown gamemode ID.');
      else if (!modes.includes(mode)) modes.push(mode);
    });
  }
  if (!rows.authors.length) issue('authors', 'Add at least one author.');
  for (const group of ['authors', 'contributors']) rows[group].forEach((row, i) => {
    if (!row.name && !row.uuid) issue(`${group}[${i}]`, 'Enter a name or UUID.');
  });
  const ids = new Map<string, string>();
  const modernProto = main.proto === '1.5.0' || main.proto === '1.5.1';
  const builtins = ['always', 'never', 'everywhere', 'nowhere'];
  if (modernProto) builtins.push('observing', 'participating', 'alive', 'dead', 'match-idle', 'match-starting', 'match-running', 'match-finished', 'match-started', 'void', 'crouching', 'walking', 'sprinting', 'grounded', 'flying', 'can-fly');
  if (main.proto === '1.5.1') builtins.push('gliding', 'riptiding');
  const reserved = [...builtins, ...(modernProto ? ['lives', 'score', 'timelimit', 'maxbuildheight'] : []), ...(main.proto === '1.5.1' ? ['worldtime'] : [])];
  for (const group of ['teams', 'kits', 'regions', 'filters', 'variables']) rows[group].forEach((row, i) => {
    if (typeof row.id !== 'string') return;
    if (ids.has(row.id) || reserved.includes(row.id) || (modernProto && row.id.startsWith('player.'))) issue(`${group}[${i}].id`, `ID '${row.id}' is already defined or reserved.`);
    else ids.set(row.id, group);
  });
  const ref = (value: Value | undefined, groups: string[], path: string, builtin: string[] = []) => {
    if (!empty(value) && !builtin.includes(String(value)) && !groups.includes(ids.get(String(value)) ?? '')) issue(path, `Unknown ${groups.join('/')} ID '${value}'.`);
  };
  for (const group of ['kits', 'spawns', 'respawns']) rows[group].forEach((row, i) => ref(row.filter, ['filters', 'regions'], `${group}[${i}].filter`, builtins));
  rows.teams.forEach((row, i) => {
    if (String(row.name).toLowerCase() === 'obs') issue(`teams[${i}].name`, 'The team name obs is reserved.');
    if (Number(row.min) > Number(row.max)) issue(`teams[${i}].min`, 'Minimum players cannot exceed maximum players.');
    if (row['max-overfill'] !== undefined && Number(row['max-overfill']) < Number(row.max)) issue(`teams[${i}].max-overfill`, 'Overfill cannot be below maximum players.');
  });
  const parents = new Map<string, string[]>();
  rows.kits.forEach((row, i) => {
    const list = row.parents ? String(row.parents).split(',').map((s) => s.trim()) : [];
    list.forEach((parent) => { if (!parent) issue(`kits[${i}].parents`, 'Parent kit IDs cannot be empty.'); else ref(parent, ['kits'], `kits[${i}].parents`); });
    parents.set(String(row.id), list);
  });
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) { issue('kits', `Kit inheritance contains a cycle at '${id}'.`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    (parents.get(id) ?? []).forEach(visit);
    visiting.delete(id); visited.add(id);
  };
  parents.forEach((_, id) => visit(id));
  const slots = new Set<string>();
  rows.items.forEach((row, i) => {
    ref(row.kit, ['kits'], `items[${i}].kit`);
    if (row.slot !== undefined) {
      const key = `${row.kit}:${row.slot}`;
      if (slots.has(key)) issue(`items[${i}].slot`, 'This inventory slot is already used in this kit.');
      slots.add(key);
    }
  });
  rows.regions.forEach((row, i) => {
    if (row.type === 'cuboid' || row.type === 'rectangle') {
      vector(row.min, row.type === 'cuboid' ? 3 : 2, `regions[${i}].min`);
      vector(row.max, row.type === 'cuboid' ? 3 : 2, `regions[${i}].max`);
    }
    if (row.type === 'half' && String(row.normal).split(',').every((n) => Number(n) === 0)) issue(`regions[${i}].normal`, 'Normal cannot be a zero vector.');
  });
  if (rows.spawns.filter((row) => row.type === 'default').length !== 1) issue('spawns', 'Add exactly one default spawn for observers.');
  rows.spawns.forEach((row, i) => {
    ref(row.team, ['teams'], `spawns[${i}].team`);
    ref(row.kit, ['kits'], `spawns[${i}].kit`);
    ref(row.region, ['regions'], `spawns[${i}].region`);
    if (Boolean(row.region) === Boolean(row.point)) issue(`spawns[${i}]`, 'Specify either a region ID or a spawn point.');
    if (row.sequential && !row.safe) issue(`spawns[${i}].sequential`, 'Sequential spawning requires safe spawning.');
  });
  rows.filters.forEach((row, i) => { if (row.type === 'team') ref(row.value, ['teams'], `filters[${i}].value`); });

  // The extension tree provides other PGM modules without accepting markup, DTDs or entities.
  let nodeCount = 0;
  const readNode = (raw: unknown, path: string, depth: number): XmlElement | undefined => {
    if (++nodeCount > 2000 || depth > 20) { issue(path, 'Module trees are limited to 2,000 nodes and 20 levels.'); return; }
    if (!object(raw)) { issue(path, 'Expected an XML element object.'); return; }
    for (const key of Object.keys(raw)) if (!['name', 'attributes', 'text', 'children'].includes(key)) issue(`${path}.${key}`, 'Unknown XML element field.');
    if (typeof raw.name !== 'string' || !xmlName.test(raw.name) || raw.name.toLowerCase() === 'map') { issue(`${path}.name`, 'Use a valid XML element name other than map.'); return; }
    const attrs: Record<string, Value> = Object.create(null);
    if (raw.attributes !== undefined) {
      if (!object(raw.attributes) || Object.keys(raw.attributes).length > 100) issue(`${path}.attributes`, 'Expected an object of at most 100 attributes.');
      else for (const [key, value] of Object.entries(raw.attributes)) {
        if (!xmlName.test(key) || key === 'xmlns') issue(`${path}.attributes.${key}`, 'Invalid or reserved attribute name.');
        else if (!['string', 'boolean', 'number'].includes(typeof value) || (typeof value === 'number' && !Number.isFinite(value)) || String(value).length > 10000 || !xmlCharacters.test(String(value))) issue(`${path}.attributes.${key}`, 'Expected a valid XML text, boolean or finite number.');
        else attrs[key] = value as Value;
      }
    }
    if (raw.text !== undefined && (typeof raw.text !== 'string' || raw.text.length > 10000 || !xmlCharacters.test(raw.text))) issue(`${path}.text`, 'Expected valid XML text, at most 10,000 characters.');
    const children: XmlElement[] = [];
    if (raw.children !== undefined) {
      if (!Array.isArray(raw.children) || raw.children.length > 2000) issue(`${path}.children`, 'Expected an array of at most 2,000 XML elements.');
      else for (let i = 0; i < raw.children.length && nodeCount <= 2000; i++) {
        const node = readNode(raw.children[i], `${path}.children[${i}]`, depth + 1);
        if (node) children.push(node);
      }
    }
    if (raw.text !== undefined && children.length) issue(path, 'Use text or children, not both.');
    return element(raw.name, attrs, children, raw.text as string | undefined);
  };
  const modules: XmlElement[] = [];
  const managed = ['name', 'version', 'objective', 'created', 'phase', 'edition', 'game', 'gamemode', 'author', 'contributor', 'respawn', ...Object.keys(collections)];
  if (input.modules !== undefined) {
    if (!Array.isArray(input.modules) || input.modules.length > 200) issue('modules', 'Expected at most 200 additional modules.');
    else input.modules.forEach((raw, i) => {
      const node = readNode(raw, `modules[${i}]`, 0);
      if (node) {
        if (managed.includes(node.name)) issue(`modules[${i}].name`, 'Use the corresponding structured map field for this module.');
        modules.push(node);
      }
    });
  }
  if (issues.length) throw new MapValidationError(issues);
  const children: XmlElement[] = [];
  for (const key of ['name', 'version', 'objective', 'created', 'phase', 'edition', 'game']) {
    if (!empty(main[key])) children.push(element(key, {}, [], String(main[key])));
  }
  modes.forEach((mode) => children.push(element('gamemode', {}, [], mode)));
  const add = (name: string, nodes: XmlElement[]) => { if (nodes.length) children.push(element(name, {}, nodes)); };
  for (const key of ['authors', 'contributors']) add(key, rows[key].map((row) => element(key.slice(0, -1), attributes(row, ['name']), [], row.name ? String(row.name) : undefined)));
  add('teams', rows.teams.map((row) => element('team', attributes(row, ['name']), [], String(row.name))));
  add('kits', rows.kits.map((row) => element('kit', row, rows.items.filter((item) => item.kit === row.id).map((item) => element('item', attributes(item, ['kit']))))));
  add('regions', rows.regions.map((row) => element(String(row.type), attributes(row, ['type', 'point']), [], row.point ? String(row.point) : undefined)));
  // Wrap singleton filters so custom IDs also work in proto 1.5+.
  add('filters', rows.filters.map((row) => element('all', { id: row.id }, [element(String(row.type), {}, [], row.value ? String(row.value) : undefined)])));
  add('variables', rows.variables.map((row) => element('variable', row)));
  add('spawns', rows.spawns.map((row) => element(String(row.type), attributes(row, ['type', 'point']), row.point ? [element('regions', {}, [element('point', {}, [], String(row.point))])] : [])));
  add('respawns', rows.respawns.map((row) => element('respawn', row)));
  children.push(...modules);
  const warnings: string[] = [];
  if (modules.length) warnings.push('Additional module syntax is checked, but its PGM semantics and references must be verified on a PGM server.');
  if (!rows.teams.length && !modules.some((node) => node.name === 'players')) warnings.push('No teams or free-for-all players module is configured. Add one before using this map for a match.');
  if (!modules.some((node) => ['score', 'blitz', 'wools', 'flags', 'control-points', 'destroyables', 'cores', 'payloads'].includes(node.name))) warnings.push('No victory-condition module is configured. Gamemode labels alone do not define gameplay.');
  return { xml: `${main.declaration ? '<?xml version="1.0" encoding="UTF-8"?>\n' : ''}${serialize(element('map', { proto: main.proto }, children))}\n`, warnings };
}
