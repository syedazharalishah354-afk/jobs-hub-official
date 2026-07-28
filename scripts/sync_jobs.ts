import fs from 'fs';
import { AUDITED_JOBS } from '../src/constants/auditedJobs.js';

console.log(`[sync_jobs] Synchronizing ${AUDITED_JOBS.length} jobs to static JSON files and database...`);

// Ensure public directory exists
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

// Write to public/jobs.json
fs.writeFileSync('./public/jobs.json', JSON.stringify(AUDITED_JOBS, null, 2), 'utf-8');

// Write to data/db.json if data directory exists or create it
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

let dbContent = { jobs: AUDITED_JOBS, settings: {} };
if (fs.existsSync('./data/db.json')) {
  try {
    const existing = JSON.parse(fs.readFileSync('./data/db.json', 'utf-8'));
    dbContent = { ...existing, jobs: AUDITED_JOBS };
  } catch (err) {
    console.warn('[sync_jobs] Could not parse existing db.json, replacing with fresh jobs data.');
  }
}
fs.writeFileSync('./data/db.json', JSON.stringify(dbContent, null, 2), 'utf-8');

// Write to dist/jobs.json if dist exists
if (fs.existsSync('./dist')) {
  fs.writeFileSync('./dist/jobs.json', JSON.stringify(AUDITED_JOBS, null, 2), 'utf-8');
}

console.log('[sync_jobs] Synchronization complete!');
