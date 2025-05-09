/**
 * Unified Asset Service
 * Service to interact with assets using the v2.4 unified schema
 */

import { getMongoDatabase } from './mongodb';
import { 
  UnifiedAsset, 
  FlexibleAsset,
  AssetCategory,
  ImageAsset,
  COLLECTIONS_UNIFIED,
  getCollectionForUnifiedAsset,
  convertToUnifiedAsset
} from './unifiedSchema';
import { Document, WithId } from 'mongodb';

/**
 * Find a unified asset by its ID
 * @param id The unique identifier of the asset
 * @returns The asset or null if not found
 */
export async function findAssetById(id: string): Promise<UnifiedAsset | null> {
  try {
    const db = getMongoDatabase();
    
    // Try all collections sequentially to find the asset
    const collections = Object.values(COLLECTIONS_UNIFIED).filter(c => c !== COLLECTIONS_UNIFIED.IMAGES);
    
    for (const collection of collections) {
      // Check if collection exists
      const collExists = await db.listCollections({ name: collection }).toArray();
      if (collExists.length === 0) continue;
      
      const asset = await db.collection(collection).findOne({ id });
      if (asset) {
        // Convert to unified format
        return convertToUnifiedAsset(asset);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding asset by ID:', error);
    return null;
  }
}

/**
 * Find images for an asset by its ID
 * @param assetId The asset ID to find images for
 * @returns Array of image objects
 */
export async function findAssetImages(assetId: string): Promise<ImageAsset[]> {
  try {
    const db = getMongoDatabase();
    
    // Try to find directly linked images
    const images: ImageAsset[] = [];
    
    // Check if images collection exists
    const imagesCollExists = await db.listCollections({ name: COLLECTIONS_UNIFIED.IMAGES }).toArray();
    if (imagesCollExists.length > 0) {
      const dbImages = await db
        .collection(COLLECTIONS_UNIFIED.IMAGES)
        .find({ assetId })
        .toArray();
      
      // Add these images to our results
      images.push(...(dbImages as any[] as ImageAsset[]));
    }
    
    // If we found direct image references, return them
    if (images.length > 0) {
      return images;
    }
    
    // Otherwise, try to find the asset and check if it has embedded images
    const asset = await findAssetById(assetId);
    if (asset && asset.images && asset.images.length > 0) {
      return asset.images;
    }
    
    // Check if the asset has media with images
    if (asset && typeof asset.media === 'object' && asset.media && 'images' in asset.media) {
      const mediaImages = (asset.media as any).images;
      if (Array.isArray(mediaImages)) {
        return mediaImages;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error finding images for asset:', error);
    return [];
  }
}

/**
 * Search unified assets based on a query string
 * @param query The search query string
 * @param category Optional asset category to filter by
 * @param limit Maximum number of results to return
 * @returns Array of matching assets
 */
export async function searchUnifiedAssets(
  query: string,
  category?: AssetCategory,
  limit = 10
): Promise<UnifiedAsset[]> {
  try {
    const db = getMongoDatabase();
    
    let collections: string[];
    if (category) {
      // Search only in the collection for this category
      switch (category) {
        case AssetCategory.SPELL:
          collections = [COLLECTIONS_UNIFIED.SPELLS];
          break;
        case AssetCategory.MONSTER:
          collections = [COLLECTIONS_UNIFIED.MONSTERS];
          break;
        case AssetCategory.RULE_FRAGMENT:
          collections = [COLLECTIONS_UNIFIED.RULE_FRAGMENTS];
          break;
        case AssetCategory.ITEM:
          collections = [COLLECTIONS_UNIFIED.ITEMS];
          break;
        case AssetCategory.NPC:
          collections = [COLLECTIONS_UNIFIED.NPCS];
          break;
        case AssetCategory.CHARACTER:
          collections = [COLLECTIONS_UNIFIED.CHARACTERS];
          break;
        case AssetCategory.LOCATION:
          collections = [COLLECTIONS_UNIFIED.LOCATIONS];
          break;
        case AssetCategory.ROOM:
          collections = [COLLECTIONS_UNIFIED.ROOMS];
          break;
        default:
          collections = [COLLECTIONS_UNIFIED.ASSETS];
      }
    } else {
      // Search all asset collections
      collections = Object.values(COLLECTIONS_UNIFIED).filter(c => c !== COLLECTIONS_UNIFIED.IMAGES);
    }
    
    const results: UnifiedAsset[] = [];
    const pattern = new RegExp(query, 'i');
    
    // Search in each collection
    for (const collection of collections) {
      if (results.length >= limit) break;
      
      // Check if collection exists
      const collExists = await db.listCollections({ name: collection }).toArray();
      if (collExists.length === 0) continue;
      
      // Search in various fields
      const assets = await db.collection(collection)
        .find({
          $or: [
            { id: pattern },
            { name: pattern },
            { description: pattern },
            { text: pattern },
            { summary: pattern },
            { tags: pattern },
            { symbolic_tags: pattern },
            { dm_only_notes: pattern }
          ]
        })
        .limit(limit - results.length)
        .toArray();
      
      // Convert to UnifiedAsset format and add to results
      const convertedAssets = assets.map(asset => convertToUnifiedAsset(asset));
      results.push(...convertedAssets);
    }
    
    return results;
  } catch (error) {
    console.error('Error searching unified assets:', error);
    return [];
  }
}

/**
 * Find rule fragments for rules lookup
 * @param query The search query string
 * @param limit Maximum number of results to return
 * @returns Array of matching rule fragments
 */
export async function findRuleFragments(query: string, limit = 5): Promise<UnifiedAsset[]> {
  try {
    // Search specifically in rule fragments collection with relevant fields
    return searchUnifiedAssets(query, AssetCategory.RULE_FRAGMENT, limit);
  } catch (error) {
    console.error('Error finding rule fragments:', error);
    return [];
  }
}

/**
 * Find script suggestions for the chat system
 * @param term The search term (e.g., 'combat', 'roleplay')
 * @param limit Maximum number of suggestions to return
 * @returns Array of script suggestions formatted for the chat interface
 */
export async function findScriptSuggestions(term: string, limit = 3): Promise<any[]> {
  try {
    let category: AssetCategory;
    let type: string;
    
    // Determine the category and type based on the term
    if (term.toLowerCase().includes('combat')) {
      category = AssetCategory.MONSTER;
      type = 'combat';
    } else {
      category = AssetCategory.NPC;
      type = 'roleplay';
    }
    
    // Search for matching assets
    const assets = await searchUnifiedAssets(term, category, limit);
    
    // Format the results as script suggestions
    return assets.map(asset => ({
      id: asset.id,
      title: typeof asset.name === 'string' ? asset.name : Object.values(asset.name)[0],
      content: `${typeof asset.name === 'string' ? asset.name : Object.values(asset.name)[0]} ${type === 'combat' ? 'appears!' : 'approaches.'} ${typeof asset.description === 'string' ? asset.description : asset.summary || `This ${type === 'combat' ? 'creature' : 'character'} is ready to interact.`}`,
      type
    }));
  } catch (error) {
    console.error('Error finding script suggestions:', error);
    return [];
  }
}

/**
 * Create or update a unified asset
 * @param asset The asset to create or update
 * @returns The created/updated asset
 */
export async function saveUnifiedAsset(asset: FlexibleAsset): Promise<UnifiedAsset> {
  try {
    const db = getMongoDatabase();
    
    // Ensure the asset has a schema version
    if (!asset.schemaVersion) {
      asset.schemaVersion = "2.4";
    }
    
    // Convert to unified format
    const unifiedAsset = convertToUnifiedAsset(asset);
    
    // Determine which collection it should go in
    const collection = getCollectionForUnifiedAsset(unifiedAsset);
    
    // Check if collection exists, create if not
    const collExists = await db.listCollections({ name: collection }).toArray();
    if (collExists.length === 0) {
      await db.createCollection(collection);
    }
    
    // Check if the asset already exists
    const existingAsset = await db.collection(collection).findOne({ id: unifiedAsset.id });
    
    if (existingAsset) {
      // Update existing asset
      await db.collection(collection).updateOne(
        { id: unifiedAsset.id },
        { $set: unifiedAsset }
      );
    } else {
      // Create new asset
      await db.collection(collection).insertOne(unifiedAsset);
    }
    
    return unifiedAsset;
  } catch (error) {
    console.error('Error saving unified asset:', error);
    throw error;
  }
}