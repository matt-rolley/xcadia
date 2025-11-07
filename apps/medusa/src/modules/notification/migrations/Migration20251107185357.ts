import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251107185357 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "in_app_notification" ("id" text not null, "team_id" text not null, "user_id" text not null, "type" text check ("type" in ('portfolio_viewed', 'portfolio_sent', 'deal_updated', 'member_joined', 'member_invited', 'email_opened', 'email_clicked', 'project_created', 'company_created', 'contact_created')) not null, "title" text not null, "message" text not null, "entity_type" text null, "entity_id" text null, "read" boolean not null default false, "read_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "in_app_notification_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_in_app_notification_deleted_at" ON "in_app_notification" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "in_app_notification" cascade;`);
  }

}
