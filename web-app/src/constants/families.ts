export type FamilyMember = { name: string; note?: string };

export type Family = {
  id: string;
  name: string;
  members: FamilyMember[];
};

/**
 * The whole travel party: 17 family members across 4 groups.
 * This list is the single source of truth for names — it is intentionally
 * NOT overridden by saved trip data, so roster fixes always show up.
 */
export const FAMILIES: Family[] = [
  {
    id: 'paul-karen',
    name: 'Grammy and Papa',
    members: [
      { name: 'Papa' },
      { name: 'Grammy', note: 'Birthday Girl' },
    ],
  },
  {
    id: 'lance-allison',
    name: "Lance and Allison's Family",
    members: [
      { name: 'Lance' },
      { name: 'Allison' },
      { name: 'Cohen' },
      { name: 'Keane' },
      { name: 'Rambo' },
      { name: 'Caroline' },
    ],
  },
  {
    id: 'leah-brent',
    name: "Leah and Brent's Family",
    members: [
      { name: 'Leah' },
      { name: 'Brent' },
      { name: 'Knox' },
      { name: 'Lucy' },
      { name: 'June' },
    ],
  },
  {
    id: 'noah-cori',
    name: "Noah and Cori's Family",
    members: [
      { name: 'Noah' },
      { name: 'Corinne (Cori)' },
      { name: 'Rhema' },
      { name: 'Gideon' },
    ],
  },
];

/** Total number of travelers across all families. */
export const TOTAL_TRAVELERS = FAMILIES.reduce((n, f) => n + f.members.length, 0);

/** A "party" is who a reservation/activity/stay applies to. */
export type Party = { id: string; name: string };

export const ALL_PARTY: Party = { id: 'all', name: `Everyone — all ${TOTAL_TRAVELERS} of us` };

/** The grown-ups only (no kids). */
export const ADULTS_PARTY: Party = { id: 'adults', name: 'Adults only' };

/**
 * Reservation parties: "All" (everyone), the grandparents, or one of the
 * three kids' families. Used by Hotel / House and Schedule.
 */
export const PARTIES: Party[] = [ALL_PARTY, ...FAMILIES.map((f) => ({ id: f.id, name: f.name }))];

/** Parties for activities: same as PARTIES plus "Adults only". */
export const ACTIVITY_PARTIES: Party[] = [ALL_PARTY, ADULTS_PARTY, ...FAMILIES.map((f) => ({ id: f.id, name: f.name }))];

/** Friendly display name for a party id (e.g. on the Schedule). */
export function partyName(id: string): string {
  if (id === 'all') return 'Everyone';
  if (id === 'adults') return 'Adults only';
  return FAMILIES.find((f) => f.id === id)?.name ?? id;
}
