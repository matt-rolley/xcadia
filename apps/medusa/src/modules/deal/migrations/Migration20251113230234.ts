import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251113230234 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "deal" add column if not exists "cloned_from_deal_id" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "deal" drop column if exists "cloned_from_deal_id";`);
  }

}
