/**
 * Asset Schema Service - Version 2.3
 * Implementation of the Whispershard polymorphic asset schema
 * Based on the official JSON Schema v2.3
 */

import { z } from 'zod';

// Collection names in MongoDB
export const COLLECTIONS = {
  ASSETS: 'v6_assets',
  IMAGES: 'v6_images',
  MONSTERS: 'v6_monsters',
  SPELLS: 'v6_spells',
  ITEMS: 'v6_items',
  LOCATIONS: 'v6_locations',
  NPCS: 'v6_npcs',
  ROOM_BLOCKS: 'v6_room_blocks',
  RULES: 'v6_rules',
  RULE_FRAGMENTS: 'v6_rule_fragments',
};

// Asset Categories
export enum AssetCategory {
  RULE_FRAGMENT = 'RuleFragment',
  SPELL = 'Spell',
  MONSTER = 'Monster',
  ITEM = 'Item',
  NPC = 'NPC',
  LOCATION = 'Location',
  ROOM_BLOCK = 'RoomBlock'
}

// Image schema according to the specifications in "images" properties
export const ImageSchema = z.object({
  assetId: z.string(),
  url: z.string().url(),
  caption: z.string().optional(),
  source: z.string().optional(),
});

export type ImageAsset = z.infer<typeof ImageSchema>;

// Localized string schema
export const LocalizedStringSchema = z.record(z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/), z.string());

// Schema for eventHook items
export const EventHookSchema = z.object({
  trigger: z.string(),
  action: z.string(),
  params: z.record(z.any()).optional(),
});

// Base asset schema that all asset types share
export const BaseAssetSchema = z.object({
  id: z.string(),
  schemaVersion: z.string(),
  assetCategory: z.nativeEnum(AssetCategory),
  name: z.union([z.string(), LocalizedStringSchema]),
  description: z.union([z.string(), LocalizedStringSchema]).optional(),
  sourceBook: z.string().optional(),
  page: z.number().optional(),
  tags: z.array(z.string()).optional(),
  symbolic_tags: z.array(z.string()).optional(),
  narrative_pressure: z.number().optional(),
  icon: z.string().url().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  eventHooks: z.array(EventHookSchema).optional(),
  extensions: z.record(z.any()).optional(),
  // Images array for the asset (added to support the requirements)
  images: z.array(ImageSchema).optional(),
});

export type BaseAsset = z.infer<typeof BaseAssetSchema>;

// Spell-specific schema
export const SpellSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.SPELL),
  level: z.number().min(0).max(9),
  school: z.enum([
    "Abjuration", "Conjuration", "Divination", "Enchantment", 
    "Evocation", "Illusion", "Necromancy", "Transmutation"
  ]),
  castingTime: z.string(),
  range: z.string().optional(),
  components: z.object({
    verbal: z.boolean().optional(),
    somatic: z.boolean().optional(),
    material: z.string().optional(),
  }),
  duration: z.string(),
  higherLevel: z.string().optional(),
});

// Monster-specific schema
export const MonsterSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.MONSTER),
  type: z.enum([
    "Aberration", "Beast", "Celestial", "Construct", "Dragon",
    "Elemental", "Fey", "Fiend", "Giant", "Humanoid",
    "Monstrosity", "Ooze", "Plant", "Undead"
  ]).optional(),
  size: z.enum([
    "Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"
  ]).optional(),
  alignment: z.enum([
    "Lawful Good", "Neutral Good", "Chaotic Good",
    "Lawful Neutral", "True Neutral", "Chaotic Neutral",
    "Lawful Evil", "Neutral Evil", "Chaotic Evil", "Unaligned"
  ]).optional(),
  isLegendary: z.boolean().optional(),
  challengeRating: z.number(),
  armorClass: z.number(),
  hitPoints: z.string(),
  speed: z.string().optional(),
  abilities: z.object({
    strength: z.number().optional(),
    dexterity: z.number().optional(),
    constitution: z.number().optional(),
    intelligence: z.number().optional(),
    wisdom: z.number().optional(),
    charisma: z.number().optional(),
  }).optional(),
  actions: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).optional(),
  legendaryActions: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).optional(),
});

// Rule Fragment schema
export const RuleFragmentSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.RULE_FRAGMENT),
  text: z.string(),
  section: z.string().optional(),
  subsection: z.string().optional(),
  page: z.number().optional(),
  source: z.string().optional(),
});

// Item schema
export const ItemSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.ITEM),
  itemType: z.enum([
    "Weapon", "Armor", "Potion", "Ring", "Rod", "Scroll", "Staff", "Wand", 
    "Wondrous Item", "Ammunition", "Artisan's Tools", "Gaming Set", 
    "Musical Instrument", "Adventuring Gear", "Vehicle", "Trade Good"
  ]),
  rarity: z.enum([
    "Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact"
  ]).optional(),
  isUnique: z.boolean().optional(),
  requiresAttunement: z.boolean().optional(),
  value: z.string().optional(),
  weight: z.string().optional(),
  properties: z.array(z.string()).optional(),
});

// NPC schema
export const NPCSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.NPC),
  race: z.string().optional(),
  class: z.string().optional(),
  alignment: z.enum([
    "Lawful Good", "Neutral Good", "Chaotic Good",
    "Lawful Neutral", "True Neutral", "Chaotic Neutral",
    "Lawful Evil", "Neutral Evil", "Chaotic Evil", "Unaligned"
  ]).optional(),
  factionId: z.string().optional(),
  homeLocationId: z.string().optional(),
  personality: z.string().optional(),
  appearance: z.string().optional(),
  backstory: z.string().optional(),
  motivations: z.string().optional(),
  connections: z.array(z.string()).optional(),
});

// Location schema
export const LocationSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.LOCATION),
  locationType: z.enum([
    "Town", "City", "Village", "Dungeon", "Cave", "Forest", "Mountain", 
    "Castle", "Temple", "Ruin", "Tavern", "Shop", "Landmark", "Wilderness", "Planar"
  ]).optional(),
  parentLocationId: z.string().optional(),
  factionId: z.string().optional(),
  environment: z.string().optional(),
  inhabitants: z.array(z.string()).optional(),
  history: z.string().optional(),
  secrets: z.array(z.string()).optional(),
  pointsOfInterest: z.array(z.string()).optional(),
});

// RoomBlock schema
export const RoomBlockSchema = BaseAssetSchema.extend({
  assetCategory: z.literal(AssetCategory.ROOM_BLOCK),
  room_type: z.enum([
    "Corridor", "Hallway", "Chamber", "Cavern", "Cave", "Vault", "Crypt", "Room", 
    "Hall", "Cellar", "Antechamber", "Throne Room", "Laboratory", "Kitchen", 
    "Bedroom", "Chapel", "Prison", "Barracks", "Study", "Library", "Armory"
  ]).optional(),
  parentLocationId: z.string().optional(),
  area_dimensions: z.string().optional(),
  lighting: z.string().optional(),
  occupants: z.array(z.string()).optional(),
  treasures: z.array(z.string()).optional(),
  traps: z.array(z.string()).optional(),
  access_portals: z.array(z.object({
    destination: z.string().optional(),
    description: z.string().optional(),
    status: z.enum([
      "open", "closed", "locked", "blocked", "trapped", "secret"
    ]).optional(),
  })).optional(),
});

// Create a discriminated union of all asset types based on assetCategory
export const AssetSchema = z.discriminatedUnion('assetCategory', [
  SpellSchema,
  MonsterSchema,
  RuleFragmentSchema,
  ItemSchema,
  NPCSchema,
  LocationSchema,
  RoomBlockSchema,
]);

export type Asset = z.infer<typeof AssetSchema>;
export type Spell = z.infer<typeof SpellSchema>;
export type Monster = z.infer<typeof MonsterSchema>;
export type RuleFragment = z.infer<typeof RuleFragmentSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type NPC = z.infer<typeof NPCSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type RoomBlock = z.infer<typeof RoomBlockSchema>;

// Helper function to determine collection name based on asset category
export function getCollectionForAssetCategory(category: AssetCategory): string {
  switch (category) {
    case AssetCategory.MONSTER:
      return COLLECTIONS.MONSTERS;
    case AssetCategory.SPELL:
      return COLLECTIONS.SPELLS;
    case AssetCategory.ITEM:
      return COLLECTIONS.ITEMS;
    case AssetCategory.LOCATION:
      return COLLECTIONS.LOCATIONS;
    case AssetCategory.NPC:
      return COLLECTIONS.NPCS;
    case AssetCategory.ROOM_BLOCK:
      return COLLECTIONS.ROOM_BLOCKS;
    case AssetCategory.RULE_FRAGMENT:
      return COLLECTIONS.RULE_FRAGMENTS;
    default:
      return COLLECTIONS.ASSETS;
  }
}