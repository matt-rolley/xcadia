import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251110223324 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "email_domain" ("id" text not null, "team_id" text not null, "domain" text not null, "from_name" text not null default '', "from_email" text not null, "verified" boolean not null default false, "verification_token" text not null, "verified_at" timestamptz null, "dns_records" jsonb not null default '{"spf":{"type":"TXT","name":"@","value":"v=spf1 include:_spf.xcadia.com ~all","verified":false},"dkim":{"type":"TXT","name":"xcadia._domainkey","value":"","verified":false},"dmarc":{"type":"TXT","name":"_dmarc","value":"v=DMARC1; p=none; rua=mailto:dmarc@xcadia.com","verified":false}}', "enabled" boolean not null default false, "is_default" boolean not null default false, "emails_sent" integer not null default 0, "last_sent_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "email_domain_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_email_domain_deleted_at" ON "email_domain" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_email_domain_team" ON "email_domain" ("team_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_email_domain_domain" ON "email_domain" ("domain") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_email_domain_verified" ON "email_domain" ("verified") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_email_domain_team_default" ON "email_domain" ("team_id", "is_default") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "email_domain" cascade;`);
  }

}
