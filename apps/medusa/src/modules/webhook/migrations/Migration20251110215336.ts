import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251110215336 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "webhook" ("id" text not null, "team_id" text not null, "name" text not null, "url" text not null, "secret" text null, "events" jsonb not null, "enabled" boolean not null default true, "auth_type" text check ("auth_type" in ('none', 'bearer', 'basic', 'custom')) not null default 'none', "auth_config" jsonb null, "retry_config" jsonb not null default '{"max_retries":3,"retry_delay":5000,"backoff_multiplier":2}', "success_count" integer not null default 0, "failure_count" integer not null default 0, "last_triggered_at" timestamptz null, "last_success_at" timestamptz null, "last_failure_at" timestamptz null, "last_error" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "webhook_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_webhook_deleted_at" ON "webhook" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_webhook_team" ON "webhook" ("team_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_webhook_enabled" ON "webhook" ("enabled") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_webhook_team_enabled" ON "webhook" ("team_id", "enabled") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "webhook_log" ("id" text not null, "webhook_id" text not null, "team_id" text not null, "event_type" text not null, "payload" jsonb not null, "url" text not null, "status_code" integer null, "response_body" text null, "response_time_ms" integer null, "success" boolean not null default false, "error" text null, "retry_count" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "webhook_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_webhook_log_deleted_at" ON "webhook_log" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_webhook_log_webhook" ON "webhook_log" ("webhook_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_webhook_log_team" ON "webhook_log" ("team_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_webhook_log_event" ON "webhook_log" ("event_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_webhook_log_success" ON "webhook_log" ("success") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_webhook_log_created" ON "webhook_log" ("created_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "webhook" cascade;`);

    this.addSql(`drop table if exists "webhook_log" cascade;`);
  }

}
