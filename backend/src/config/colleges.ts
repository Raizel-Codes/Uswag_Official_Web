// The colleges/departments a USWAG member can belong to, as the application form offers them
// (frontend config/colleges.ts keeps the same list). Article VI §1(g): one Public Relations Officer
// per college/department, so this list is also the list of PRO seats.
export const COLLEGES = ['CEA', 'CCIS', 'CCJS', 'COM', 'CAT', 'CON', 'COED'] as const;

export const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'] as const;
