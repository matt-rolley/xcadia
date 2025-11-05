import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251105232127 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "portfolio" drop constraint if exists "portfolio_slug_unique";`);
    this.addSql(`create table if not exists "portfolio" ("id" text not null, "team_id" text not null, "contact_id" text null, "title" text not null, "description" text null, "slug" text not null, "password_hash" text null, "expires_at" timestamptz null, "is_active" boolean not null default true, "view_count" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "portfolio_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_portfolio_slug_unique" ON "portfolio" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_portfolio_deleted_at" ON "portfolio" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "portfolio_project" ("id" text not null, "portfolio_id" text not null, "project_id" text not null, "display_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "portfolio_project_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_portfolio_project_deleted_at" ON "portfolio_project" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "project" ("id" text not null, "team_id" text not null, "company_id" text null, "title" text not null, "description" text null, "category" text null, "tags" jsonb null, "is_featured" boolean not null default false, "display_order" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "project_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_project_deleted_at" ON "project" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "portfolio" cascade;`);

    this.addSql(`drop table if exists "portfolio_project" cascade;`);

    this.addSql(`drop table if exists "project" cascade;`);
  }

}
