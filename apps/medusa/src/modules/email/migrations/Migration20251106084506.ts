import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251106084506 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "portfolio_email" drop constraint if exists "portfolio_email_tracking_id_unique";`);
    this.addSql(`create table if not exists "email_event" ("id" text not null, "portfolio_email_id" text not null, "event_type" text check ("event_type" in ('opened', 'clicked', 'bounced', 'delivered', 'failed')) not null, "occurred_at" timestamptz not null, "user_agent" text null, "ip_address" text null, "link_url" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "email_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_email_event_deleted_at" ON "email_event" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "email_template" ("id" text not null, "team_id" text not null, "name" text not null, "subject" text not null, "html_content" text not null, "text_content" text null, "variables" jsonb null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "email_template_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_email_template_deleted_at" ON "email_template" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "portfolio_email" ("id" text not null, "portfolio_id" text not null, "contact_id" text not null, "tracking_id" text not null, "subject" text not null, "sent_at" timestamptz not null, "opened_at" timestamptz null, "clicked_at" timestamptz null, "bounced_at" timestamptz null, "bounce_reason" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "portfolio_email_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_portfolio_email_tracking_id_unique" ON "portfolio_email" ("tracking_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_portfolio_email_deleted_at" ON "portfolio_email" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "email_event" cascade;`);

    this.addSql(`drop table if exists "email_template" cascade;`);

    this.addSql(`drop table if exists "portfolio_email" cascade;`);
  }

}
