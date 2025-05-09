// Test script to verify R2 connection and list some objects
import { listObjects } from './server/services/cloudflare.ts';

async function testR2Connection() {
  try {
    console.log('Testing R2 Connection...');
    
    // List up to 10 objects in the whispershard-assets bucket
    const objects = await listObjects();
    
    console.log(`Found ${objects.length} objects in total`);
    console.log('First 10 objects:');
    
    // Display the first 10 objects
    objects.slice(0, 10).forEach((obj, index) => {
      console.log(`${index + 1}. ${obj.Key} (Size: ${obj.Size} bytes, Last Modified: ${obj.LastModified})`);
    });
    
    // Check for specific directories
    console.log('\nChecking directories:');
    const dungeonMaster = await listObjects('whispershard-assets', 'dungeon-masters-guide/');
    console.log(`dungeon-masters-guide/ directory: ${dungeonMaster.length} objects`);
    
    const monsterManual = await listObjects('whispershard-assets', 'monster-manual/');
    console.log(`monster-manual/ directory: ${monsterManual.length} objects`);
    
    const phandelver = await listObjects('whispershard-assets', 'phandelver/');
    console.log(`phandelver/ directory: ${phandelver.length} objects`);
    
    // Try alternative name based on your screenshot
    const phandelverBeginners = await listObjects('whispershard-assets', 'phandelver-bel/');
    console.log(`phandelver-bel/ directory: ${phandelverBeginners.length} objects`);
    
  } catch (error) {
    console.error('Error testing R2 connection:', error);
  }
}

testR2Connection();