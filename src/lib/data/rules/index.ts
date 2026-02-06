import type { EntryRule, VisaMatrixRule } from '$lib/types';

const ruleModules = import.meta.glob('./*/rules.ts', { eager: true });

export const entryRules: EntryRule[] = Object.values(ruleModules).flatMap(
	(module) => (module as { rules: EntryRule[] }).rules
);

type VisaMatrixModule = {
	visaMatrix?: Record<string, VisaMatrixRule>;
};

const visaMatricesByDestination: Record<string, Record<string, VisaMatrixRule>> = {};

for (const [modulePath, module] of Object.entries(ruleModules)) {
	const match = modulePath.match(/\.\/([^/]+)\/rules\.ts$/);
	if (!match) continue;
	const destination = match[1]?.toUpperCase();
	if (!destination) continue;

	const visaMatrix = (module as VisaMatrixModule).visaMatrix ?? {};
	visaMatricesByDestination[destination] = visaMatrix;
}

export const getVisaMatrixRule = (
	citizenship?: string,
	destination?: string
): VisaMatrixRule | undefined => {
	if (!citizenship || !destination) return undefined;
	return visaMatricesByDestination[destination.toUpperCase()]?.[citizenship.toUpperCase()];
};
