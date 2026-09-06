<script lang="ts">
  import { isVisible, type Entry, type Field } from '$lib/pgm/schema';
  let { entry = $bindable(), fields, prefix }: { entry: Entry; fields: Field[]; prefix: string } = $props();
</script>

{#each fields as field (field.key)}
  {#if isVisible(field, entry)}
    <div class="mb-3">
      <label class="form-label" for={`${prefix}-${field.key}`}>{field.label}{field.required ? ' *' : ''}</label>
      {#if field.options || field.type === 'boolean'}
        <select class="form-select" id={`${prefix}-${field.key}`} value={String(entry[field.key] ?? '')}
          onchange={(event) => {
            const value = event.currentTarget.value;
            entry[field.key] = field.type === 'boolean' && value !== '' ? value === 'true' : value;
          }}>
          <option value="">{field.required ? 'Choose…' : 'Use PGM default'}</option>
          {#each field.options ?? ['true', 'false'] as value}<option {value}>{value}</option>{/each}
        </select>
      {:else if field.type === 'textarea'}
        <textarea class="form-control" id={`${prefix}-${field.key}`} rows="3" value={String(entry[field.key] ?? '')}
          oninput={(event) => entry[field.key] = event.currentTarget.value}></textarea>
      {:else}
        <input class="form-control" id={`${prefix}-${field.key}`} type={field.type === 'number' ? 'number' : 'text'}
          value={entry[field.key] ?? ''} placeholder={field.placeholder} min={field.min} max={field.max}
          step={field.integer ? 1 : 'any'} oninput={(event) => entry[field.key] = event.currentTarget.value}>
      {/if}
    </div>
  {/if}
{/each}
