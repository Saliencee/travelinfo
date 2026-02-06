<script lang="ts">
	import { goto } from '$app/navigation';
	import { findCountry, flagEmoji, visaCategoryLabel } from '$lib/utils';
	import { countries } from '$lib/data/countries';
	import Combobox from '$lib/components/Combobox.svelte';
import type { EntryRule, VisaMatrixRule } from '$lib/types';

	export let data: {
		countries: { code: string; name: string }[];
		citizenship?: string;
		destination?: string;
		purpose?: string;
		stayDays?: number;
		transit?: string;
		transitHours?: number;
		rule?: Pick<EntryRule, 'visaType' | 'maxStayDays' | 'requirements' | 'lastUpdated' | 'sources'>;
		visaMatrixRule?: VisaMatrixRule;
		transitRule?: Pick<EntryRule, 'visaType' | 'maxStayDays' | 'requirements' | 'lastUpdated' | 'sources'>;
		transitVisaMatrixRule?: VisaMatrixRule;
		missingData: boolean;
	};

	let citizenshipInput = '';
	let destinationInput = '';
	let purposeInput = data.purpose && ['tourism', 'business', 'transit'].includes(data.purpose.toLowerCase())
		? data.purpose.charAt(0).toUpperCase() + data.purpose.slice(1).toLowerCase()
		: 'Tourism';
	let stayInput = data.stayDays ? String(data.stayDays) : '';
	let transitInput = '';
	let transitHoursInput = data.transitHours ? String(data.transitHours) : '';
	let lastCitizenship: string | undefined = undefined;
	let lastDestination: string | undefined = undefined;
	let lastTransit: string | undefined = undefined;

	const countryOptions = countries.map((c) => ({
		label: c.name,
		value: c.code,
		code: c.code,
		flag: flagEmoji(c.code)
	}));

	const purposeOptions = [
		{ label: 'Tourism', value: 'tourism' },
		{ label: 'Business', value: 'business' },
		{ label: 'Transit', value: 'transit' }
	];

$: if (data.citizenship !== lastCitizenship) {
	citizenshipInput = data.citizenship
		? `${findCountry(data.citizenship)?.name ?? data.citizenship} (${data.citizenship})`
		: '';
	lastCitizenship = data.citizenship;
}
$: if (data.destination !== lastDestination) {
	destinationInput = data.destination
		? `${findCountry(data.destination)?.name ?? data.destination} (${data.destination})`
		: '';
	lastDestination = data.destination;
}
$: if (data.transit !== lastTransit) {
	transitInput = data.transit
		? `${findCountry(data.transit)?.name ?? data.transit} (${data.transit})`
		: '';
	lastTransit = data.transit;
}
	$: destinationFlag = data.destination ? flagEmoji(data.destination) : '';
	$: transitFlag = data.transit ? flagEmoji(data.transit) : '';

	// Update inputs if data changes (e.g. navigation)
	$: if (data.purpose) {
		const p = data.purpose.toLowerCase();
		if (['tourism', 'business', 'transit'].includes(p)) {
			purposeInput = p.charAt(0).toUpperCase() + p.slice(1);
		} else {
			purposeInput = 'Tourism';
		}
	}
	$: stayInput = data.stayDays ? String(data.stayDays) : '';
	$: transitHoursInput = data.transitHours ? String(data.transitHours) : '';

	$: selectedCitizenshipCode = findCountry(citizenshipInput)?.code;
	$: selectedDestinationCode = findCountry(destinationInput)?.code;
	$: selectedTransitCode = findCountry(transitInput)?.code;

	$: citizenshipOptions = countryOptions.filter((c) => c.code !== selectedDestinationCode && c.code !== selectedTransitCode);
	$: destinationOptions = countryOptions.filter((c) => c.code !== selectedCitizenshipCode && c.code !== selectedTransitCode);
	$: transitOptions = countryOptions.filter((c) => c.code !== selectedCitizenshipCode && c.code !== selectedDestinationCode);

	let checked = new Set<string>();

	const toggleCheck = (id: string) => {
		if (checked.has(id)) {
			checked.delete(id);
		} else {
			checked.add(id);
		}
		checked = new Set(checked);
	};

	const submitForm = async () => {
		const citizenship = findCountry(citizenshipInput)?.code;
		const destination = findCountry(destinationInput)?.code;
		const transit = findCountry(transitInput)?.code;
		const purpose = purposeInput.toLowerCase();

		if (citizenship && destination && citizenship === destination) {
			alert('Citizenship and destination cannot be the same.');
			return;
		}

		if (transit && (transit === citizenship || transit === destination)) {
			alert('Transit country cannot be the same as citizenship or destination.');
			return;
		}

		const params = new URLSearchParams();
		if (citizenship) params.set('citizenship', citizenship);
		if (destination) params.set('destination', destination);
		if (transit) params.set('transit', transit);
		if (purpose) params.set('purpose', purpose);
		if (stayInput) params.set('stay', stayInput);
		if (transitHoursInput) params.set('transitHours', transitHoursInput);

		await goto(`/guide?${params.toString()}`);
	};

	const total = data.rule?.requirements.length ?? 0;
	const completed = Array.from(checked).length;

	const categoryLabels: Record<string, string> = {
		passport: 'Passport',
		visa: 'Visa',
		health: 'Health',
		money: 'Proof of funds',
		arrival: 'Arrival',
		other: 'Other'
	};

	$: groupedRequirements =
		data.rule?.requirements.reduce(
			(acc, item) => {
				const bucket = acc[item.category] ?? [];
				bucket.push(item);
				acc[item.category] = bucket;
				return acc;
			},
			{} as Record<string, EntryRule['requirements']>
		) ?? {};

	$: groupedTransitRequirements =
		data.transitRule?.requirements.reduce(
			(acc, item) => {
				const bucket = acc[item.category] ?? [];
				bucket.push(item);
				acc[item.category] = bucket;
				return acc;
			},
			{} as Record<string, EntryRule['requirements']>
		) ?? {};

	$: keyHighlights = data.rule?.requirements.slice(0, 3) ?? [];
	$: transitHighlights = data.transitRule?.requirements.slice(0, 3) ?? [];
</script>

<svelte:head>
	<title>Guide — Trip Entry Guide</title>
</svelte:head>

<main class="min-h-screen bg-black">
	<section class="mx-auto max-w-5xl px-6 pb-16 pt-14">
		<nav class="flex items-center justify-between text-sm text-neutral-500">
			<a href="/" class="font-semibold text-ink">Trip Entry Guide</a>
		</nav>
		<div class="flex flex-col gap-3">
			<a href="/" class="text-sm text-neutral-500">← Back to search</a>
			<h1 class="text-3xl font-semibold text-ink sm:text-4xl">Your entry guide</h1>
			<p class="text-neutral-600">
				Official sources and full checklist included. Everything is free.
			</p>
		</div>

		<form class="surface mt-8 grid gap-4 p-5 relative z-30" on:submit|preventDefault={submitForm}>
			<div class="grid gap-4 sm:grid-cols-[1fr_1fr] items-end">
				<label class="relative z-20 flex flex-col gap-2 text-sm text-neutral-600">
					<span>My citizenship is</span>
					<Combobox
						options={citizenshipOptions}
						placeholder="e.g. Canada"
						bind:value={citizenshipInput}
					/>
				</label>
				<label class="relative z-20 flex flex-col gap-2 text-sm text-neutral-600">
					<span>I’m traveling to</span>
					<Combobox
						options={destinationOptions}
						placeholder="e.g. Japan"
						bind:value={destinationInput}
					/>
				</label>
			</div>
			<div class="grid gap-4 sm:grid-cols-[1fr_1fr_auto] items-end">
				<label class="relative z-10 flex flex-col gap-2 text-sm text-neutral-600">
					<span>Trip purpose</span>
					<Combobox
						options={purposeOptions}
						placeholder="Tourism"
						bind:value={purposeInput}
					/>
				</label>
				<label class="relative z-10 flex flex-col gap-2 text-sm text-neutral-600">
					<span>Length of stay (optional)</span>
					<div class="relative w-full">
						<input
							type="number"
							min="1"
							class="input-field w-full pr-12"
							placeholder="Days"
							bind:value={stayInput}
						/>
						<span
							class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neutral-500"
						>
							Days
						</span>
					</div>
				</label>
				<button
					type="submit"
					class="btn-primary mt-6 w-full sm:mt-0 sm:w-auto"
				>
					Check requirements
				</button>
			</div>
			
			<div class="grid gap-4 sm:grid-cols-[1fr_1fr] items-end border-t border-neutral-800 pt-4 mt-2">
				<label class="relative z-0 flex flex-col gap-2 text-sm text-neutral-600">
					<span>Transit country (optional)</span>
					<Combobox
						options={transitOptions}
						placeholder="e.g. Germany"
						bind:value={transitInput}
					/>
				</label>
				<label class="relative z-0 flex flex-col gap-2 text-sm text-neutral-600">
					<span>Transit duration</span>
					<div class="relative w-full">
						<input
							type="number"
							min="0"
							step="0.5"
							class="input-field w-full pr-16"
							placeholder="Hours"
							bind:value={transitHoursInput}
						/>
						<span
							class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neutral-500"
						>
							Hours
						</span>
					</div>
				</label>
			</div>
		</form>

		{#if !data.citizenship || !data.destination}
			<div class="surface mt-10 p-6 text-sm text-neutral-600">
				Add both citizenship and destination to view your guide.
			</div>
		{:else}
			<section class="surface relative mt-8 p-6">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-ink">Full checklist</h2>
					{#if data.rule}
						<span class="text-sm text-neutral-500">{completed}/{total} completed</span>
					{/if}
				</div>

				{#if data.transit}
					<div class="mt-6 rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
						<div class="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
							<div>
								<p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
									In-transit essentials
								</p>
										<h3 class="flex items-center gap-2 text-sm font-semibold text-ink">
											{#if transitFlag}
												<span class="text-base" aria-hidden="true">{transitFlag}</span>
											{/if}
											<span>{findCountry(data.transit)?.name ?? data.transit} transit requirements</span>
								</h3>
							</div>
							{#if data.transitHours}
								<p class="text-xs text-neutral-500">Layover: {data.transitHours} hours</p>
							{/if}
						</div>
						{#if data.transitVisaMatrixRule}
							<div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
								<span class="rounded-full border border-neutral-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
									Visa status
								</span>
								<span class="text-sm font-semibold text-ink">
									{visaCategoryLabel(data.transitVisaMatrixRule.category)}
								</span>
								{#if data.transitVisaMatrixRule.maxStayDays}
									<span class="text-xs text-neutral-500">
										Max stay: {data.transitVisaMatrixRule.maxStayDays} days
									</span>
								{/if}
							</div>
						{/if}

						{#if data.transitRule && Object.keys(groupedTransitRequirements).length > 0}
							<div class="mt-4 space-y-6">
								{#each Object.entries(groupedTransitRequirements) as [category, items]}
									<div class="space-y-3">
										<p class="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
											{categoryLabels[category] ?? category}
										</p>
										{#each items as item}
											<label class="flex gap-3 rounded-xl border border-neutral-800 bg-neutral-950/80 p-4">
												<input
													type="checkbox"
													checked={checked.has(item.id)}
													class="mt-1 h-4 w-4 accent-black"
													on:change={() => toggleCheck(item.id)}
												/>
												<div>
													<p class="text-sm font-semibold text-ink">{item.title}</p>
													<p class="text-sm text-neutral-600">{item.details}</p>
													{#if item.sourceUrls?.length}
														<div class="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500">
															{#each item.sourceUrls as url}
																<a class="break-url" href={url} rel="noreferrer" target="_blank">{url}</a>
															{/each}
														</div>
													{/if}
												</div>
											</label>
										{/each}
									</div>
								{/each}
							</div>
						{:else}
							<p class="mt-4 text-sm text-neutral-600">
								No structured transit checklist yet for this route.
							</p>
						{/if}
					</div>
				{/if}

				{#if data.visaMatrixRule}
					<div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
						<span class="rounded-full border border-neutral-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
							Visa status
						</span>
						<span class="text-sm font-semibold text-ink">
							{visaCategoryLabel(data.visaMatrixRule.category)}
						</span>
						{#if data.visaMatrixRule.maxStayDays}
							<span class="text-xs text-neutral-500">
								Max stay: {data.visaMatrixRule.maxStayDays} days
							</span>
						{/if}
					</div>
				{/if}

				{#if !data.rule}
					<p class="mt-4 text-sm text-neutral-600">
						No structured checklist yet for this route.
					</p>
				{:else}
					<div class="mt-6 space-y-6">
						<h3 class="text-md font-semibold text-ink mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
							{#if destinationFlag}
								<span class="text-base" aria-hidden="true">{destinationFlag}</span>
							{/if}
							<span>Destination: {findCountry(data.destination)?.name ?? data.destination}</span>
						</h3>

						{#each Object.entries(groupedRequirements) as [category, items]}
							<div class="space-y-3">
								<p class="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
									{categoryLabels[category] ?? category}
								</p>
								{#each items as item}
									<label class="flex gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
										<input
											type="checkbox"
											checked={checked.has(item.id)}
											class="mt-1 h-4 w-4 accent-black"
											on:change={() => toggleCheck(item.id)}
										/>
										<div>
											<p class="text-sm font-semibold text-ink">{item.title}</p>
											<p class="text-sm text-neutral-600">{item.details}</p>
											{#if item.sourceUrls?.length}
												<div class="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500">
													{#each item.sourceUrls as url}
														<a class="break-url" href={url} rel="noreferrer" target="_blank">{url}</a>
													{/each}
												</div>
											{/if}
										</div>
									</label>
								{/each}
							</div>
						{/each}
					</div>
				{/if}

			</section>

			<section class="mt-6">
				<div class="surface p-6">
					<h2 class="text-lg font-semibold text-ink">Official sources</h2>
					<div class="mt-4 flex flex-col gap-2 text-sm text-neutral-600">
						{#if data.transitRule?.sources?.length}
							<p class="text-xs font-semibold text-neutral-500 uppercase mt-2">Transit Sources</p>
							{#each data.transitRule.sources as source}
								<a class="break-url" href={source} rel="noreferrer" target="_blank">{source}</a>
							{/each}
						{/if}
						
						{#if data.rule?.sources?.length}
							{#if data.transitRule}<p class="text-xs font-semibold text-neutral-500 uppercase mt-2">Destination Sources</p>{/if}
							{#each data.rule.sources as source}
								<a class="break-url" href={source} rel="noreferrer" target="_blank">{source}</a>
							{/each}
						{:else if !data.transitRule?.sources?.length}
							<a class="break-url" href="https://www.iatatravelcentre.com/" rel="noreferrer" target="_blank">
								IATA Travel Centre
							</a>
							<a class="break-url" href="https://www.gov.uk/foreign-travel-advice" rel="noreferrer" target="_blank">
								GOV.UK travel advice
							</a>
						{/if}
					</div>
					<p class="mt-4 text-xs text-neutral-500">
						Informational only, not legal advice. Always verify with official sources.
					</p>
				</div>
			</section>
		{/if}
	</section>
</main>
