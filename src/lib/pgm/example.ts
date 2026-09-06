import { createMap, type MapDocument } from './schema.ts';

/** Original, small TDM example; map coordinates must match the user's world. */
export function exampleMap(): MapDocument {
  return {
    ...createMap(),
    main: { proto: '1.5.1', name: 'Two Towers', version: '1.0.0', objective: 'Reach 20 kills to win.', declaration: true },
    authors: [{ name: 'Mapmaker' }],
    teams: [{ id: 'red', name: 'Red', color: 'red', max: 8 }, { id: 'blue', name: 'Blue', color: 'blue', max: 8 }],
    kits: [{ id: 'spawn-kit' }],
    items: [{ kit: 'spawn-kit', slot: 0, material: 'iron sword', unbreakable: true }, { kit: 'spawn-kit', slot: 1, material: 'bread', amount: 16 }],
    spawns: [
      { type: 'default', point: '0.5,80,0.5' },
      { type: 'spawn', team: 'red', kit: 'spawn-kit', point: '20.5,65,0.5', yaw: 90 },
      { type: 'spawn', team: 'blue', kit: 'spawn-kit', point: '-20.5,65,0.5', yaw: -90 }
    ],
    modules: [{ name: 'score', children: [{ name: 'kills', text: '1' }, { name: 'limit', text: '20' }] }]
  };
}
