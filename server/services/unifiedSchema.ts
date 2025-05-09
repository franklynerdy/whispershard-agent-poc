/**
 * Unified Asset Schema Service - Version 2.4
 * 
 * A comprehensive implementation that merges the best features from:
 * - v2.2.0: Enhanced flat schema with detailed field metadata
 * - v2.2: Flexible structure with variety of field types
 * - v2.3: Polymorphic approach with discriminated union
 * 
 * This schema supports:
 * - Polymorphic assets with category discrimination
 * - Flat structure for flexible asset discovery
 * - Detailed narrative metadata and semantic tagging
 * - Spatial and dimensional properties
 * - TTS controls and media integration
 * - Comprehensive D&D content modeling
 */

import { z } from 'zod';

// Collection names in MongoDB (version 7)
export const COLLECTIONS_UNIFIED = {
  ASSETS: 'v7_assets',
  MONSTERS: 'v7_monsters',
  SPELLS: 'v7_spells',
  CHARACTERS: 'v7_characters',
  LOCATIONS: 'v7_locations',
  ROOMS: 'v7_rooms', 
  NPCS: 'v7_npcs',
  ITEMS: 'v7_items',
  RULE_FRAGMENTS: 'v7_rule_fragments',
  IMAGES: 'v7_images',
};

// Asset Categories
export enum AssetCategory {
  RULE_FRAGMENT = 'RuleFragment',
  SPELL = 'Spell',
  MONSTER = 'Monster',
  ITEM = 'Item',
  NPC = 'NPC',
  CHARACTER = 'Character',
  LOCATION = 'Location',
  ROOM = 'Room',
  GENERIC = 'Generic'
}

// Basic image schema
export const ImageSchema = z.object({
  assetId: z.string().optional(),
  url: z.string().url(),
  caption: z.string().optional(),
  source: z.string().optional(),
});

export type ImageAsset = z.infer<typeof ImageSchema>;

// Localized string schema
export const LocalizedStringSchema = z.record(z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/), z.string());

// Media object with image, audio, and video refs
export const MediaSchema = z.object({
  images: z.array(ImageSchema).optional(),
  audio: z.array(z.string().url()).optional(),
  video: z.array(z.string().url()).optional(),
});

// Geometry object for spatial dimensions
export const GeometrySchema = z.object({
  shape: z.string().optional(),
  width: z.number().optional(),
  length: z.number().optional(),
  height: z.number().optional(),
  units: z.string().optional(),
});

// Access portal definition for connected locations and rooms
export const AccessPortalSchema = z.object({
  destination: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['open', 'closed', 'locked', 'blocked', 'trapped', 'secret']).optional(),
  condition: z.string().optional(),
});

// Sound effects object
export const SoundEffectsSchema = z.object({
  ambient: z.string().optional(),
  triggered: z.record(z.string(), z.string()).optional(),
});

// Event hooks for interactive behavior
export const EventHookSchema = z.object({
  trigger: z.string(),
  action: z.string(),
  params: z.record(z.any()).optional(),
});

// Reveal logic for conditional content
export const RevealLogicSchema = z.object({
  awareness_levels: z.array(z.string()).optional(),
  player_perception: z.number().optional(),
  condition: z.string().optional(),
});

// Monster ability scores
export const AbilitiesSchema = z.object({
  strength: z.number().optional(),
  dexterity: z.number().optional(),
  constitution: z.number().optional(),
  intelligence: z.number().optional(),
  wisdom: z.number().optional(),
  charisma: z.number().optional(),
});

// Character stats
export const StatsSchema = z.object({
  str: z.number().optional(),
  dex: z.number().optional(),
  con: z.number().optional(),
  int: z.number().optional(),
  wis: z.number().optional(),
  cha: z.number().optional(),
});

// Character saving throws
export const SavingThrowsSchema = z.record(z.string(), z.number());

// Character skills
export const SkillsSchema = z.record(z.string(), z.number());

// Character passive checks
export const PassiveChecksSchema = z.object({
  perception: z.number().optional(),
  insight: z.number().optional(),
  investigation: z.number().optional(),
});

// Character traits
export const TraitsSchema = z.object({
  personality: z.string().optional(),
  ideals: z.string().optional(),
  bonds: z.string().optional(),
  flaws: z.string().optional(),
});

// Spell components schema
export const SpellComponentsSchema = z.object({
  verbal: z.boolean().optional(),
  somatic: z.boolean().optional(),
  material: z.string().optional(),
});

// Character spells
export const SpellsSchema = z.object({
  cantrips: z.array(z.string()).optional(),
  level_1: z.object({ prepared: z.array(z.string()) }).optional(),
  level_2: z.object({ prepared: z.array(z.string()) }).optional(),
  level_3: z.object({ prepared: z.array(z.string()) }).optional(),
  level_4: z.object({ prepared: z.array(z.string()) }).optional(),
  level_5: z.object({ prepared: z.array(z.string()) }).optional(),
  level_6: z.object({ prepared: z.array(z.string()) }).optional(),
  level_7: z.object({ prepared: z.array(z.string()) }).optional(),
  level_8: z.object({ prepared: z.array(z.string()) }).optional(),
  level_9: z.object({ prepared: z.array(z.string()) }).optional(),
});

// TTS Voice Fields extensions
export const TTSVoiceFieldsSchema = z.object({
  npc_voice_id: z.string().optional(),
  narration_voice_id: z.string().optional(),
  narration_mode: z.enum(['default', 'muted', 'auto']).optional(),
  sfx_tags: z.array(z.string()).optional(),
});

// Base Asset Schema - Common properties shared by all asset types
export const BaseAssetSchema = z.object({
  // Core identification
  id: z.string().describe("Unique identifier for the asset"),
  schemaVersion: z.string().optional().describe("Version of the schema used for this asset"),
  assetCategory: z.nativeEnum(AssetCategory).optional().describe("Category discriminator for polymorphic assets"),
  
  // Basic information
  name: z.union([z.string(), LocalizedStringSchema]).describe("Display name of the asset"),
  description: z.union([z.string(), LocalizedStringSchema]).optional().describe("Narrative and functional description"),
  summary: z.string().optional().describe("Short player-facing summary of the asset"),
  
  // Source tracking
  sourceBook: z.string().optional().describe("Source material where this asset is defined"),
  page: z.number().optional().describe("Page number in the source material"),
  
  // Tagging system
  tags: z.array(z.string()).optional().describe("Broad thematic identifiers for filtering and grouping"),
  symbolic_tags: z.array(z.string()).optional().describe("Deeper narrative or therapeutic symbols"),
  
  // Narrative elements
  narrative_function: z.string().optional().describe("Role within the narrative (informational, boss_encounter, etc)"),
  narrative_stage: z.string().optional().describe("Point in story arc when the asset is critical"),
  narrative_pressure: z.union([z.string(), z.number()]).optional().describe("Level of dramatic intensity (0-10)"),
  emotional_tone: z.string().optional().describe("Affect or mood associated with the asset"),
  
  // Dependency system
  dependencies: z.array(z.string()).optional().describe("Conditions required for availability"),
  anti_dependencies: z.array(z.string()).optional().describe("Conditions that suppress this asset"),
  
  // Visual representation
  icon: z.string().url().optional().describe("URI reference to an icon for this asset"),
  media: z.union([z.string(), MediaSchema, z.record(z.string(), z.any())]).optional().describe("External media references"),
  images: z.array(ImageSchema).optional().describe("Image assets associated with this asset"),
  
  // DM information
  dm_only_notes: z.string().optional().describe("Internal DM notes hidden from players"),
  
  // Event system
  eventHooks: z.array(EventHookSchema).optional().describe("Event hooks for interactive behavior"),
  
  // Spatial information
  geometry: z.union([z.string(), GeometrySchema]).optional().describe("Spatial or dimensional context"),
  
  // TTS and sound
  sound_effects: z.union([z.string(), SoundEffectsSchema]).optional().describe("Ambient and triggered sound cues"),
  
  // Temporal tracking
  created_at: z.string().datetime().optional().describe("Creation timestamp"),
  updated_at: z.string().datetime().optional().describe("Last update timestamp"),
  
  // Extensions for future compatibility
  extensions: z.record(z.any()).optional().describe("Custom extensions for future compatibility"),
  
  // TTS voice fields (from v2.2.0 extensions)
  npc_voice_id: z.string().optional().describe("NPC TTS voice ID"),
  narration_voice_id: z.string().optional().describe("Scene narration voice ID"),
  narration_mode: z.enum(['default', 'muted', 'auto']).optional().describe("Controls how this asset is spoken"),
  sfx_tags: z.array(z.string()).optional().describe("Tags for sound effects"),
});

// Extended schemas for specific asset categories
export const SpellSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.SPELL),
  level: z.number().min(0).max(9).describe("Spell level (0-9)"),
  school: z.enum([
    "Abjuration", "Conjuration", "Divination", "Enchantment", 
    "Evocation", "Illusion", "Necromancy", "Transmutation"
  ]).describe("School of magic"),
  castingTime: z.string().describe("Time required to cast the spell"),
  range: z.string().optional().describe("Range of the spell effect"),
  components: SpellComponentsSchema.describe("Required spell components"),
  duration: z.string().describe("Duration of the spell effect"),
  higherLevel: z.string().optional().describe("Effect when cast at higher levels"),
});

export const MonsterSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.MONSTER),
  type: z.enum([
    "Aberration", "Beast", "Celestial", "Construct", "Dragon",
    "Elemental", "Fey", "Fiend", "Giant", "Humanoid",
    "Monstrosity", "Ooze", "Plant", "Undead"
  ]).optional().describe("Monster type"),
  size: z.enum([
    "Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"
  ]).optional().describe("Creature size"),
  alignment: z.enum([
    "Lawful Good", "Neutral Good", "Chaotic Good",
    "Lawful Neutral", "True Neutral", "Chaotic Neutral",
    "Lawful Evil", "Neutral Evil", "Chaotic Evil", "Unaligned"
  ]).optional().describe("Creature alignment"),
  isLegendary: z.boolean().optional().describe("Has legendary actions"),
  challengeRating: z.union([z.string(), z.number()]).describe("Challenge rating"),
  armorClass: z.number().describe("Armor class"),
  hitPoints: z.union([z.string(), z.number()]).describe("Hit points or formula"),
  speed: z.string().optional().describe("Movement speeds"),
  abilities: AbilitiesSchema.optional().describe("Ability scores"),
  actions: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).optional().describe("Monster actions"),
  legendaryActions: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).optional().describe("Legendary actions"),
  // Backward compatibility with v2.2
  hp: z.number().optional(),
  ac: z.number().optional(),
  creature_type: z.string().optional(),
});

export const RuleFragmentSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.RULE_FRAGMENT),
  text: z.string().describe("Full text of the rule"),
  section: z.string().optional().describe("Main rulebook section"),
  subsection: z.string().optional().describe("Subsection within the main section"),
  source: z.string().optional().describe("Source rulebook"),
});

export const ItemSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.ITEM),
  itemType: z.enum([
    "Weapon", "Armor", "Potion", "Ring", "Rod", "Scroll", "Staff", "Wand", 
    "Wondrous Item", "Ammunition", "Artisan's Tools", "Gaming Set", 
    "Musical Instrument", "Adventuring Gear", "Vehicle", "Trade Good"
  ]).describe("Type of item"),
  rarity: z.enum([
    "Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact"
  ]).optional().describe("Item rarity"),
  isUnique: z.boolean().optional().describe("Whether this is a one-of-a-kind item"),
  requiresAttunement: z.boolean().optional().describe("Whether attunement is required"),
  value: z.string().optional().describe("Monetary value"),
  weight: z.string().optional().describe("Weight of the item"),
  properties: z.array(z.string()).optional().describe("Special properties"),
});

export const NPCSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.NPC),
  race: z.string().optional().describe("NPC race"),
  class: z.string().optional().describe("NPC class or occupation"),
  alignment: z.enum([
    "Lawful Good", "Neutral Good", "Chaotic Good",
    "Lawful Neutral", "True Neutral", "Chaotic Neutral",
    "Lawful Evil", "Neutral Evil", "Chaotic Evil", "Unaligned"
  ]).optional().describe("Moral and ethical alignment"),
  factionId: z.string().optional().describe("UUID of the faction this NPC belongs to"),
  homeLocationId: z.string().optional().describe("UUID of the location this NPC considers home"),
  personality: z.string().optional().describe("Personality traits"),
  appearance: z.string().optional().describe("Physical appearance details"),
  backstory: z.string().optional().describe("Character history"),
  motivations: z.string().optional().describe("Character goals and desires"),
  connections: z.array(z.string()).optional().describe("Relationships to other NPCs or factions"),
});

export const CharacterSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.CHARACTER),
  character_id: z.string().optional().describe("Unique ID for player character"),
  player: z.string().optional().describe("Name of the player controlling the character"),
  class: z.string().describe("Player's class"),
  level: z.number().describe("Character level"),
  race: z.string().describe("Species or ancestry"),
  background: z.string().optional().describe("Character's background"),
  faith: z.string().optional().describe("Deity or philosophy"),
  stats: StatsSchema.describe("Character abilities"),
  saving_throws: SavingThrowsSchema.optional().describe("Saving throw modifiers"),
  skills: SkillsSchema.optional().describe("Character's skill modifiers"),
  passive_checks: PassiveChecksSchema.optional().describe("Passive perception, insight, investigation"),
  traits: TraitsSchema.optional().describe("Roleplay characteristics"),
  backstory: z.string().optional().describe("Character backstory"),
  inventory: z.array(z.string()).optional().describe("Character's non-equipped items"),
  equipment: z.array(z.string()).optional().describe("Character's worn/carried gear"),
  spells: SpellsSchema.optional().describe("Cantrips and spell slots"),
});

export const LocationSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.LOCATION),
  locationType: z.enum([
    "Town", "City", "Village", "Dungeon", "Cave", "Forest", "Mountain", 
    "Castle", "Temple", "Ruin", "Tavern", "Shop", "Landmark", "Wilderness", "Planar"
  ]).optional().describe("Type of location"),
  parentLocationId: z.string().optional().describe("UUID of the parent location containing this one"),
  factionId: z.string().optional().describe("UUID of the faction controlling this location"),
  environment: z.string().optional().describe("Surrounding environment"),
  inhabitants: z.array(z.string()).optional().describe("Notable inhabitants"),
  history: z.string().optional().describe("Historical background"),
  secrets: z.array(z.string()).optional().describe("Hidden aspects or secrets"),
  pointsOfInterest: z.array(z.string()).optional().describe("Notable places within the location"),
});

export const RoomSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.ROOM),
  roomType: z.enum([
    "Corridor", "Hallway", "Chamber", "Cavern", "Cave", "Vault", "Crypt", "Room", 
    "Hall", "Cellar", "Antechamber", "Throne Room", "Laboratory", "Kitchen", 
    "Bedroom", "Chapel", "Prison", "Barracks", "Study", "Library", "Armory"
  ]).optional().describe("Type of room"),
  parentLocationId: z.string().optional().describe("UUID of the parent location containing this room"),
  area_dimensions: z.string().optional().describe("Physical dimensions of the area"),
  lighting: z.string().optional().describe("Lighting conditions in the room"),
  occupants: z.array(z.string()).optional().describe("Creatures or NPCs in the room"),
  treasures: z.array(z.string()).optional().describe("Treasure items found in the room"),
  traps: z.array(z.string()).optional().describe("Traps present in the room"),
  access_portals: z.array(AccessPortalSchema).optional().describe("Doors/passages between areas"),
  // For backward compatibility with v2.2
  room_type: z.string().optional(),
});

export const GenericAssetSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.GENERIC),
  // This schema is used for any asset that doesn't fit the other categories
  // It contains just the base fields with custom properties in extensions
});

// Merged Unified Asset Schema with discriminated union
export const UnifiedAssetSchema = z.discriminatedUnion('assetCategory', [
  SpellSchema,
  MonsterSchema,
  RuleFragmentSchema,
  ItemSchema,
  NPCSchema,
  CharacterSchema,
  LocationSchema,
  RoomSchema,
  GenericAssetSchema
]);

// Alternative flexible schema for compatibility with v2.2 flat structure
export const FlexibleAssetSchema = BaseAssetSchema.passthrough();

export type UnifiedAsset = z.infer<typeof UnifiedAssetSchema>;
export type FlexibleAsset = z.infer<typeof FlexibleAssetSchema>;
export type Spell = z.infer<typeof SpellSchema>;
export type Monster = z.infer<typeof MonsterSchema>;
export type RuleFragment = z.infer<typeof RuleFragmentSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type NPC = z.infer<typeof NPCSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type GenericAsset = z.infer<typeof GenericAssetSchema>;

// Helper function to determine collection based on asset category
export function getCollectionForUnifiedAsset(asset: UnifiedAsset | FlexibleAsset): string {
  // If asset has explicit category, use it
  if (asset.assetCategory) {
    switch (asset.assetCategory) {
      case AssetCategory.SPELL:
        return COLLECTIONS_UNIFIED.SPELLS;
      case AssetCategory.MONSTER:
        return COLLECTIONS_UNIFIED.MONSTERS;
      case AssetCategory.RULE_FRAGMENT:
        return COLLECTIONS_UNIFIED.RULE_FRAGMENTS;
      case AssetCategory.ITEM:
        return COLLECTIONS_UNIFIED.ITEMS;
      case AssetCategory.NPC:
        return COLLECTIONS_UNIFIED.NPCS;
      case AssetCategory.CHARACTER:
        return COLLECTIONS_UNIFIED.CHARACTERS;
      case AssetCategory.LOCATION:
        return COLLECTIONS_UNIFIED.LOCATIONS;
      case AssetCategory.ROOM:
        return COLLECTIONS_UNIFIED.ROOMS;
      default:
        return COLLECTIONS_UNIFIED.ASSETS;
    }
  }
  
  // Otherwise infer from properties
  const asset2 = asset as any; // For accessing potential properties
  
  // Check for monster properties
  if (asset2.challengeRating || asset2.isLegendary || 
      asset2.hp || asset2.armorClass || asset2.hitPoints) {
    return COLLECTIONS_UNIFIED.MONSTERS;
  }
  
  // Check for spell properties
  if (asset2.level !== undefined && asset2.school && asset2.castingTime) {
    return COLLECTIONS_UNIFIED.SPELLS;
  }
  
  // Check for rule fragment properties
  if (asset2.text && (asset2.section || asset2.subsection)) {
    return COLLECTIONS_UNIFIED.RULE_FRAGMENTS;
  }
  
  // Check for item properties
  if (asset2.itemType || asset2.rarity || asset2.requiresAttunement) {
    return COLLECTIONS_UNIFIED.ITEMS;
  }
  
  // Check for NPC properties
  if (asset2.race && !asset2.player) {
    return COLLECTIONS_UNIFIED.NPCS;
  }
  
  // Check for character properties
  if (asset2.player || (asset2.class && asset2.level && asset2.stats)) {
    return COLLECTIONS_UNIFIED.CHARACTERS;
  }
  
  // Check for room properties
  if (asset2.roomType || asset2.room_type || asset2.access_portals) {
    return COLLECTIONS_UNIFIED.ROOMS;
  }
  
  // Check for location properties
  if (asset2.locationType || asset2.parentLocationId || asset2.environment) {
    return COLLECTIONS_UNIFIED.LOCATIONS;
  }
  
  // Default
  return COLLECTIONS_UNIFIED.ASSETS;
}

// Helper function to convert flexible assets to structured assets
export function convertToUnifiedAsset(asset: any): UnifiedAsset {
  // Add assetCategory if not present
  if (!asset.assetCategory) {
    // Determine category based on properties
    if (asset.level !== undefined && asset.school) {
      asset.assetCategory = AssetCategory.SPELL;
    } else if (asset.challengeRating || asset.hp || asset.armorClass) {
      asset.assetCategory = AssetCategory.MONSTER;
    } else if (asset.text && (asset.section || asset.subsection)) {
      asset.assetCategory = AssetCategory.RULE_FRAGMENT;
    } else if (asset.itemType || asset.rarity) {
      asset.assetCategory = AssetCategory.ITEM;
    } else if (asset.race && !asset.player) {
      asset.assetCategory = AssetCategory.NPC;
    } else if (asset.player || (asset.class && asset.level && asset.stats)) {
      asset.assetCategory = AssetCategory.CHARACTER;
    } else if (asset.roomType || asset.room_type || asset.access_portals) {
      asset.assetCategory = AssetCategory.ROOM;
    } else if (asset.locationType || asset.parentLocationId) {
      asset.assetCategory = AssetCategory.LOCATION;
    } else {
      asset.assetCategory = AssetCategory.GENERIC;
    }
  }
  
  // Set schemaVersion if not present
  if (!asset.schemaVersion) {
    asset.schemaVersion = "2.4";
  }
  
  return asset as UnifiedAsset;
}