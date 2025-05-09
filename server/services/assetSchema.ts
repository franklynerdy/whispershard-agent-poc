/**
 * Asset Schema Service - Version 2.3
 * Implementation of the polymorphic schema for asset management
 */

import { z } from 'zod';

// Image schema according to the specifications
export const ImageSchema = z.object({
  assetId: z.string(),
  url: z.string().url(),
  caption: z.string().optional(),
  source: z.string().optional(),
});

export type ImageAsset = z.infer<typeof ImageSchema>;

// Polymorphic asset schemas
export enum AssetType {
  MONSTER = 'monster',
  SPELL = 'spell',
  ITEM = 'item',
  LOCATION = 'location',
  NPC = 'npc',
  RULE = 'rule',
}

// Base schema that all assets share
export const BaseAssetSchema = z.object({
  assetId: z.string(),
  name: z.string(),
  type: z.nativeEnum(AssetType),
  description: z.string().optional(),
  source: z.string().optional(),
  images: z.array(ImageSchema).optional(),
  metadata: z.record(z.any()).optional(),
});

export type BaseAsset = z.infer<typeof BaseAssetSchema>;

// Type-specific schemas with additional properties
export const MonsterAssetSchema = BaseAssetSchema.extend({
  type: z.literal(AssetType.MONSTER),
  metadata: z.object({
    size: z.string().optional(),
    cr: z.string().optional(),
    hp: z.number().optional(),
    ac: z.number().optional(),
    abilities: z.record(z.string(), z.number()).optional(),
  }).optional(),
});

export const SpellAssetSchema = BaseAssetSchema.extend({
  type: z.literal(AssetType.SPELL),
  metadata: z.object({
    level: z.number().optional(),
    school: z.string().optional(),
    castingTime: z.string().optional(),
    range: z.string().optional(),
    components: z.string().optional(),
    duration: z.string().optional(),
  }).optional(),
});

export const ItemAssetSchema = BaseAssetSchema.extend({
  type: z.literal(AssetType.ITEM),
  metadata: z.object({
    rarity: z.string().optional(),
    attunement: z.boolean().optional(),
    category: z.string().optional(),
    value: z.string().optional(),
  }).optional(),
});

export const LocationAssetSchema = BaseAssetSchema.extend({
  type: z.literal(AssetType.LOCATION),
  metadata: z.object({
    region: z.string().optional(),
    terrain: z.string().optional(),
    size: z.string().optional(),
    population: z.string().optional(),
  }).optional(),
});

export const NPCAssetSchema = BaseAssetSchema.extend({
  type: z.literal(AssetType.NPC),
  metadata: z.object({
    race: z.string().optional(),
    class: z.string().optional(),
    occupation: z.string().optional(),
    alignment: z.string().optional(),
  }).optional(),
});

export const RuleAssetSchema = BaseAssetSchema.extend({
  type: z.literal(AssetType.RULE),
  metadata: z.object({
    category: z.string().optional(),
    page: z.number().optional(),
    chapter: z.string().optional(),
  }).optional(),
});

// Union type for all asset types
export const AssetSchema = z.discriminatedUnion('type', [
  MonsterAssetSchema,
  SpellAssetSchema,
  ItemAssetSchema,
  LocationAssetSchema,
  NPCAssetSchema,
  RuleAssetSchema,
]);

export type Asset = z.infer<typeof AssetSchema>;

// MongoDB Collection names
export const COLLECTIONS = {
  ASSETS: 'v6_assets',
  IMAGES: 'v6_images',
  MONSTERS: 'v6_monsters',
  SPELLS: 'v6_spells',
  ITEMS: 'v6_items',
  LOCATIONS: 'v6_locations',
  NPCS: 'v6_npcs',
  RULES: 'v6_rules',
  RULE_FRAGMENTS: 'v6_rule_fragments',
};

// Helper function to determine collection name based on asset type
export function getCollectionForAssetType(type: AssetType): string {
  switch (type) {
    case AssetType.MONSTER:
      return COLLECTIONS.MONSTERS;
    case AssetType.SPELL:
      return COLLECTIONS.SPELLS;
    case AssetType.ITEM:
      return COLLECTIONS.ITEMS;
    case AssetType.LOCATION:
      return COLLECTIONS.LOCATIONS;
    case AssetType.NPC:
      return COLLECTIONS.NPCS;
    case AssetType.RULE:
      return COLLECTIONS.RULES;
    default:
      return COLLECTIONS.ASSETS;
  }
}