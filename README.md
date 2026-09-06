# PGMGen
A simple website to assist in generating XML files for [PvP Game Manager (PGM)](https://github.com/PGMDev/PGM) maps.

## Overview

The PGM builder generates XML through a stateless SvelteKit backend. It validates the map configuration, previews the result, and downloads a UTF-8 `map.xml` file.

The goal of PGMGen is to simplify the XML process of mapmaking, which can often take a long time depending on the complexity of the map. While this project was never meant to replace traditional text editors and manually editing XML files, we believe that by providing a user-friendly interface with straightforward explanation for the various modules offered by PGM, it can greatly reduce the time needed to make a working map.

### Roadmap
PGMGen is still in its infancy. As such, new features are actively being worked on and implemented.

#### Supported configuration
* Structured forms for map metadata, authors, contributors, teams, kits and inventory items, basic regions and filters, spawns, respawn rules, and variables.
* Advanced modules (including objectives, free-for-all players, actions, triggers, and shops) through an explicit JSON element tree. A working TDM configuration example is included in the builder; its coordinates must be adapted to your Minecraft world.
* Protocols 1.4.0, 1.4.1, 1.4.2, 1.5.0, and 1.5.1. Advanced module compatibility depends on the selected protocol.

#### Limitations
* XML import and persistent draft storage are not implemented. Reloading the page loses the current draft.
* The generator validates supported field types, required metadata, author identity, a single default spawn, team limits, IDs, core references, kit inheritance cycles, coordinates, and XML characters. Advanced module trees are checked for XML syntax and resource limits, **not** their PGM semantics or references. Item/material names and world geometry must also be checked in PGM.
* Gamemode labels only describe a map. Configure a victory condition (for example, `score`, `blitz`, or `wools`) to define gameplay. Generation can produce a partial gameplay configuration, accompanied by warnings.
* The legacy HTML pages and original unbound module mockups are retained as references; the active builder uses the shared schema and bound field/collection components.

## Usage

* Install Node.js 24 or newer, clone this repository, and run `npm ci` in the project's directory.
* Run `npm run dev` to start a local development webserver.
    * By default, the website will be located at `http://localhost:5173/`.
* For deploying purposes, you can use `npm run build` to compile everything without launching the webserver.
* Open `/builder/pgm`, fill in the map details, add an author and one default spawn, then click **Generate XML** and **Download map.xml**. The download is disabled after an edit until the updated draft is generated.
* Run `npm test`, `npm run check`, and `npm run build` to verify changes.
* Production hosting must run SvelteKit server endpoints. The existing `adapter-auto` configuration needs a supported host (or an adapter chosen for your host); a static GitHub Pages upload alone cannot serve this API.

## XML API

`POST /api/pgm` accepts `Content-Type: application/json` and returns `{ "xml": "...", "warnings": [] }`. `POST /api/pgm?download=1` returns the same XML as an attachment named `map.xml`. Neither endpoint stores maps or writes files on the server.

```json
{
  "main": {
    "proto": "1.5.1",
    "name": "My Arena",
    "version": "1.0.0",
    "objective": "Be the last player standing.",
    "declaration": true
  },
  "authors": [{ "name": "Mapmaker" }],
  "spawns": [
    { "type": "default", "point": "0.5,80,0.5" },
    { "type": "spawn", "point": "0.5,65,0.5" }
  ],
  "modules": [
    { "name": "players", "attributes": { "max": 16 } },
    { "name": "blitz", "children": [{ "name": "lives", "text": "1" }] }
  ]
}
```

Save this as `map.json` and use `curl -X POST -H "Content-Type: application/json" --data-binary @map.json "http://localhost:5173/api/pgm?download=1" -o map.xml` (on Windows, use `curl.exe`).

The full field definitions, enum values, and TypeScript interfaces live in [`src/lib/pgm/schema.ts`](src/lib/pgm/schema.ts). Collection fields are optional arrays. Required fields within supplied entries must be present. Optional empty strings are omitted; numbers may be JSON numbers or numeric strings, and booleans must be JSON booleans. IDs are unique across the structured modules. Kit items refer to their kit using `kit`, and parent kits use comma-separated IDs in `parents`.

An advanced XML element uses `{ "name": "tag", "attributes": { "key": "value" }, "text": "content" }` or `children` instead of `text`. Values are escaped; raw XML, DTD declarations, namespaces, and mixed text/children are not accepted. Modules managed by structured fields (including teams, kits, filters, regions, and spawns) cannot be duplicated through `modules`.

Errors return JSON with `error` and, for field validation, `issues: [{ "path": "teams[0].max", "message": "..." }]`:

| Status | Meaning |
| --- | --- |
| 400 | Missing body, malformed JSON, or invalid UTF-8 |
| 413 | Request exceeds 1 MiB (checked while streaming) |
| 415 | Content type is not JSON |
| 422 | Map validation failed; no XML is returned |

Each collection is limited to 200 entries. Advanced trees are limited to 2,000 nodes, 20 levels, and 100 attributes per node; individual strings are limited to 10,000 characters.

Format references: the supplied `PGM.md` source snapshot, [PGM map metadata](https://pgm.dev/docs/modules/general/main), [teams](https://pgm.dev/docs/modules/format/teams), [kits](https://pgm.dev/docs/modules/gear/kits), [regions](https://pgm.dev/docs/modules/mechanics/regions), [spawns](https://pgm.dev/docs/modules/mechanics/spawns), and [variables](https://pgm.dev/docs/modules/mechanics/variables).

## Contributing & Licensing
All contribution are welcomed. This project is available under the [MIT license](https://github.com/TheRealPear/pgmgen.github.io/blob/main/LICENSE).
