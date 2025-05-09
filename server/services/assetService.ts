/**
 * Asset Service
 * Provides methods to interact with assets in MongoDB according to the v2.3 schema
 */

import { getMongoDatabase } from './mongodb';
import { 
  AssetCategory, 
  Asset,
  ImageAsset,
  COLLECTIONS,
  getCollectionForAssetCategory
} from './assetSchema';

/**
 * Find an asset by its ID
 * @param id The unique identifier of the asset
 * @returns The asset object or null if not found
 */
export async function findAssetById(id: string): Promise<Asset | null> {
  try {
    const db = getMongoDatabase();
    
    // Try to find the asset in the main assets collection first
    let asset = await db.collection(COLLECTIONS.ASSETS).findOne({ id });
    
    // If not found, search through all collections
    if (!asset) {
      for (const key in COLLECTIONS) {
        if (key === 'ASSETS' || key === 'IMAGES') continue; // Skip main collections
        
        const collection = COLLECTIONS[key as keyof typeof COLLECTIONS];
        asset = await db.collection(collection).findOne({ id });
        
        if (asset) break;
      }
    }
    
    return asset as Asset | null;
  } catch (error) {
    console.error('Error finding asset by ID:', error);
    return null;
  }
}

/**
 * Find images for an asset by its asset ID
 * @param assetId The asset ID to find images for
 * @returns Array of image objects
 */
export async function findImagesForAsset(assetId: string): Promise<ImageAsset[]> {
  try {
    const db = getMongoDatabase();
    
    // Check if v6_images collection exists
    const collections = await db.listCollections({ name: COLLECTIONS.IMAGES }).toArray();
    if (collections.length === 0) {
      console.warn(`Collection ${COLLECTIONS.IMAGES} does not exist`);
      return [];
    }
    
    // Find images for this asset
    const images = await db
      .collection(COLLECTIONS.IMAGES)
      .find({ assetId })
      .toArray();
    
    return images as ImageAsset[];
  } catch (error) {
    console.error('Error finding images for asset:', error);
    return [];
  }
}

/**
 * Find assets based on a search query
 * @param query The search query string
 * @param category Optional asset category to filter by
 * @param limit Maximum number of results to return
 * @returns Array of matching assets
 */
export async function searchAssets(
  query: string, 
  category?: AssetCategory,
  limit = 10
): Promise<Asset[]> {
  try {
    const db = getMongoDatabase();
    const collections = category 
      ? [getCollectionForAssetCategory(category)]
      : Object.values(COLLECTIONS).filter(c => c !== COLLECTIONS.IMAGES);
    
    const results: Asset[] = [];
    
    // Create a regex pattern for the query
    const pattern = new RegExp(query, 'i');
    
    // Search in each collection
    for (const collection of collections) {
      if (results.length >= limit) break;
      
      // Check if collection exists
      const collExists = await db.listCollections({ name: collection }).toArray();
      if (collExists.length === 0) continue;
      
      // Search name, description, and other fields
      const assets = await db.collection(collection)
        .find({
          $or: [
            { name: pattern },
            { description: pattern },
            { text: pattern },           // For rule fragments
            { content: pattern },        // For some assets
            { 'metadata.name': pattern } // For nested metadata
          ]
        })
        .limit(limit - results.length)
        .toArray();
      
      results.push(...assets as Asset[]);
    }
    
    return results;
  } catch (error) {
    console.error('Error searching assets:', error);
    return [];
  }
}

/**
 * Find rule fragments based on a search query
 * @param query The search query string
 * @param limit Maximum number of results to return
 * @returns Array of matching rule fragments
 */
export async function searchRuleFragments(query: string, limit = 5): Promise<Asset[]> {
  try {
    const db = getMongoDatabase();
    
    // Check if collection exists
    const collExists = await db.listCollections({ name: COLLECTIONS.RULE_FRAGMENTS }).toArray();
    if (collExists.length === 0) {
      console.warn(`Collection ${COLLECTIONS.RULE_FRAGMENTS} does not exist`);
      return [];
    }
    
    // Create a regex pattern for the query
    const pattern = new RegExp(query, 'i');
    
    // Search in rule fragments collection
    const fragments = await db.collection(COLLECTIONS.RULE_FRAGMENTS)
      .find({
        $or: [
          { text: pattern },
          { section: pattern },
          { subsection: pattern }
        ]
      })
      .limit(limit)
      .toArray();
    
    return fragments as Asset[];
  } catch (error) {
    console.error('Error searching rule fragments:', error);
    return [];
  }
}

/**
 * Find script suggestions based on a search term
 * @param term The search term ('combat' or 'roleplay')
 * @param limit Maximum number of results to return
 * @returns Array of matching script suggestions
 */
export async function findScriptSuggestions(term: string, limit = 3): Promise<any[]> {
  try {
    const db = getMongoDatabase();
    let collection;
    
    // Determine which collection to search in based on the term
    if (term.toLowerCase().includes('combat')) {
      collection = COLLECTIONS.MONSTERS;
    } else {
      collection = COLLECTIONS.NPCS;
    }
    
    // Check if collection exists
    const collExists = await db.listCollections({ name: collection }).toArray();
    if (collExists.length === 0) {
      console.warn(`Collection ${collection} does not exist`);
      return [];
    }
    
    // Search in the appropriate collection
    const results = await db.collection(collection)
      .find({})
      .limit(limit)
      .toArray();
    
    // Format the results for script suggestions
    if (term.toLowerCase().includes('combat')) {
      return results.map(monster => ({
        id: monster.id,
        title: monster.name,
        content: `${monster.name} appears! ${monster.description || 'It looks dangerous and ready to attack.'}`,
        type: 'combat'
      }));
    } else {
      return results.map(npc => ({
        id: npc.id,
        title: npc.name,
        content: `${npc.name} approaches. ${npc.description || 'They seem interested in talking to you.'}`,
        type: 'roleplay'
      }));
    }
  } catch (error) {
    console.error('Error finding script suggestions:', error);
    return [];
  }
}