import {
  pgTable,
  text,
  serial,
  boolean,
  date,
  timestamp,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- ENUMS ---
export const publicStatusEnum = pgEnum("public_status", [
  "open",
  "reserved",
  "confirmed",
  "announced",
  "suspended",
  "unavailable",
]);
export const internalStatusEnum = pgEnum("internal_status", [
  "draft",
  "looking_for_venue",
  "ultimatum_sent",
  "ready",
]);

// --- NEW TABLE: STATES ---
export const states = pgTable("state", {
  id: text("id").primaryKey(), // Three-letter code (e.g., "JAL", "CDMX")
  name: text("name").notNull().unique(), // Full name (e.g., "Jalisco", "Ciudad de México")
  regionId: text("region_id")
    .notNull()
    .references(() => regions.id), // Link state to its region
});

// --- 1. REGIONS ---
export const regions = pgTable("region", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  mapColor: text("map_color").notNull(),
  // NOTE: We no longer store the `states: text("states").array()` array here.
  // The list of states is derived via the relation.
});

// --- 2. USERS (No change) ---
export const users = pgTable("user", {
  wcaId: text("wca_id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").default("user").notNull(),
  regionId: text("region_id").references(() => regions.id),
  lastLogin: timestamp("last_login").defaultNow(),
});

// --- 3. COMPETITIONS (Updated to use stateId) ---
export const competitions = pgTable("competition", {
  id: serial("id").primaryKey(),
  name: text("name"),
  city: text("city").notNull(),

  // New: Link Competition to State Code
  stateId: text("state_id")
    .notNull()
    .references(() => states.id),

  primaryDelegateId: text("primary_delegate_id").references(() => users.wcaId),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),

  statusPublic: publicStatusEnum("status_public").default("reserved").notNull(),
  statusInternal: internalStatusEnum("status_internal")
    .default("draft")
    .notNull(),
});

// --- 4. AVAILABILITY (No change) ---
export const availability = pgTable(
  "availability",
  {
    userWcaId: text("user_wca_id")
      .notNull()
      .references(() => users.wcaId, { onDelete: "cascade" }),
    weekendStart: date("weekend_start").notNull(),
    isAvailable: boolean("is_available").default(true),
    note: text("note"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userWcaId, t.weekendStart] }),
  }),
);

// --- RELATIONS (Updated) ---

export const statesRelations = relations(states, ({ one, many }) => ({
  region: one(regions, {
    fields: [states.regionId],
    references: [regions.id],
  }),
  competitions: many(competitions),
}));

export const regionsRelations = relations(regions, ({ many }) => ({
  states: many(states), // Region can have many States
  users: many(users),
}));

export const competitionsRelations = relations(competitions, ({ one }) => ({
  delegate: one(users, {
    fields: [competitions.primaryDelegateId],
    references: [users.wcaId],
  }),
  // Competition now links to State, and through State, to Region
  state: one(states, {
    fields: [competitions.stateId],
    references: [states.id],
  }),
}));
