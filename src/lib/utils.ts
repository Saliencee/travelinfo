import { countries } from '$lib/data/countries';
import { entryRules } from '$lib/data/rules/index';
import type { EntryRule, VisaMatrixCategory, VisaType } from '$lib/types';

export const toRouteKey = (citizenship?: string, destination?: string) => {
	if (!citizenship || !destination) return '';
	return `${citizenship.toUpperCase()}->${destination.toUpperCase()}`;
};

export const findCountry = (value?: string) => {
	if (!value) return undefined;
	const normalized = value.trim().toLowerCase();
	return countries.find(
		(country) =>
			country.code.toLowerCase() === normalized ||
			country.name.toLowerCase() === normalized ||
			`${country.name.toLowerCase()} (${country.code.toLowerCase()})` === normalized
	);
};

const FLAG_OVERRIDES: Record<string, string> = {
	XK: '🇽🇰'
};

export const flagEmoji = (code?: string) => {
	if (!code) return '';
	const upper = code.trim().toUpperCase();
	if (FLAG_OVERRIDES[upper]) return FLAG_OVERRIDES[upper];
	if (!/^[A-Z]{2}$/.test(upper)) return '🏳️';

	const first = upper.codePointAt(0);
	const second = upper.codePointAt(1);
	if (!first || !second) return '🏳️';

	return String.fromCodePoint(first + 0x1f1a5, second + 0x1f1a5);
};

export const findRule = (
	citizenship?: string,
	destination?: string,
	purpose?: string
): EntryRule | undefined => {
	if (!citizenship || !destination) return undefined;
	const normalizedPurpose = (purpose ?? 'tourism') as EntryRule['purpose'];
	return entryRules.find(
		(rule) =>
			rule.citizenship === citizenship.toUpperCase() &&
			rule.destination === destination.toUpperCase() &&
			rule.purpose === normalizedPurpose
	);
};

export const visaTypeLabel = (visaType?: VisaType) => {
	switch (visaType) {
		case 'visa_free':
			return 'Visa-free';
		case 'visa_on_arrival':
			return 'Visa on arrival';
		case 'evisa':
			return 'eVisa';
		case 'eta':
			return 'ETA required';
		case 'visa_required':
			return 'Visa required';
		default:
			return 'Check requirements';
	}
};

export const visaCategoryLabel = (category?: VisaMatrixCategory) => {
	switch (category) {
		case 'visa_free':
			return 'Visa-free';
		case 'visa_on_arrival':
			return 'Visa on arrival';
		case 'e_visa':
			return 'eVisa';
		case 'eta':
			return 'ETA required';
		case 'visa_required':
			return 'Visa required';
		case 'no_admission':
			return 'No admission';
		case 'unknown':
			return 'Check requirements';
		default:
			return 'Check requirements';
	}
};
