import { z } from "zod";
import { pgTable, text, serial, integer, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Base types for polymorphic data
export enum AssetType {
  WEAPON = "weapon",
  ARMOR = "armor",
  SPELL = "spell",
  MONSTER = "monster",
  ITEM = "item",
  SCENE = "scene",
  CHARACTER = "character",
  MAP = "map"
}

export enum ImageCategory {
  ICON = "icon",
  FULL = "full",
  TOKEN = "token",
  PORTRAIT = "portrait",
  JOURNAL_ART = "journal-art",
  SCENE = "scene"
}

export enum SourceBook {
  DUNGEON_MASTERS_GUIDE = "dungeon-masters-guide",
  MONSTER_MANUAL = "monster-manual",
  PLAYERS_HANDBOOK = "phb",
  PHANDELVER_BELOW = "phandelver-below"
}

// Schema for image references
export const imageReferences = pgTable("image_references", {
  id: serial("id").primaryKey(),
  asset_id: varchar("asset_id", { length: 100 }).notNull(),
  asset_type: text("asset_type").$type<AssetType>().notNull(),
  source_book: text("source_book").$type<SourceBook>().notNull(),
  category: text("category").$type<ImageCategory>().notNull(),
  path: text("path").notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  created_at: text("created_at").notNull(),
});

// Polymorphic assets table with metadata
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  asset_id: varchar("asset_id", { length: 100 }).notNull().unique(),
  name: text("name").notNull(),
  type: text("type").$type<AssetType>().notNull(),
  description: text("description"),
  metadata: jsonb("metadata"), // Flexible object that varies by asset type
  source_book: text("source_book").$type<SourceBook>().notNull(),
  source_page: integer("source_page"),
  primary_image_id: integer("primary_image_id").references(() => imageReferences.id),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

// Type-specific metadata schemas (for validation with zod)
export const weaponMetadataSchema = z.object({
  damage: z.string(),
  damageType: z.string(),
  properties: z.array(z.string()),
  weight: z.number().optional(),
  cost: z.string().optional(),
  rarity: z.string().optional(),
});

export const armorMetadataSchema = z.object({
  armorClass: z.number(),
  type: z.string(),
  properties: z.array(z.string()).optional(),
  weight: z.number().optional(),
  cost: z.string().optional(),
  rarity: z.string().optional(),
});

export const spellMetadataSchema = z.object({
  level: z.number(),
  school: z.string(),
  castingTime: z.string(),
  range: z.string(),
  components: z.string(),
  duration: z.string(),
  classes: z.array(z.string()),
});

export const monsterMetadataSchema = z.object({
  size: z.string(),
  type: z.string(),
  alignment: z.string(),
  armorClass: z.number(),
  hitPoints: z.string(),
  speed: z.string(),
  challenge: z.string(),
  abilities: z.record(z.string(), z.number()).optional(),
  senses: z.array(z.string()).optional(),
});

// Insert schemas
export const insertImageReferenceSchema = createInsertSchema(imageReferences).pick({
  asset_id: true,
  asset_type: true,
  source_book: true,
  category: true,
  path: true,
  url: true,
  caption: true,
  created_at: true,
});

export const insertAssetSchema = createInsertSchema(assets).pick({
  asset_id: true,
  name: true,
  type: true,
  description: true,
  metadata: true,
  source_book: true,
  source_page: true,
  primary_image_id: true,
  created_at: true,
  updated_at: true,
});

// Export types
export type InsertImageReference = z.infer<typeof insertImageReferenceSchema>;
export type ImageReference = typeof imageReferences.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

// Utility functions for working with assets
export function getAssetImageUrl(sourceBook: SourceBook, path: string): string {
  return `https://7942b93dd6963bf3f88f8d7acdd3d909.r2.cloudflarestorage.com/whispershard-assets/${sourceBook}/${path}`;
}

// Function to extract keywords from an asset name
export function extractKeywords(assetName: string): string[] {
  return assetName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/[\s-]+/)
    .filter(word => word.length > 2);
}

// Function to find image references for a given keyword
export async function findImagesByKeyword(keyword: string, db: any): Promise<ImageReference[]> {
  // This would normally query the database
  // For now, we'll return a placeholder to be implemented
  return [];
}