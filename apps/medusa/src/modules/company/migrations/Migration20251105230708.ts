import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251105230708 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "company" ("id" text not null, "team_id" text not null, "name" text not null, "website" text null, "phone" text null, "email" text null, "address" text null, "city" text null, "state" text null, "country" text null, "postal_code" text null, "notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "company_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_company_deleted_at" ON "company" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "contact" ("id" text not null, "company_id" text not null, "first_name" text not null, "last_name" text not null, "email" text not null, "phone" text null, "title" text null, "notes" text null, "is_primary" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "contact_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_contact_deleted_at" ON "contact" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "company" cascade;`);

    this.addSql(`drop table if exists "contact" cascade;`);
  }

}
