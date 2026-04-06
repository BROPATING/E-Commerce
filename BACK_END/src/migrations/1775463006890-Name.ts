import { MigrationInterface, QueryRunner } from "typeorm";

export class Name1775463006890 implements MigrationInterface {
    name = 'Name1775463006890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" text NOT NULL, "price" decimal(10,2) NOT NULL, "stock" integer NOT NULL DEFAULT (0), "image_path" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "sub_category_id" integer)`);
        await queryRunner.query(`CREATE TABLE "sub_category" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "category_id" integer, CONSTRAINT "UQ_7745a7cea2687ee7b048f828c76" UNIQUE ("name"))`);
        await queryRunner.query(`CREATE TABLE "catogory" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "type_id" integer, CONSTRAINT "UQ_139765558ebb2968b675a0a39fe" UNIQUE ("name"))`);
        await queryRunner.query(`CREATE TABLE "product_type" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, CONSTRAINT "UQ_8978484a9cee7a0c780cd259b88" UNIQUE ("name"))`);
        await queryRunner.query(`CREATE TABLE "cart_item" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL DEFAULT (1), "user_id" integer, "product_id" integer)`);
        await queryRunner.query(`CREATE TABLE "order_item" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL DEFAULT (1), "price_at_purchase" decimal(10,2) NOT NULL, "order_id" integer, "product_id" integer)`);
        await queryRunner.query(`CREATE TABLE "order" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "total_amount" decimal(10,2) NOT NULL, "payment_method" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "user_id" integer)`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "password_hash" varchar NOT NULL, "role" varchar CHECK( "role" IN ('customer','admin') ) NOT NULL DEFAULT ('customer'), "is_locked" boolean NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"))`);
        await queryRunner.query(`CREATE TABLE "reset_code" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "code" varchar NOT NULL, "expires_at" datetime NOT NULL, "used" boolean NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "user_id" integer)`);
        await queryRunner.query(`CREATE TABLE "temporary_product" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" text NOT NULL, "price" decimal(10,2) NOT NULL, "stock" integer NOT NULL DEFAULT (0), "image_path" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "sub_category_id" integer, CONSTRAINT "FK_bb5914af2b6f5d4e13115cdc07b" FOREIGN KEY ("sub_category_id") REFERENCES "sub_category" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_product"("id", "name", "description", "price", "stock", "image_path", "created_at", "sub_category_id") SELECT "id", "name", "description", "price", "stock", "image_path", "created_at", "sub_category_id" FROM "product"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`ALTER TABLE "temporary_product" RENAME TO "product"`);
        await queryRunner.query(`CREATE TABLE "temporary_sub_category" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "category_id" integer, CONSTRAINT "UQ_7745a7cea2687ee7b048f828c76" UNIQUE ("name"), CONSTRAINT "FK_4ec8c495300259f2322760a39fa" FOREIGN KEY ("category_id") REFERENCES "catogory" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sub_category"("id", "name", "category_id") SELECT "id", "name", "category_id" FROM "sub_category"`);
        await queryRunner.query(`DROP TABLE "sub_category"`);
        await queryRunner.query(`ALTER TABLE "temporary_sub_category" RENAME TO "sub_category"`);
        await queryRunner.query(`CREATE TABLE "temporary_catogory" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "type_id" integer, CONSTRAINT "UQ_139765558ebb2968b675a0a39fe" UNIQUE ("name"), CONSTRAINT "FK_081fbbfdbc1a87cf1f54a1a765f" FOREIGN KEY ("type_id") REFERENCES "product_type" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_catogory"("id", "name", "type_id") SELECT "id", "name", "type_id" FROM "catogory"`);
        await queryRunner.query(`DROP TABLE "catogory"`);
        await queryRunner.query(`ALTER TABLE "temporary_catogory" RENAME TO "catogory"`);
        await queryRunner.query(`CREATE TABLE "temporary_cart_item" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL DEFAULT (1), "user_id" integer, "product_id" integer, CONSTRAINT "FK_3f1aaffa650d3e443f32459c4c5" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_67a2e8406e01ffa24ff9026944e" FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_cart_item"("id", "quantity", "user_id", "product_id") SELECT "id", "quantity", "user_id", "product_id" FROM "cart_item"`);
        await queryRunner.query(`DROP TABLE "cart_item"`);
        await queryRunner.query(`ALTER TABLE "temporary_cart_item" RENAME TO "cart_item"`);
        await queryRunner.query(`CREATE TABLE "temporary_order_item" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL DEFAULT (1), "price_at_purchase" decimal(10,2) NOT NULL, "order_id" integer, "product_id" integer, CONSTRAINT "FK_e9674a6053adbaa1057848cddfa" FOREIGN KEY ("order_id") REFERENCES "order" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_5e17c017aa3f5164cb2da5b1c6b" FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_order_item"("id", "quantity", "price_at_purchase", "order_id", "product_id") SELECT "id", "quantity", "price_at_purchase", "order_id", "product_id" FROM "order_item"`);
        await queryRunner.query(`DROP TABLE "order_item"`);
        await queryRunner.query(`ALTER TABLE "temporary_order_item" RENAME TO "order_item"`);
        await queryRunner.query(`CREATE TABLE "temporary_order" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "total_amount" decimal(10,2) NOT NULL, "payment_method" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "user_id" integer, CONSTRAINT "FK_199e32a02ddc0f47cd93181d8fd" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_order"("id", "total_amount", "payment_method", "created_at", "user_id") SELECT "id", "total_amount", "payment_method", "created_at", "user_id" FROM "order"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`ALTER TABLE "temporary_order" RENAME TO "order"`);
        await queryRunner.query(`CREATE TABLE "temporary_reset_code" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "code" varchar NOT NULL, "expires_at" datetime NOT NULL, "used" boolean NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "user_id" integer, CONSTRAINT "FK_a4945bfe3573b87f3e27d619b6b" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_reset_code"("id", "code", "expires_at", "used", "created_at", "user_id") SELECT "id", "code", "expires_at", "used", "created_at", "user_id" FROM "reset_code"`);
        await queryRunner.query(`DROP TABLE "reset_code"`);
        await queryRunner.query(`ALTER TABLE "temporary_reset_code" RENAME TO "reset_code"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reset_code" RENAME TO "temporary_reset_code"`);
        await queryRunner.query(`CREATE TABLE "reset_code" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "code" varchar NOT NULL, "expires_at" datetime NOT NULL, "used" boolean NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "user_id" integer)`);
        await queryRunner.query(`INSERT INTO "reset_code"("id", "code", "expires_at", "used", "created_at", "user_id") SELECT "id", "code", "expires_at", "used", "created_at", "user_id" FROM "temporary_reset_code"`);
        await queryRunner.query(`DROP TABLE "temporary_reset_code"`);
        await queryRunner.query(`ALTER TABLE "order" RENAME TO "temporary_order"`);
        await queryRunner.query(`CREATE TABLE "order" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "total_amount" decimal(10,2) NOT NULL, "payment_method" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "user_id" integer)`);
        await queryRunner.query(`INSERT INTO "order"("id", "total_amount", "payment_method", "created_at", "user_id") SELECT "id", "total_amount", "payment_method", "created_at", "user_id" FROM "temporary_order"`);
        await queryRunner.query(`DROP TABLE "temporary_order"`);
        await queryRunner.query(`ALTER TABLE "order_item" RENAME TO "temporary_order_item"`);
        await queryRunner.query(`CREATE TABLE "order_item" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL DEFAULT (1), "price_at_purchase" decimal(10,2) NOT NULL, "order_id" integer, "product_id" integer)`);
        await queryRunner.query(`INSERT INTO "order_item"("id", "quantity", "price_at_purchase", "order_id", "product_id") SELECT "id", "quantity", "price_at_purchase", "order_id", "product_id" FROM "temporary_order_item"`);
        await queryRunner.query(`DROP TABLE "temporary_order_item"`);
        await queryRunner.query(`ALTER TABLE "cart_item" RENAME TO "temporary_cart_item"`);
        await queryRunner.query(`CREATE TABLE "cart_item" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL DEFAULT (1), "user_id" integer, "product_id" integer)`);
        await queryRunner.query(`INSERT INTO "cart_item"("id", "quantity", "user_id", "product_id") SELECT "id", "quantity", "user_id", "product_id" FROM "temporary_cart_item"`);
        await queryRunner.query(`DROP TABLE "temporary_cart_item"`);
        await queryRunner.query(`ALTER TABLE "catogory" RENAME TO "temporary_catogory"`);
        await queryRunner.query(`CREATE TABLE "catogory" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "type_id" integer, CONSTRAINT "UQ_139765558ebb2968b675a0a39fe" UNIQUE ("name"))`);
        await queryRunner.query(`INSERT INTO "catogory"("id", "name", "type_id") SELECT "id", "name", "type_id" FROM "temporary_catogory"`);
        await queryRunner.query(`DROP TABLE "temporary_catogory"`);
        await queryRunner.query(`ALTER TABLE "sub_category" RENAME TO "temporary_sub_category"`);
        await queryRunner.query(`CREATE TABLE "sub_category" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "category_id" integer, CONSTRAINT "UQ_7745a7cea2687ee7b048f828c76" UNIQUE ("name"))`);
        await queryRunner.query(`INSERT INTO "sub_category"("id", "name", "category_id") SELECT "id", "name", "category_id" FROM "temporary_sub_category"`);
        await queryRunner.query(`DROP TABLE "temporary_sub_category"`);
        await queryRunner.query(`ALTER TABLE "product" RENAME TO "temporary_product"`);
        await queryRunner.query(`CREATE TABLE "product" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" text NOT NULL, "price" decimal(10,2) NOT NULL, "stock" integer NOT NULL DEFAULT (0), "image_path" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "sub_category_id" integer)`);
        await queryRunner.query(`INSERT INTO "product"("id", "name", "description", "price", "stock", "image_path", "created_at", "sub_category_id") SELECT "id", "name", "description", "price", "stock", "image_path", "created_at", "sub_category_id" FROM "temporary_product"`);
        await queryRunner.query(`DROP TABLE "temporary_product"`);
        await queryRunner.query(`DROP TABLE "reset_code"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TABLE "order_item"`);
        await queryRunner.query(`DROP TABLE "cart_item"`);
        await queryRunner.query(`DROP TABLE "product_type"`);
        await queryRunner.query(`DROP TABLE "catogory"`);
        await queryRunner.query(`DROP TABLE "sub_category"`);
        await queryRunner.query(`DROP TABLE "product"`);
    }

}
