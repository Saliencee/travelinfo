<script lang="ts">
	import { fade } from 'svelte/transition';

	interface ComboboxOption {
		label: string;
		value: string;
		code?: string; // Keeping 'code' as optional for backward compatibility/ease or we can just use it for display
		flag?: string;
	}

	export let options: ComboboxOption[] = [];
	export let placeholder = '';
	export let value = '';

	let isOpen = false;
	let inputElement: HTMLInputElement;
	let containerElement: HTMLDivElement;

	$: normalizedValue = value.toLowerCase();
	$: isExactMatch = options.some((o) => {
		const fullLabel = o.code ? `${o.label} (${o.code})` : o.label;
		return fullLabel.toLowerCase() === normalizedValue;
	});
	$: selectedOption = options.find((o) => {
		if (!normalizedValue) return false;
		const fullLabel = o.code ? `${o.label} (${o.code})` : o.label;
		return (
			o.code?.toLowerCase() === normalizedValue ||
			o.label.toLowerCase() === normalizedValue ||
			fullLabel.toLowerCase() === normalizedValue
		);
	});
	$: selectedFlag = selectedOption?.flag ?? '';

	$: filteredOptions =
		value && !isExactMatch
			? options.filter((option) => {
					const search = normalizedValue;
					return (
						option.label.toLowerCase().includes(search) ||
						(option.code && option.code.toLowerCase().includes(search))
					);
			  })
			: options;

	function handleInput(event: Event) {
		value = (event.target as HTMLInputElement).value;
		isOpen = true;
	}

	function selectOption(option: ComboboxOption) {
		value = option.code ? `${option.label} (${option.code})` : option.label;
		isOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
			inputElement.blur();
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (containerElement && !containerElement.contains(event.target as Node)) {
			isOpen = false;
		}
	}
	
	function handleFocus() {
		isOpen = true;
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="relative w-full" bind:this={containerElement}>
	{#if selectedFlag}
		<span class="pointer-events-none absolute left-3 top-0 bottom-0 flex items-center text-base" aria-hidden="true">
			{selectedFlag}
		</span>
	{/if}
	<input
		bind:this={inputElement}
		type="text"
		class="input-field w-full"
		class:with-flag={!!selectedFlag}
		{placeholder}
		{value}
		on:input={handleInput}
		on:focus={handleFocus}
		on:keydown={handleKeydown}
		role="combobox"
		aria-expanded={isOpen}
		aria-controls="options-list"
		aria-autocomplete="list"
	/>
	
	{#if isOpen && filteredOptions.length > 0}
		<ul
			id="options-list"
			class="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[50vh] overflow-y-auto overscroll-contain rounded-xl border border-[#262626] bg-[#111] py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none"
			transition:fade={{ duration: 100 }}
			role="listbox"
		>
			{#each filteredOptions as option}
				<li>
					<button
						type="button"
						class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-neutral-300 hover:bg-[#262626] hover:text-white transition-colors duration-150"
						on:click={() => selectOption(option)}
						role="option"
						aria-selected={value === (option.code ? `${option.label} (${option.code})` : option.label)}
					>
						{#if option.flag}
							<span class="text-base" aria-hidden="true">{option.flag}</span>
						{/if}
						<span class="min-w-0 truncate">
							{option.label}
							{#if option.code}
								<span class="text-neutral-500 ml-1">({option.code})</span>
							{/if}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	/* Custom scrollbar to match dark theme */
	ul::-webkit-scrollbar {
		width: 8px;
	}

	ul::-webkit-scrollbar-track {
		background: #111;
		border-radius: 0 12px 12px 0;
	}

	ul::-webkit-scrollbar-thumb {
		background-color: #333;
		border-radius: 4px;
		border: 2px solid #111;
	}
	
	ul::-webkit-scrollbar-thumb:hover {
		background-color: #444;
	}

    ul {
        scrollbar-width: thin;
        scrollbar-color: #333 #111;
    }
</style>
