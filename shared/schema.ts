import { pgTable, text, serial, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Element types
export const ElementType = {
  RECTANGLE: "rectangle",
  ELLIPSE: "ellipse", 
  TEXT: "text",
  LINE: "line",
} as const;

export type ElementTypeValue = typeof ElementType[keyof typeof ElementType];

// Design elements table
export const elements = pgTable("elements", {
  id: serial("id").primaryKey(),
  designId: integer("design_id").notNull(),
  type: text("type").notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
  width: real("width").notNull(),
  height: real("height").notNull(),
  rotation: real("rotation").default(0),
  fill: text("fill").default("#FFFFFF"),
  stroke: text("stroke").default("none"),
  strokeWidth: real("stroke_width").default(0),
  opacity: real("opacity").default(1),
  content: text("content").default(""),
  zIndex: integer("z_index").notNull(),
  properties: jsonb("properties").default({}),
});

export const insertElementSchema = createInsertSchema(elements).omit({
  id: true,
});

// Design documents table
export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  width: real("width").notNull().default(800),
  height: real("height").notNull().default(600),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertDesignSchema = createInsertSchema(designs).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Element = typeof elements.$inferSelect;
export type InsertElement = z.infer<typeof insertElementSchema>;

export type Design = typeof designs.$inferSelect;
export type InsertDesign = z.infer<typeof insertDesignSchema>;
