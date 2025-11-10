import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251110213100 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "consent" ("id" text not null, "contact_id" text not null, "consent_type" text check ("consent_type" in ('email_tracking', 'analytics', 'marketing', 'data_processing')) not null, "given" boolean not null default false, "ip_address" text null, "user_agent" text null, "consent_method" text null, "given_at" timestamptz null, "withdrawn_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "consent_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_consent_deleted_at" ON "consent" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_consent_contact" ON "consent" ("contact_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_consent_type" ON "consent" ("consent_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_consent_contact_type" ON "consent" ("contact_id", "consent_type") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "session" ("id" text not null, "user_id" text not null, "token_hash" text not null, "device" text null, "ip_address" text null, "user_agent" text null, "last_activity" timestamptz not null, "expires_at" timestamptz not null, "revoked" boolean not null default false, "revoked_at" timestamptz null, "revoke_reason" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "session_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_session_deleted_at" ON "session" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_session_user" ON "session" ("user_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_session_token" ON "session" ("token_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_session_expires" ON "session" ("expires_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_session_revoked" ON "session" ("revoked") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "consent" cascade;`);

    this.addSql(`drop table if exists "session" cascade;`);
  }

}
