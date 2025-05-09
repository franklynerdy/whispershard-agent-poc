/**
 * Asset Schema Service - Version 2.2.0
 * Implementation of the Enhanced JSON schema for D&D module asset extraction as documented in the schema version 2.2.0
 * 
 * Features supported:
 * - Narrative pacing
 * - Conditional reveals
 * - Semantic tagging
 * - Geometry
 * - Portals
 * - TTS controls
 * - Back-compatibility with v2.1
 */

import { z } from 'zod';

// Collection names in MongoDB
export const COLLECTIONS_V2 = {
  ASSETS: 'v5_assets',
  MONSTERS: 'v5_monsters',
  CHARACTERS: 'v5_characters',
  LOCATIONS: 'v5_locations',
  NPCS: 'v5_npcs',
  IMAGES: 'v5_images',
  ITEMS: 'v5_items',
  ROOMS: 'v5_rooms',
};

// Basic image type
export const ImageV2Schema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
  source: z.string().optional(),
});

export type ImageV2 = z.infer<typeof ImageV2Schema>;

// Media object type with image, audio, and video refs
export const MediaV2Schema = z.object({
  images: z.array(ImageV2Schema).optional(),
  audio: z.array(z.string().url()).optional(),
  video: z.array(z.string().url()).optional(),
});

// Geometry object for location dimensions
export const GeometryV2Schema = z.object({
  shape: z.string().optional(),
  width: z.number().optional(),
  length: z.number().optional(),
  height: z.number().optional(),
  units: z.string().optional(),
});

// Sound effects object
export const SoundEffectsV2Schema = z.object({
  ambient: z.string().optional(),
  triggered: z.record(z.string(), z.string()).optional(),
});

// Reveal logic for conditional content
export const RevealLogicV2Schema = z.object({
  awareness_levels: z.array(z.string()).optional(),
  player_perception: z.number().optional(),
  condition: z.string().optional(),
});

// Access portal definition
export const AccessPortalV2Schema = z.object({
  destination: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['open', 'closed', 'locked', 'blocked', 'trapped', 'secret']).optional(),
  condition: z.string().optional(),
});

// Monster ability scores
export const AbilitiesV2Schema = z.object({
  STR: z.number().optional(),
  DEX: z.number().optional(),
  CON: z.number().optional(),
  INT: z.number().optional(),
  WIS: z.number().optional(),
  CHA: z.number().optional(),
});

// Character stats (lowercase to distinguish from monster abilities)
export const StatsV2Schema = z.object({
  str: z.number().optional(),
  dex: z.number().optional(),
  con: z.number().optional(),
  int: z.number().optional(),
  wis: z.number().optional(),
  cha: z.number().optional(),
});

// Character saving throws
export const SavingThrowsV2Schema = z.record(z.string(), z.number());

// Character skills
export const SkillsV2Schema = z.record(z.string(), z.number());

// Character passive checks
export const PassiveChecksV2Schema = z.object({
  perception: z.number().optional(),
  insight: z.number().optional(),
  investigation: z.number().optional(),
});

// Character traits
export const TraitsV2Schema = z.object({
  personality: z.string().optional(),
  ideals: z.string().optional(),
  bonds: z.string().optional(),
  flaws: z.string().optional(),
});

// Character spells
export const SpellsV2Schema = z.object({
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

// TTS Voice Fields extensions (from the extensions section)
export const TTSVoiceFieldsV2Schema = z.object({
  npc_voice_id: z.string().optional(),
  narration_voice_id: z.string().optional(),
  narration_mode: z.enum(['default', 'muted', 'auto']).optional(),
  sfx_tags: z.array(z.string()).optional(),
});

// Main schema for v2.2.0 assets based on the full schema documentation
export const AssetV2Schema = z.object({
  // Schema metadata - not in schema but might be helpful
  schema_version: z.string().optional().describe("Version of the schema used"),
  
  // Base fields
  id: z.string().describe("Unique identifier for each asset, using lowercase_snake_case."),
  name: z.string().describe("Display name of the asset for players and DM interface."),
  description: z.string().optional().describe("Narrative and functional description for the asset."),
  
  // Tag fields
  tags: z.array(z.string()).optional().describe("Broad thematic identifiers for filtering and grouping assets."),
  symbolic_tags: z.array(z.string()).optional().describe("Deeper narrative or therapeutic symbols relating to the asset."),
  
  // Dependency fields
  dependencies: z.array(z.string()).optional().describe("Conditions that must be met for this asset to become available or visible."),
  anti_dependencies: z.array(z.string()).optional().describe("Conditions that, if met, disable or suppress this asset."),
  
  // Narrative fields
  narrative_function: z.string().optional().describe("Role within the narrative (e.g., informational, boss_encounter, reward_node)."),
  narrative_stage: z.string().optional().describe("Point in chapter/arc when the asset is critical (e.g., setup, climax)."),
  emotional_tone: z.string().optional().describe("Affect or mood associated with the asset."),
  narrative_pressure: z.union([z.string(), z.number()]).optional().describe("Level of dramatic intensity (low, medium, high)."),
  narrative_sequence: z.record(z.string(), z.any()).optional().describe("Order or sequencing relative to other assets (e.g., comes_after, climactic)."),
  
  // Spatial fields
  geometry: z.union([z.string(), GeometryV2Schema]).optional().describe("Spatial or dimensional context (e.g., shape, dimensions)."),
  access_portals: z.array(AccessPortalV2Schema).optional().describe("Defines doors/passages between assets, with reveal logic."),
  
  // Media and sound
  sound_effects: z.union([z.string(), SoundEffectsV2Schema]).optional().describe("Ambient and triggered sound cues for immersion."),
  media: z.union([z.string(), MediaV2Schema]).optional().describe("References to external media (images, video, audio) for this asset."),
  
  // DM information
  dm_only_notes: z.string().optional().describe("Internal DM notes and reminders, hidden from players."),
  reveal_logic: z.union([z.string(), RevealLogicV2Schema]).optional().describe("Multi-stage conditional discoveries (awareness_levels, player_perception)."),
  summary: z.string().optional().describe("Short player-facing summary of the asset."),
  
  // Related entities
  npcs: z.array(z.union([z.string(), z.record(z.string(), z.any())])).optional().describe("NPCs tied to this asset, with names/roles or inline objects."),
  items: z.array(z.union([z.string(), z.record(z.string(), z.any())])).optional().describe("Items tied to this asset, with names/types or inline objects."),
  hooks: z.array(z.union([z.string(), z.record(z.string(), z.any())])).optional().describe("Adventure hooks or narrative prompts originating from this asset."),
  locations: z.array(z.union([z.string(), z.record(z.string(), z.any())])).optional().describe("Relevant location names or definitions connected to this asset."),
  
  // Monster specific fields
  challenge_rating: z.union([z.string(), z.number()]).optional().describe("Monster difficulty scaling"),
  hp: z.number().optional().describe("Monster hit points"),
  ac: z.number().optional().describe("Monster armor class"),
  size: z.string().optional().describe("Creature physical size"),
  alignment: z.string().optional().describe("Creature moral and ethical alignment"),
  creature_type: z.string().optional().describe("Creature classification"),
  abilities: z.union([z.string(), AbilitiesV2Schema]).optional().describe("Monster ability scores"),
  
  // Character specific fields
  character_id: z.string().optional().describe("Unique ID for player character"),
  player: z.string().optional().describe("Name of the player controlling the character"),
  class: z.string().optional().describe("Player's class"),
  level: z.number().optional().describe("Character level"),
  race: z.string().optional().describe("Species or ancestry"),
  background: z.string().optional().describe("Character's background"),
  faith: z.string().optional().describe("Deity or philosophy"),
  stats: z.union([z.string(), StatsV2Schema]).optional().describe("Character abilities"),
  saving_throws: z.union([z.string(), SavingThrowsV2Schema]).optional().describe("Saving throw modifiers"),
  skills: z.union([z.string(), SkillsV2Schema]).optional().describe("Character's skill modifiers"),
  passive_checks: z.union([z.string(), PassiveChecksV2Schema]).optional().describe("Passive values for perception, insight, investigation"),
  traits: z.union([z.string(), TraitsV2Schema]).optional().describe("Roleplay characteristics"),
  backstory: z.string().optional().describe("Character backstory"),
  inventory: z.array(z.string()).optional().describe("Character's non-equipped items"),
  equipment: z.array(z.string()).optional().describe("Character's worn/carried gear"),
  spells: z.union([z.string(), SpellsV2Schema]).optional().describe("Cantrips and spell slots"),
  
  // TTS extension fields
  npc_voice_id: z.string().optional().describe("NPC TTS voice ID"),
  narration_voice_id: z.string().optional().describe("Scene narration voice ID"),
  narration_mode: z.enum(['default', 'muted', 'auto']).optional().describe("Controls if/how this asset is spoken aloud"),
  sfx_tags: z.array(z.string()).optional().describe("Tags for sound effects (e.g., door_creak, ambient_drip)"),
}).passthrough();

export type AssetV2 = z.infer<typeof AssetV2Schema>;

// Asset type detection for collection placement
export enum AssetV2Type {
  MONSTER = 'monster',
  CHARACTER = 'character',
  LOCATION = 'location',
  ROOM = 'room',
  NPC = 'npc',
  ITEM = 'item',
  GENERIC = 'generic'
}

// Utility function to determine the asset type based on properties
export function detectAssetV2Type(asset: AssetV2): AssetV2Type {
  // Check for monster properties
  if (asset.challenge_rating || asset.creature_type || (asset.hp && asset.ac)) {
    return AssetV2Type.MONSTER;
  }
  
  // Check for character properties
  if (asset.character_id || asset.player || (asset.class && asset.level)) {
    return AssetV2Type.CHARACTER;
  }
  
  // Check for room-specific properties
  if (asset.geometry && asset.access_portals) {
    return AssetV2Type.ROOM;
  }
  
  // Check for location properties that aren't rooms
  if (asset.geometry || asset.locations) {
    return AssetV2Type.LOCATION;
  }
  
  // Check for NPC properties
  if (asset.race && !asset.character_id) {
    return AssetV2Type.NPC;
  }
  
  // Check for item properties
  if (asset.id && asset.id.includes('item_')) {
    return AssetV2Type.ITEM;
  }
  
  // Default to generic asset
  return AssetV2Type.GENERIC;
}

// Utility function to determine the appropriate collection based on asset properties
export function getCollectionForAssetV2(asset: AssetV2): string {
  const assetType = detectAssetV2Type(asset);
  
  switch (assetType) {
    case AssetV2Type.MONSTER:
      return COLLECTIONS_V2.MONSTERS;
    case AssetV2Type.CHARACTER:
      return COLLECTIONS_V2.CHARACTERS;
    case AssetV2Type.LOCATION:
      return COLLECTIONS_V2.LOCATIONS;
    case AssetV2Type.ROOM:
      return COLLECTIONS_V2.ROOMS;
    case AssetV2Type.NPC:
      return COLLECTIONS_V2.NPCS;
    case AssetV2Type.ITEM:
      return COLLECTIONS_V2.ITEMS;
    default:
      return COLLECTIONS_V2.ASSETS;
  }
}