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
    
    // Check for specific directories based on the screenshot
    console.log('\nChecking directories:');
    const dungeonMaster = await listObjects('whispershard-assets', 'dungeon-masters-guide/');
    console.log(`dungeon-masters-guide/ directory: ${dungeonMaster.length} objects`);
    
    const monsterManual = await listObjects('whispershard-assets', 'monster-manual/');
    console.log(`monster-manual/ directory: ${monsterManual.length} objects`);
    
    const phandelverBelow = await listObjects('whispershard-assets', 'phandelver-below/');
    console.log(`phandelver-below/ directory: ${phandelverBelow.length} objects`);
    
    const phb = await listObjects('whispershard-assets', 'phb/');
    console.log(`phb/ directory: ${phb.length} objects`);
    
    // Test with some example searches
    console.log('\nTesting image search functionality:');
    
    const searchTerms = ['sword', 'dragon', 'map', 'spell'];
    
    for (const term of searchTerms) {
      console.log(`\nSearching for "${term}":`);
      let count = 0;
      
      // Check each directory
      for (const dir of ['dungeon-masters-guide/', 'monster-manual/', 'phandelver-below/', 'phb/']) {
        const results = await listObjects('whispershard-assets', dir);
        const matches = results.filter(obj => 
          obj.Key && obj.Key.toLowerCase().includes(term.toLowerCase())
        );
        
        if (matches.length > 0) {
          console.log(`- Found ${matches.length} matches in ${dir}`);
          // Show up to 2 examples
          matches.slice(0, 2).forEach(match => {
            console.log(`  * ${match.Key}`);
          });
          count += matches.length;
        }
      }
      
      console.log(`Total matches for "${term}": ${count}`);
    }
    
  } catch (error) {
    console.error('Error testing R2 connection:', error);
  }
}

testR2Connection();