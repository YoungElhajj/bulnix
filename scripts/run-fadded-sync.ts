import { triggerProviderSync } from '../server/db';

async function main() {
  console.log('Starting Fadded sync...');
  try {
    const result = await triggerProviderSync('fadded');
    console.log('Sync result:', JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error('Sync error:', e.message);
  }
  process.exit(0);
}

main();
