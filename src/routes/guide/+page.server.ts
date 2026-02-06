import type { PageServerLoad } from './$types';
import { entryRules, getVisaMatrixRule } from '$lib/data/rules/index';
import { countries } from '$lib/data/countries';

const getRule = (citizenship?: string, destination?: string, purpose?: string) => {
	if (!citizenship || !destination) return undefined;
	return entryRules.find(
		(rule) =>
			rule.citizenship === citizenship.toUpperCase() &&
			rule.destination === destination.toUpperCase() &&
			rule.purpose === (purpose ?? 'tourism')
	);
};

export const load: PageServerLoad = async ({ url }) => {
	const params = url.searchParams;

	const citizenship = params.get('citizenship')?.toUpperCase() ?? undefined;
	const destination = params.get('destination')?.toUpperCase() ?? undefined;
	const purpose = params.get('purpose') ?? 'tourism';
	const stayDays = params.get('stay') ? Number(params.get('stay')) : undefined;
	const transit = params.get('transit')?.toUpperCase() ?? undefined;
	const transitHours = params.get('transitHours') ? Number(params.get('transitHours')) : undefined;

	const rule = getRule(citizenship, destination, purpose);
	const transitRule = transit ? getRule(citizenship, transit, 'transit') : undefined;
	const visaMatrixRule = getVisaMatrixRule(citizenship, destination);
	const transitVisaMatrixRule = transit ? getVisaMatrixRule(citizenship, transit) : undefined;

	return {
		countries,
		citizenship,
		destination,
		purpose,
		stayDays,
		rule,
		visaMatrixRule,
		transit,
		transitHours,
		transitRule,
		transitVisaMatrixRule,
		missingData: !rule && Boolean(citizenship && destination)
	};
};
