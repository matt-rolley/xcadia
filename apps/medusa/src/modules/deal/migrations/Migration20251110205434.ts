import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251110205434 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "deal" ("id" text not null, "team_id" text not null, "company_id" text not null, "contact_id" text null, "portfolio_id" text null, "name" text not null, "description" text null, "deal_type" text check ("deal_type" in ('project', 'retainer', 'consulting', 'custom')) not null, "stage" text check ("stage" in ('lead', 'qualification', 'proposal', 'negotiation', 'won', 'lost', 'on_hold')) not null default 'lead', "probability" integer null, "expected_close_date" timestamptz null, "actual_close_date" timestamptz null, "currency" text not null default 'USD', "created_by" text not null, "assigned_to" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "deal_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_deal_deleted_at" ON "deal" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "deal_line_item" ("id" text not null, "scenario_id" text not null, "name" text not null, "description" text null, "quantity" integer not null default 1, "unit_price" numeric not null, "total_price" numeric not null, "template_id" text null, "metadata" jsonb null, "raw_unit_price" jsonb not null, "raw_total_price" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "deal_line_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_deal_line_item_deleted_at" ON "deal_line_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "deal_scenario" ("id" text not null, "deal_id" text not null, "name" text not null, "description" text null, "is_active" boolean not null default true, "is_selected" boolean not null default false, "subtotal" numeric not null default 0, "tax_rate" integer not null default 0, "tax_amount" numeric not null default 0, "discount_amount" numeric not null default 0, "discount_percentage" integer not null default 0, "total" numeric not null default 0, "metadata" jsonb null, "raw_subtotal" jsonb not null default '{"value":"0","precision":20}', "raw_tax_amount" jsonb not null default '{"value":"0","precision":20}', "raw_discount_amount" jsonb not null default '{"value":"0","precision":20}', "raw_total" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "deal_scenario_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_deal_scenario_deleted_at" ON "deal_scenario" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "deal" cascade;`);

    this.addSql(`drop table if exists "deal_line_item" cascade;`);

    this.addSql(`drop table if exists "deal_scenario" cascade;`);
  }

}
