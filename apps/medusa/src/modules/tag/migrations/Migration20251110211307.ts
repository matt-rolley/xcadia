import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251110211307 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "tag" ("id" text not null, "team_id" text not null, "name" text not null, "color" text not null default '#3B82F6', "entity_types" jsonb not null default '["project","portfolio","contact","company","deal"]', "created_by" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "tag_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tag_deleted_at" ON "tag" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_tag_team" ON "tag" ("team_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_tag_name_team" ON "tag" ("name", "team_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "tag" cascade;`);
  }

}
