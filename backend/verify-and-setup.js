/**
 * Backend helper: verify tables/buckets using service role.
 * Usage: node backend/verify-and-setup.js
 * Loads secrets from backend/.env only (never Expo public env).
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    env[trimmed.slice(0, i)] = trimmed.slice(i + 1);
  }
  return env;
}

async function main() {
  const env = loadEnv(path.join(__dirname, '.env'));
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    process.exit(1);
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('Project:', url);

  for (const name of ['listings_images']) {
    const { data: existing } = await sb.storage.listBuckets();
    const found = (existing || []).some((b) => b.name === name);
    if (found) {
      console.log(`bucket ${name}: exists`);
      continue;
    }
    const { error } = await sb.storage.createBucket(name, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'],
    });
    console.log(`bucket ${name}:`, error ? `ERROR ${error.message}` : 'created');
  }

  for (const t of ['profiles', 'listings', 'claims']) {
    const { error } = await sb.from(t).select('*').limit(1);
    if (error) {
      console.log(`table ${t}: MISSING (${error.code || ''} ${error.message})`);
    } else {
      console.log(`table ${t}: OK`);
    }
  }

  console.log('\nIf tables are missing, run setup-supabase.sql in the Supabase SQL Editor.');
  console.log('Dashboard: https://supabase.com/dashboard/project/uetrldftyotnmkbqeyxo/sql/new');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
