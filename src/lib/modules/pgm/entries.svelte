<script lang="ts">
  import Fields from './fields.svelte';
  import { collections, type Entry } from '$lib/pgm/schema';
  let { name, entries = $bindable([]) }: { name: string; entries: Entry[] } = $props();
  const schema = $derived(collections[name]);
</script>

<h2 class="h5">{schema.label}</h2>
{#each entries as entry, i (entry)}
  <div class="card mb-3">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span>{schema.singular} {i + 1}</span>
      <button type="button" class="btn btn-sm btn-outline-danger" aria-label={`Delete ${schema.singular} ${i + 1}`}
        onclick={() => entries = entries.filter((_, index) => index !== i)}>Delete</button>
    </div>
    <div class="card-body"><Fields bind:entry={entries[i]} fields={schema.fields} prefix={`${name}-${i}`} /></div>
  </div>
{/each}
<button type="button" class="btn btn-success mb-3" onclick={() => entries = [...entries, {}]}>New {schema.singular}</button>
