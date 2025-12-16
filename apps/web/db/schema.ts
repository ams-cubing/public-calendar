import {
  pgTable,
  text,
  serial,
  date,
  timestamp,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

export const states = pgTable("state", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  regionId: text("region_id")
    .notNull()
    .references(() => regions.id),
});

export const regions = pgTable("region", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  mapColor: text("map_color").notNull(),
});

export const users = pgTable("user", {
  wcaId: text("wca_id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").default("user").notNull(),
  regionId: text("region_id").references(() => regions.id),
  lastLogin: timestamp("last_login").defaultNow(),
});

export const competitions = pgTable("competition", {
  id: serial("id").primaryKey(),
  name: text("name"),
  city: text("city").notNull(),

  stateId: text("state_id")
    .notNull()
    .references(() => states.id),

  requestedBy: text("requested_by").references(() => users.wcaId),

  trelloUrl: text("trello_url"),

  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),

  statusPublic: publicStatusEnum("status_public").default("reserved").notNull(),
  statusInternal: internalStatusEnum("status_internal")
    .default("draft")
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const competitionDelegates = pgTable("competition_delegate", {
  competitionId: serial("competition_id")
    .notNull()
    .references(() => competitions.id, { onDelete: "cascade" }),
  delegateWcaId: text("delegate_wca_id")
    .notNull()
    .references(() => users.wcaId, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false).notNull(),
});

export const competitionOrganizers = pgTable("competition_organizer", {
  competitionId: serial("competition_id")
    .notNull()
    .references(() => competitions.id, { onDelete: "cascade" }),
  organizerWcaId: text("organizer_wca_id")
    .notNull()
    .references(() => users.wcaId, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false).notNull(),
});

export const unavailability = pgTable("unavailability", {
  id: serial("id").primaryKey(),
  userWcaId: text("user_wca_id")
    .notNull()
    .references(() => users.wcaId, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const statesRelations = relations(states, ({ one, many }) => ({
  region: one(regions, {
    fields: [states.regionId],
    references: [regions.id],
  }),
  competitions: many(competitions),
}));

export const regionsRelations = relations(regions, ({ many }) => ({
  states: many(states),
  users: many(users),
}));

export const competitionsRelations = relations(
  competitions,
  ({ one, many }) => ({
    state: one(states, {
      fields: [competitions.stateId],
      references: [states.id],
    }),
    delegates: many(competitionDelegates),
    organizers: many(competitionOrganizers),
  }),
);

export const competitionDelegatesRelations = relations(
  competitionDelegates,
  ({ one }) => ({
    competition: one(competitions, {
      fields: [competitionDelegates.competitionId],
      references: [competitions.id],
    }),
    delegate: one(users, {
      fields: [competitionDelegates.delegateWcaId],
      references: [users.wcaId],
    }),
  }),
);

export const competitionOrganizersRelations = relations(
  competitionOrganizers,
  ({ one }) => ({
    competition: one(competitions, {
      fields: [competitionOrganizers.competitionId],
      references: [competitions.id],
    }),
    organizer: one(users, {
      fields: [competitionOrganizers.organizerWcaId],
      references: [users.wcaId],
    }),
  }),
);

export const usersRelations = relations(users, ({ one, many }) => ({
  region: one(regions, {
    fields: [users.regionId],
    references: [regions.id],
  }),
  delegatedCompetitions: many(competitionDelegates),
  organizedCompetitions: many(competitionOrganizers),
  unavailability: many(unavailability),
}));
