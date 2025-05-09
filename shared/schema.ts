import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Script schema
export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  scene_descriptions: text("scene_descriptions").array(),
  metadata: jsonb("metadata"),
});

// Message schema for chat history
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
});

// Chat session schema
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  title: text("title"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertScriptSchema = createInsertSchema(scripts).pick({
  title: true,
  description: true,
  content: true,
  scene_descriptions: true,
  metadata: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  user_id: true,
  role: true,
  content: true,
  timestamp: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  user_id: true,
  title: true,
  created_at: true,
  updated_at: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scripts.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
