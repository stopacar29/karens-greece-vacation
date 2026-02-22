export type FamilyMember = { name: string; note?: string };

export type Family = {
  id: string;
  name: string;
  members: FamilyMember[];
};

export const FAMILIES: Family[] = [
  { id: 'paul-karen', name: 'Paul and Karen', members: [{ name: 'Paul', note: 'Grandpa' }, { name: 'Karen', note: 'Grandma · Birthday girl' }] },
  { id: 'lance-allison', name: 'Lance and Allison', members: [{ name: 'Lance' }, { name: 'Allison' }, { name: 'Cohen', note: 'oldest' }, { name: 'Keane', note: 'boy' }, { name: 'Wyatt', note: 'boy' }, { name: 'Caroline', note: 'daughter' }] },
  { id: 'leah-brent', name: 'Leah and Brent', members: [{ name: 'Leah' }, { name: 'Brent' }, { name: 'Knox', note: 'oldest' }, { name: 'Lucy', note: 'middle' }, { name: 'June', note: 'youngest daughter' }] },
  { id: 'noah-cori', name: 'Noah and Cori', members: [{ name: 'Noah' }, { name: 'Corinne (Cori)' }, { name: 'Rhema', note: 'daughter, oldest' }, { name: 'Gideon', note: 'son, youngest' }] },
];
