import { InferSelectModel, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  pgEnum,
  serial,
  date,
  jsonb,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  wcaId: text("wca_id").notNull().unique(),
  role: text("role", { enum: ["delegate", "organizer", "user"] })
    .default("user")
    .notNull(),
  regionId: text("region_id").references(() => regions.id),
  lastLogin: timestamp("last_login").defaultNow(),
});

export type User = InferSelectModel<typeof user>;

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  region: one(regions, {
    fields: [user.regionId],
    references: [regions.id],
  }),
  delegatedCompetitions: many(competitionDelegates),
  organizedCompetitions: many(competitionOrganizers),
  availability: many(availability),
  activityLogs: many(logs), 
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

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

export const competitions = pgTable("competition", {
  id: serial("id").primaryKey(),
  name: text("name"),
  city: text("city").notNull(),

  stateId: text("state_id")
    .notNull()
    .references(() => states.id),

  requestedBy: text("requested_by").references(() => user.wcaId),

  trelloUrl: text("trello_url"),
  wcaCompetitionUrl: text("wca_competition_url"),

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
    .references(() => user.wcaId, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false).notNull(),
});

export const competitionOrganizers = pgTable("competition_organizer", {
  competitionId: serial("competition_id")
    .notNull()
    .references(() => competitions.id, { onDelete: "cascade" }),
  organizerWcaId: text("organizer_wca_id")
    .notNull()
    .references(() => user.wcaId, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false).notNull(),
});

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  userWcaId: text("user_wca_id")
    .notNull()
    .references(() => user.wcaId, { onDelete: "cascade" }),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const holidays = pgTable("holiday", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: date("date").notNull(),
  official: boolean("official").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Holiday = InferSelectModel<typeof holidays>;

export const logs = pgTable("log", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  actorId: text("actor_id")
    .notNull()
    .references(() => user.id),
  details: jsonb("details"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("log_target_idx").on(table.targetType, table.targetId),
  index("log_actor_idx").on(table.actorId)
]);

export const statesRelations = relations(states, ({ one, many }) => ({
  region: one(regions, {
    fields: [states.regionId],
    references: [regions.id],
  }),
  competitions: many(competitions),
}));

export const regionsRelations = relations(regions, ({ many }) => ({
  states: many(states),
  users: many(user),
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
    delegate: one(user, {
      fields: [competitionDelegates.delegateWcaId],
      references: [user.wcaId],
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
    organizer: one(user, {
      fields: [competitionOrganizers.organizerWcaId],
      references: [user.wcaId],
    }),
  }),
);

export const logsRelations = relations(logs, ({ one }) => ({
  actor: one(user, {
    fields: [logs.actorId],
    references: [user.id],
  }),
}));
