export type Purpose = 'tourism' | 'business' | 'transit';

export type VisaType = 'visa_free' | 'visa_on_arrival' | 'evisa' | 'visa_required' | 'eta';

export type VisaMatrixCategory =
	| 'visa_free'
	| 'visa_on_arrival'
	| 'eta'
	| 'e_visa'
	| 'visa_required'
	| 'no_admission'
	| 'unknown';

export type VisaMatrixRule = {
	category: VisaMatrixCategory;
	maxStayDays?: number;
	raw?: string;
};

export type RequirementCategory = 'passport' | 'visa' | 'health' | 'money' | 'arrival' | 'other';

export type Country = {
	code: string;
	name: string;
	region: string;
};

export type EntryRequirement = {
	id: string;
	title: string;
	details: string;
	category: RequirementCategory;
	sourceUrls?: string[];
};

export type EntryRule = {
	citizenship: string;
	destination: string;
	purpose: Purpose;
	visaType: VisaType;
	maxStayDays?: number;
	requirements: EntryRequirement[];
	lastUpdated: string;
	sources: string[];
};
