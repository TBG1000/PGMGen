<script lang="ts">
  import '$lib/css/override.css';
  import Fields from '$lib/modules/pgm/fields.svelte';
  import Entries from '$lib/modules/pgm/entries.svelte';
  import { collections, createMap, gamemodes, mainFields, type Entry, type MapDocument } from '$lib/pgm/schema';
  import { exampleMap } from '$lib/pgm/example';
  import type { ValidationIssue } from '$lib/pgm/generate';
  import { resolve } from '$app/paths';

  let main = $state<Entry>(createMap().main);
  let lists = $state<Record<string, Entry[]>>(Object.fromEntries(Object.keys(collections).map((name) => [name, []])));
  let modes = $state<string[]>([]);
  let modulesText = $state('[]');
  let active = $state('main');
  let xml = $state('');
  let warnings = $state<string[]>([]);
  let issues = $state<ValidationIssue[]>([]);
  let error = $state('');
  let busy = $state(false);
  let generatedFrom = $state('');
  let attemptedFrom = $state('');
  const draft = $derived(JSON.stringify({ main, lists, modes, modulesText }));
  const current = $derived(generatedFrom === draft && !!xml);

  function load(map: MapDocument) {
    main = map.main;
    lists = Object.fromEntries(Object.keys(collections).map((name) => [name, (map[name as keyof MapDocument] ?? []) as Entry[]]));
    modes = map.gamemodes ?? [];
    modulesText = JSON.stringify(map.modules ?? [], null, 2);
    xml = ''; error = ''; issues = []; warnings = []; generatedFrom = ''; attemptedFrom = '';
  }
  async function generate() {
    const snapshot = draft;
    attemptedFrom = snapshot;
    error = ''; issues = []; xml = ''; warnings = []; generatedFrom = '';
    let modules: unknown;
    try { modules = JSON.parse(modulesText); }
    catch { error = 'Additional modules must contain valid JSON. Check the Advanced Modules tab.'; return; }
    busy = true;
    try {
      const response = await fetch(resolve('/api/pgm'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ main, ...lists, gamemodes: modes, modules })
      });
      const result = await response.json();
      if (snapshot !== draft) return;
      if (!response.ok) {
        error = result.error ?? 'XML generation failed.';
        issues = result.issues ?? [];
        return;
      }
      xml = result.xml; warnings = result.warnings; generatedFrom = snapshot;
    } catch { if (snapshot === draft) error = 'Unable to reach the generator. Please try again.'; }
    finally { busy = false; }
  }
  function download() {
    if (!current) return;
    const url = URL.createObjectURL(new Blob([xml], { type: 'application/xml;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'map.xml';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
</script>

<svelte:head><title>PGM XML Generator - PGMGen</title></svelte:head>
<div class="text-white bg-dark bg-gradient p-4 rounded-3 m-3">
  <h1 class="display-6">PGM XML Generator</h1>
  <p class="lead">Build your map configuration, check its values, and download map.xml.</p>
</div>
<div class="container-fluid px-4 pb-4">
  <div class="row g-4">
    <aside class="col-lg-2">
      <h2 class="h5">PGM Modules</h2>
      <nav class="nav flex-column nav-pills" aria-label="Map modules">
        <button type="button" class:active={active === 'main'} class="nav-link text-start" onclick={() => active = 'main'}>Main Map Elements</button>
        {#each Object.entries(collections) as [key, schema]}
          <button type="button" class:active={active === key} class="nav-link text-start" onclick={() => active = key}>{schema.label} ({lists[key].length})</button>
        {/each}
        <button type="button" class:active={active === 'advanced'} class="nav-link text-start" onclick={() => active = 'advanced'}>Advanced Modules</button>
      </nav>
      <hr>
      <button class="btn btn-outline-secondary w-100" type="button" onclick={() => load(exampleMap())} disabled={busy}>Load TDM example</button>
      <p class="small text-body-secondary mt-2">Loading the example replaces the current draft. Adjust its coordinates to your world.</p>
    </aside>
    <section class="col-lg-5" aria-label="Map attributes">
      {#if active === 'main'}
        <div class="card mb-3">
          <div class="card-header">Main Map Elements</div>
          <div class="card-body">
            <p class="text-body-secondary">Fields marked * are required. Add an author and exactly one default spawn before generating.</p>
            <Fields bind:entry={main} fields={mainFields} prefix="map" />
            <fieldset>
              <legend class="h6">Gamemode labels</legend>
              <p class="small text-body-secondary">Labels affect the map listing. Configure victory conditions in Advanced Modules.</p>
              {#each gamemodes as mode}
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="checkbox" id={`gamemode-${mode}`} value={mode} bind:group={modes}>
                  <label class="form-check-label" for={`gamemode-${mode}`}>{mode}</label>
                </div>
              {/each}
            </fieldset>
          </div>
        </div>
      {:else if active === 'advanced'}
        <div class="card mb-3">
          <div class="card-header">Advanced Modules</div>
          <div class="card-body">
            <p>Add objectives, free-for-all players, actions, triggers, shops, and other PGM modules as a JSON array of XML elements.</p>
            <p>Each element has a <code>name</code>, optional <code>attributes</code>, and either <code>text</code> or <code>children</code>. These modules require a PGM server to verify gameplay rules and references.</p>
            <label class="form-label" for="additional-modules">Additional modules (JSON)</label>
            <textarea class="form-control font-monospace" id="additional-modules" rows="18" bind:value={modulesText} spellcheck="false"></textarea>
            <details class="mt-3">
              <summary>Example: first to 20 kills</summary>
              <pre class="bg-body-tertiary p-2 mt-2">{JSON.stringify([{ name: 'score', children: [{ name: 'kills', text: '1' }, { name: 'limit', text: '20' }] }], null, 2)}</pre>
            </details>
            <a href="https://pgm.dev/docs/" target="_blank" rel="noreferrer">PGM module reference</a>
          </div>
        </div>
      {:else}
        {#key active}<Entries name={active} bind:entries={lists[active]} />{/key}
      {/if}
      <button type="button" class="btn btn-outline-danger" onclick={() => {
        if (active === 'main') { main = createMap().main; modes = []; }
        else if (active === 'advanced') modulesText = '[]';
        else lists[active] = [];
      }}>Clear Input</button>
    </section>
    <section class="col-lg-5" aria-label="XML output">
      <div class="output-panel">
        <h2 class="h5">XML Output</h2>
        <div class="d-flex flex-wrap gap-2 mb-3">
          <button type="button" class="btn btn-success" onclick={generate} disabled={busy}>{busy ? 'Generating…' : 'Generate XML'}</button>
          <button type="button" class="btn btn-primary" onclick={download} disabled={!current || busy}>Download map.xml</button>
          <button type="button" class="btn btn-outline-danger" onclick={() => { if (window.confirm('Clear all map entries? Unsaved changes will be lost.')) load(createMap()); }}>Clear All</button>
        </div>
        {#if attemptedFrom === draft && error}
          <div class="alert alert-danger" role="alert">
            <p class="mb-1">{error}</p>
            {#if issues.length}<ul class="mb-0">{#each issues as issue}<li><strong>{issue.path}</strong>: {issue.message}</li>{/each}</ul>{/if}
          </div>
        {/if}
        {#if current && warnings.length}
          <div class="alert alert-warning" role="status"><ul class="mb-0">{#each warnings as warning}<li>{warning}</li>{/each}</ul></div>
        {/if}
        {#if xml && !current}<p role="status">The draft changed. Generate again to update the XML.</p>{/if}
        <label class="visually-hidden" for="xml-output">Generated XML</label>
        <textarea class="form-control font-monospace bg-light-subtle" id="xml-output" rows="24" value={current ? xml : ''} placeholder="Generate your map to preview its XML here." readonly></textarea>
      </div>
    </section>
  </div>
</div>

<style>
  @media (min-width: 992px) { .output-panel { position: sticky; top: 1rem; } }
  pre { white-space: pre-wrap; }
</style>
