import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251105223432 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "team" drop constraint if exists "team_slug_unique";`);
    this.addSql(`create table if not exists "team" ("id" text not null, "name" text not null, "slug" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "team_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_team_slug_unique" ON "team" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_team_deleted_at" ON "team" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "team_member" ("id" text not null, "team_id" text not null, "user_id" text not null, "role" text check ("role" in ('owner', 'member')) not null, "invited_by" text null, "joined_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "team_member_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_team_member_deleted_at" ON "team_member" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "team" cascade;`);

    this.addSql(`drop table if exists "team_member" cascade;`);
  }

}
