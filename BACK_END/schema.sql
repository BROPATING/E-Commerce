-- ============================================================
-- E-Commerce System — Database Schema
-- Generated: 2026-04-06T07:21:23.044Z
-- Database: SQLite (better-sqlite3)
-- ============================================================

-- ── TABLES ─────────────────────────────────────────────────

-- Table: cart_item
CREATE TABLE "cart_item" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL DEFAULT (1), "user_id" integer, "product_id" integer, CONSTRAINT "FK_3f1aaffa650d3e443f32459c4c5" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_67a2e8406e01ffa24ff9026944e" FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE CASCADE ON UPDATE NO ACTION);

-- Table: catogory
CREATE TABLE "catogory" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "type_id" integer, CONSTRAINT "UQ_139765558ebb2968b675a0a39fe" UNIQUE ("name"), CONSTRAINT "FK_081fbbfdbc1a87cf1f54a1a765f" FOREIGN KEY ("type_id") REFERENCES "product_type" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION);

-- Table: order
CREATE TABLE "order" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "total_amount" decimal(10,2) NOT NULL, "payment_method" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "user_id" integer, CONSTRAINT "FK_199e32a02ddc0f47cd93181d8fd" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION);

-- Table: order_item
CREATE TABLE "order_item" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL DEFAULT (1), "price_at_purchase" decimal(10,2) NOT NULL, "order_id" integer, "product_id" integer, CONSTRAINT "FK_e9674a6053adbaa1057848cddfa" FOREIGN KEY ("order_id") REFERENCES "order" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_5e17c017aa3f5164cb2da5b1c6b" FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION);

-- Table: product
CREATE TABLE "product" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" text NOT NULL, "price" decimal(10,2) NOT NULL, "stock" integer NOT NULL DEFAULT (0), "image_path" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "sub_category_id" integer, CONSTRAINT "FK_bb5914af2b6f5d4e13115cdc07b" FOREIGN KEY ("sub_category_id") REFERENCES "sub_category" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION);

-- Table: product_type
CREATE TABLE "product_type" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, CONSTRAINT "UQ_8978484a9cee7a0c780cd259b88" UNIQUE ("name"));

-- Table: reset_code
CREATE TABLE "reset_code" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "code" varchar NOT NULL, "expires_at" datetime NOT NULL, "used" boolean NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "user_id" integer, CONSTRAINT "FK_a4945bfe3573b87f3e27d619b6b" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION);

-- Table: sub_category
CREATE TABLE "sub_category" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "category_id" integer, CONSTRAINT "UQ_7745a7cea2687ee7b048f828c76" UNIQUE ("name"), CONSTRAINT "FK_4ec8c495300259f2322760a39fa" FOREIGN KEY ("category_id") REFERENCES "catogory" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION);

-- Table: user
CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "password_hash" varchar NOT NULL, "role" varchar CHECK( "role" IN ('customer','admin') ) NOT NULL DEFAULT ('customer'), "is_locked" boolean NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"));
