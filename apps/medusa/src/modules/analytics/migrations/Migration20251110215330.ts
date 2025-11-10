import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251110215330 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "analytics_event" ("id" text not null, "team_id" text not null, "user_id" text null, "event_type" text not null, "event_category" text check ("event_category" in ('portfolio', 'project', 'contact', 'company', 'deal', 'email', 'authentication', 'integration', 'other')) not null, "entity_id" text null, "entity_type" text null, "ip_address" text null, "user_agent" text null, "device_type" text null, "browser" text null, "country" text null, "city" text null, "metadata" jsonb null, "duration_ms" integer null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "analytics_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_deleted_at" ON "analytics_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_analytics_team" ON "analytics_event" ("team_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_analytics_user" ON "analytics_event" ("user_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_analytics_event_type" ON "analytics_event" ("event_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_analytics_event_category" ON "analytics_event" ("event_category") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_analytics_entity" ON "analytics_event" ("entity_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_analytics_created" ON "analytics_event" ("created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_analytics_team_event_time" ON "analytics_event" ("team_id", "event_type", "created_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "analytics_event" cascade;`);
  }

}
