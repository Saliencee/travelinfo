<script lang="ts">
	import { goto } from "$app/navigation";
	import { countries, regions } from "$lib/data/countries";
	import { findCountry, flagEmoji } from "$lib/utils";
	import Combobox from "$lib/components/Combobox.svelte";

	let citizenshipInput = "";
	let destinationInput = "";

	const countryOptions = countries.map((c) => ({
		label: c.name,
		value: c.code,
		code: c.code,
		flag: flagEmoji(c.code)
	}));

	$: selectedCitizenshipCode = findCountry(citizenshipInput)?.code;
	$: selectedDestinationCode = findCountry(destinationInput)?.code;

	$: citizenshipOptions = countryOptions.filter(
		(c) => c.code !== selectedDestinationCode,
	);
	$: destinationOptions = countryOptions.filter(
		(c) => c.code !== selectedCitizenshipCode,
	);

	const submitForm = async () => {
		const citizenship = findCountry(citizenshipInput)?.code;
		const destination = findCountry(destinationInput)?.code;

		if (citizenship && destination && citizenship === destination) {
			alert("Citizenship and destination cannot be the same.");
			return;
		}

		const params = new URLSearchParams();
		if (citizenship) params.set("citizenship", citizenship);
		if (destination) params.set("destination", destination);

		await goto(`/guide?${params.toString()}`);
	};
</script>

<svelte:head>
	<title>Trip Entry Guide — quick visa checks for travelers</title>
	<meta name="description" content="Check entry requirements fast." />
</svelte:head>

<main class="min-h-screen bg-black">
	<section class="mx-auto max-w-5xl px-6 pb-16 pt-8">
		<nav
			class="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-500"
		>
			<span class="font-semibold text-ink">Trip Entry Guide</span>
		</nav>
		<div class="flex flex-col gap-6">
			<div
				class="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500"
			>
				<span class="h-2 w-2 rounded-full bg-neutral-300"></span>
				<span>Entry requirements, simplified</span>
			</div>
			<h1
				class="text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
			>
				Know what you need before you land.
			</h1>
			<p class="max-w-2xl text-lg text-neutral-600">
				Trip Entry Guide gives you a quick visa answer and a detailed
				checklist for your route in seconds.
			</p>
		</div>

		<form
			class="surface mt-10 grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] items-end relative z-30"
			on:submit|preventDefault={submitForm}
		>
			<label
				class="relative z-20 flex flex-col gap-2 text-sm text-neutral-600"
			>
				<span>My citizenship is</span>
				<Combobox
					options={citizenshipOptions}
					placeholder="e.g. France"
					bind:value={citizenshipInput}
				/>
			</label>
			<label
				class="relative z-20 flex flex-col gap-2 text-sm text-neutral-600"
			>
				<span>I’m traveling to</span>
				<Combobox
					options={destinationOptions}
					placeholder="e.g. Japan"
					bind:value={destinationInput}
				/>
			</label>
			<button type="submit" class="btn-primary mt-6 w-full sm:mt-0 sm:w-auto">
				Check requirements
			</button>
		</form>

		<section class="mt-16">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-ink">
					Browse destinations
				</h2>
				<span class="text-sm text-neutral-500">Grouped by region</span>
			</div>
			<div class="mt-6 grid gap-8 md:grid-cols-2">
				{#each regions as region}
					<div class="surface p-5">
						<h3
							class="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500"
						>
							{region}
						</h3>
						<div class="mt-4 grid gap-2">
							{#each countries.filter((country) => country.region === region) as country}
								<a
									class="card-link"
									href={`/guide?destination=${country.code}`}
								>
									<span class="flex items-center gap-2">
										<span class="text-base" aria-hidden="true">{flagEmoji(country.code)}</span>
										<span>{country.name}</span>
									</span>
									<span class="text-xs text-neutral-400"
										>{country.code}</span
									>
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</section>
	</section>

	<footer class="border-t border-neutral-800 py-8">
		<div
			class="mx-auto flex max-w-5xl flex-col gap-2 px-6 text-sm text-neutral-500"
		>
			<p>
				Informational only, not legal advice. Requirements can change.
			</p>
			<p>Trip Entry Guide MVP · v0.1.0</p>
		</div>
	</footer>
</main>
