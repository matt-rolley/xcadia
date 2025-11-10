import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251110211804 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "usage_tracker" ("id" text not null, "team_id" text not null, "period_start" timestamptz not null, "period_end" timestamptz not null, "storage_gb" integer not null default 0, "storage_limit_gb" integer not null default 5, "project_count" integer not null default 0, "project_limit" integer not null default 10, "email_count" integer not null default 0, "email_limit" integer not null default 100, "portfolio_view_count" integer not null default 0, "storage_warning_sent" boolean not null default false, "project_warning_sent" boolean not null default false, "email_warning_sent" boolean not null default false, "plan_name" text not null default 'free', "plan_price" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "usage_tracker_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_usage_tracker_deleted_at" ON "usage_tracker" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_usage_team" ON "usage_tracker" ("team_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_usage_period_end" ON "usage_tracker" ("period_end") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "usage_tracker" cascade;`);
  }

}
