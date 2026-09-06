/** Shared form/API schema. Optional blank values are omitted from XML. */
export type Value = string | number | boolean;
export type Entry = Record<string, Value | undefined>;
export interface Field {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'boolean' | 'textarea';
  options?: readonly string[];
  required?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
  format?: 'id' | 'uuid' | 'version' | 'date' | 'vector2' | 'vector3';
  placeholder?: string;
  when?: Record<string, string[]>;
}
export const protocols = ['1.5.1', '1.5.0', '1.4.2', '1.4.1', '1.4.0'] as const;
export const gamemodes = ['ad', 'arcade', 'bedwars', 'blitz', 'br', 'bridge', 'cp', 'ctf', 'ctw', 'dtc', 'dtm', '5cp', 'ffa', 'ffb', 'infection', 'kotf', 'koth', 'mixed', 'payload', 'rage', 'rfw', 'scorebox', 'skywars', 'sg', 'tdm'] as const;
export const colors = ['black', 'dark blue', 'dark green', 'dark aqua', 'dark red', 'dark purple', 'gold', 'gray', 'dark gray', 'blue', 'green', 'aqua', 'red', 'light purple', 'yellow', 'white'];
const id: Field = { key: 'id', label: 'ID', required: true, format: 'id' };
const scope: Field = { key: 'scope', label: 'Scope', required: true, options: ['player', 'team', 'match'] };
const person: Field[] = [
  { key: 'uuid', label: 'Minecraft UUID', format: 'uuid' },
  { key: 'name', label: 'Name (required without a UUID)' },
  { key: 'contribution', label: 'Contribution notes' }
];
export const mainFields: Field[] = [
  { key: 'proto', label: 'Protocol version', required: true, options: protocols },
  { key: 'name', label: 'Map name', required: true },
  { key: 'version', label: 'Map version', required: true, format: 'version', placeholder: '1.0.0' },
  { key: 'objective', label: 'Map objective', required: true, type: 'textarea' },
  { key: 'created', label: 'Creation date', format: 'date', placeholder: 'YYYY-MM-DD' },
  { key: 'phase', label: 'Phase', options: ['production', 'staging', 'development'] },
  { key: 'edition', label: 'Edition', options: ['standard', 'ranked', 'tournament'] },
  { key: 'game', label: 'Custom game title' },
  { key: 'declaration', label: 'Include XML declaration', type: 'boolean' }
];
export const collections: Record<string, { label: string; singular: string; fields: Field[] }> = {
  authors: { label: 'Authors', singular: 'Author', fields: person },
  contributors: { label: 'Contributors', singular: 'Contributor', fields: person },
  teams: { label: 'Teams', singular: 'Team', fields: [id,
    { key: 'name', label: 'Team name', required: true },
    { key: 'color', label: 'Color', options: colors },
    { key: 'plural', label: 'Plural name', type: 'boolean' },
    { key: 'show-name-tags', label: 'Show name tags', options: ['true', 'false', 'allies', 'enemies'] },
    { key: 'min', label: 'Minimum players', type: 'number', min: 0, integer: true },
    { key: 'max', label: 'Maximum players', type: 'number', min: 1, integer: true, required: true },
    { key: 'max-overfill', label: 'Maximum overfill', type: 'number', min: 1, integer: true }
  ] },
  kits: { label: 'Kits', singular: 'Kit', fields: [id,
    { key: 'parents', label: 'Parent kit IDs (comma separated)' },
    { key: 'filter', label: 'Filter ID', format: 'id' },
    { key: 'force', label: 'Force kit', type: 'boolean' },
    { key: 'potion-particles', label: 'Show potion particles', type: 'boolean' },
    { key: 'reset-ender-pearls', label: 'Reset ender pearls', type: 'boolean' }
  ] },
  items: { label: 'Kit items', singular: 'Item', fields: [
    { key: 'kit', label: 'Kit ID', required: true, format: 'id' },
    { key: 'material', label: 'Material', required: true, placeholder: 'iron sword' },
    { key: 'slot', label: 'Inventory slot', type: 'number', integer: true, min: 0, max: 35 },
    { key: 'amount', label: 'Amount', type: 'number', integer: true, min: 1, max: 64 },
    { key: 'unbreakable', label: 'Unbreakable', type: 'boolean' }
  ] },
  regions: { label: 'Regions', singular: 'Region', fields: [id,
    { key: 'type', label: 'Shape', required: true, options: ['cuboid', 'cylinder', 'block', 'sphere', 'point', 'rectangle', 'circle', 'half', 'above', 'below'] },
    { key: 'min', label: 'Minimum coordinates', required: true, when: { type: ['cuboid', 'rectangle'] } },
    { key: 'max', label: 'Maximum coordinates', required: true, when: { type: ['cuboid', 'rectangle'] } },
    { key: 'point', label: 'Coordinates (x,y,z)', required: true, format: 'vector3', when: { type: ['point', 'block'] } },
    { key: 'base', label: 'Base (x,y,z)', required: true, format: 'vector3', when: { type: ['cylinder'] } },
    { key: 'origin', label: 'Origin (x,y,z)', required: true, format: 'vector3', when: { type: ['sphere', 'half'] } },
    { key: 'normal', label: 'Normal (x,y,z)', required: true, format: 'vector3', when: { type: ['half'] } },
    { key: 'center', label: 'Center (x,z)', required: true, format: 'vector2', when: { type: ['circle'] } },
    { key: 'radius', label: 'Radius', required: true, type: 'number', min: 0.000001, when: { type: ['cylinder', 'sphere', 'circle'] } },
    { key: 'height', label: 'Height', required: true, type: 'number', min: 0.000001, when: { type: ['cylinder'] } },
    { key: 'y', label: 'Y level', required: true, type: 'number', when: { type: ['above', 'below'] } }
  ] },
  spawns: { label: 'Spawns', singular: 'Spawn', fields: [
    { key: 'type', label: 'Spawn type', required: true, options: ['spawn', 'default'] },
    { key: 'team', label: 'Team ID (blank for all players)', format: 'id', when: { type: ['spawn'] } },
    { key: 'region', label: 'Region ID (or enter a point below)', format: 'id' },
    { key: 'point', label: 'Spawn point (x,y,z)', format: 'vector3' },
    { key: 'yaw', label: 'Yaw', type: 'number', min: -180, max: 180 },
    { key: 'pitch', label: 'Pitch', type: 'number', min: -90, max: 90 },
    { key: 'kit', label: 'Kit ID', format: 'id' },
    { key: 'filter', label: 'Filter ID', format: 'id' },
    ...['safe', 'sequential', 'spread', 'exclusive', 'persistent'].map((key): Field => ({ key, label: key, type: 'boolean' }))
  ] },
  respawns: { label: 'Respawn rules', singular: 'Respawn rule', fields: [
    { key: 'delay', label: 'Delay (seconds)', type: 'number', min: 0 },
    { key: 'filter', label: 'Filter ID', format: 'id' },
    { key: 'message', label: 'Message' },
    ...['auto', 'blackout', 'spectate'].map((key): Field => ({ key, label: key, type: 'boolean' }))
  ] },
  filters: { label: 'Filters', singular: 'Filter', fields: [id,
    { key: 'type', label: 'Filter type', required: true, options: ['always', 'never', 'team', 'material', 'participating', 'crouching', 'sprinting', 'flying'] },
    { key: 'value', label: 'Team ID or material', required: true, when: { type: ['team', 'material'] } }
  ] },
  variables: { label: 'Variables', singular: 'Variable', fields: [id, scope,
    { key: 'default', label: 'Default value', type: 'number' }
  ] }
};
export function isVisible(field: Field, entry: Entry): boolean {
  return !field.when || Object.entries(field.when).every(([key, values]) => typeof entry[key] === 'string' && values.includes(entry[key] as string));
}
/** Advanced PGM modules use an XML tree, never unescaped XML strings. */
export interface XmlElement {
  name: string;
  attributes?: Record<string, Value>;
  text?: string;
  children?: XmlElement[];
}
export interface MapDocument {
  main: Entry;
  gamemodes?: string[];
  authors?: Entry[];
  contributors?: Entry[];
  teams?: Entry[];
  kits?: Entry[];
  items?: Entry[];
  regions?: Entry[];
  spawns?: Entry[];
  respawns?: Entry[];
  filters?: Entry[];
  variables?: Entry[];
  modules?: XmlElement[];
}
export function createMap(): MapDocument {
  return { main: { proto: protocols[0], version: '1.0.0', declaration: true }, gamemodes: [], authors: [], contributors: [], teams: [], kits: [], items: [], regions: [], spawns: [], respawns: [], filters: [], variables: [], modules: [] };
}
