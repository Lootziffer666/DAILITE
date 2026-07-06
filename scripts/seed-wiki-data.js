import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Static reference data - extracted from DBD Wiki
const killers = [
  { name: 'The Trapper', real_name: 'Evan MacMillan', dlc: 'Original' },
  { name: 'The Wraith', real_name: 'Philip Ojomo', dlc: 'Original' },
  { name: 'The Hillbilly', real_name: 'Maksymilian Dambor', dlc: 'Original' },
  { name: 'The Nurse', real_name: 'Sally Smithson', dlc: 'Original' },
  { name: 'The Shape', real_name: 'Michael Myers', dlc: 'Original' },
  { name: 'The Doctor', real_name: 'Herman Carter', dlc: 'Original' },
  { name: 'The Huntress', real_name: 'Anna', dlc: 'Original' },
  { name: 'The Cannibal', real_name: 'Bubba Sawyer', dlc: 'DLC' },
  { name: 'The Nightmare', real_name: 'Freddy Krueger', dlc: 'DLC' },
  { name: 'The Pig', real_name: 'Amanda Young', dlc: 'DLC' },
  { name: 'The Clown', real_name: 'Jeffrey Hawk', dlc: 'DLC' },
  { name: 'The Spirit', real_name: 'Rin Yamaoka', dlc: 'DLC' },
  { name: 'The Legion', real_name: 'Frank Morrison', dlc: 'DLC' },
  { name: 'The Plague', real_name: 'Adiris', dlc: 'DLC' },
  { name: 'The Oni', real_name: 'Kazan Yamaoka', dlc: 'DLC' },
  { name: 'The Blight', real_name: 'Talbot Greyson', dlc: 'DLC' },
  { name: 'The Twins', real_name: 'Charlotte and Victor', dlc: 'DLC' },
  { name: 'The Trickster', real_name: 'Ji-Woon Hak', dlc: 'DLC' },
  { name: 'The Nemesis', real_name: 'Albert Wesker', dlc: 'DLC' },
  { name: 'The Cenobite', real_name: 'Elliott Spencer', dlc: 'DLC' },
  { name: 'The Artist', real_name: 'Carmina Mora', dlc: 'DLC' },
  { name: 'The Dredge', real_name: 'Unknown', dlc: 'DLC' },
];

const maps = [
  { name: 'Autohaven Wreckers', realm: 'Autohaven Wreckers' },
  { name: 'The MacMillan Estate', realm: 'The MacMillan Estate' },
  { name: 'Haddonfield', realm: 'Haddonfield' },
  { name: 'Red Forest', realm: 'Red Forest' },
  { name: 'Backwater Swamp', realm: 'Backwater Swamp' },
  { name: 'Coldwind Farm', realm: 'Coldwind Farm' },
  { name: 'Crotus Prenn Asylum', realm: 'Crotus Prenn Asylum' },
  { name: 'Lakeside', realm: 'Lakeside' },
  { name: 'Lerys Memorial Institute', realm: 'Lerys Memorial Institute' },
  { name: 'Hawkins National Laboratory', realm: 'Hawkins National Laboratory' },
  { name: 'Gideon Meat Plant', realm: 'Gideon Meat Plant' },
  { name: 'Midwich Elementary School', realm: 'Midwich Elementary School' },
];

const perks = [
  // Survivor Perks
  { name: 'Self Care', type: 'Survivor', perk_class: 'Utility' },
  { name: 'Sprint Burst', type: 'Survivor', perk_class: 'Chase' },
  { name: 'Dead Hard', type: 'Survivor', perk_class: 'Chase' },
  { name: 'Unbreakable', type: 'Survivor', perk_class: 'Protection' },
  { name: 'Borrowed Time', type: 'Survivor', perk_class: 'Save' },
  { name: 'Spine Chill', type: 'Survivor', perk_class: 'Warning' },
  { name: 'Urban Evasion', type: 'Survivor', perk_class: 'Chase' },
  { name: 'Windows of Opportunity', type: 'Survivor', perk_class: 'Chase' },
  { name: 'Resilience', type: 'Survivor', perk_class: 'Chase' },
  { name: 'Iron Will', type: 'Survivor', perk_class: 'Stealth' },
  { name: 'Balanced Landing', type: 'Survivor', perk_class: 'Chase' },
  { name: 'Head On', type: 'Survivor', perk_class: 'Chase' },
  { name: 'Lithe', type: 'Survivor', perk_class: 'Chase' },
  { name: 'Lucky Break', type: 'Survivor', perk_class: 'Chase' },
  { name: 'Flip Flop', type: 'Survivor', perk_class: 'Protection' },
  { name: 'Mettle of Man', type: 'Survivor', perk_class: 'Protection' },
  { name: 'Inner Strength', type: 'Survivor', perk_class: 'Utility' },
  { name: 'Breakdown', type: 'Survivor', perk_class: 'Chase' },
  { name: 'Cherish', type: 'Survivor', perk_class: 'Utility' },
  { name: 'Exponential', type: 'Survivor', perk_class: 'Save' },
  // Killer Perks
  { name: 'Hex: Ruin', type: 'Killer', perk_class: 'Pressure' },
  { name: 'Pop Goes the Weasel', type: 'Killer', perk_class: 'Pressure' },
  { name: 'Corrupt Intervention', type: 'Killer', perk_class: 'Defense' },
  { name: 'Tinkerer', type: 'Killer', perk_class: 'Information' },
  { name: 'Barbecue and Chilli', type: 'Killer', perk_class: 'Information' },
  { name: 'Whispers', type: 'Killer', perk_class: 'Information' },
  { name: 'Monitor and Abuse', type: 'Killer', perk_class: 'Chase' },
  { name: 'Enduring', type: 'Killer', perk_class: 'Chase' },
  { name: 'Brutal Strength', type: 'Killer', perk_class: 'Chase' },
  { name: 'Spies from the Shadows', type: 'Killer', perk_class: 'Information' },
  { name: 'Thanatophobia', type: 'Killer', perk_class: 'Pressure' },
  { name: 'Dying Light', type: 'Killer', perk_class: 'Pressure' },
  { name: 'Hex: Devour Hope', type: 'Killer', perk_class: 'Curse' },
  { name: 'Infectious Fright', type: 'Killer', perk_class: 'Information' },
  { name: 'Agitation', type: 'Killer', perk_class: 'Chase' },
];

async function seedData() {
  try {
    console.log('Seeding wiki data...');

    // Clear existing data
    await pool.query('DELETE FROM perks');
    await pool.query('DELETE FROM maps');
    await pool.query('DELETE FROM killers');

    // Insert killers
    console.log(`Inserting ${killers.length} killers...`);
    for (const killer of killers) {
      await pool.query(
        'INSERT INTO killers (name, real_name, dlc) VALUES ($1, $2, $3)',
        [killer.name, killer.real_name, killer.dlc]
      );
    }

    // Insert maps
    console.log(`Inserting ${maps.length} maps...`);
    for (const map of maps) {
      await pool.query(
        'INSERT INTO maps (name, realm) VALUES ($1, $2)',
        [map.name, map.realm]
      );
    }

    // Insert perks
    console.log(`Inserting ${perks.length} perks...`);
    for (const perk of perks) {
      await pool.query(
        'INSERT INTO perks (name, type, perk_class) VALUES ($1, $2, $3)',
        [perk.name, perk.type, perk.perk_class]
      );
    }

    console.log('✓ Wiki data seeded successfully');
    await pool.end();
  } catch (err) {
    console.error('✗ Error seeding data:', err);
    process.exit(1);
  }
}

seedData();
