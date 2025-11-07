import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251107185036 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "activity" ("id" text not null, "team_id" text not null, "user_id" text null, "entity_type" text check ("entity_type" in ('project', 'portfolio', 'contact', 'company', 'deal', 'team', 'email')) not null, "entity_id" text not null, "action" text check ("action" in ('created', 'updated', 'deleted', 'sent', 'viewed', 'opened', 'clicked', 'invited', 'joined', 'left')) not null, "metadata" jsonb null, "occurred_at" timestamptz not null default 'now', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "activity_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_activity_deleted_at" ON "activity" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "activity" cascade;`);
  }

}
