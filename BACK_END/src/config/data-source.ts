import { DataSource } from 'typeorm';
import { ProductType } from '../entities/ProductType';
import { Category } from '../entities/Category';
import { SubCategory } from '../entities/SubCategory';
import { Product } from '../entities/Product';
import { User } from '../entities/User';
import { CartItem } from '../entities/CartItem';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { ResetCode } from '../entities/ResetCode';
import dotenv from "dotenv";
dotenv.config();
/**
 * The Central Database Connection configuration for the E-Commerce Application.
 * This object manages the connection pool and maps your TypeScript entities to MySQL tables.
 */
export const AppDataSource = new DataSource({
    type: 'better-sqlite3',
    // Connection details pulled from .env for security
    // host: process.env.DB_HOST || 'localhost',
    // port: Number(process.env.DB_PORT) || 3306,
    // username: process.env.DB_USERNAME || 'root',
    // password: process.env.DB_PASSWORD || '',
    // database: process.env.DB_NAME || 'ecommerce_db',
    database: process.env.DB_PATH || './ecommerce.db',
    /**
     * synchronize: Automatically creates/updates database tables to match your @Entity files.
     * WARNING: Only use this in 'development'. In production, use Migrations to avoid data loss.
     * In Dev: You have maximum productivity and speed.
     * In Prod: The feature is forced OFF, requiring you to use Migrations (version-controlled scripts) to update the database safely.
     */
    // synchronize: process.env.NODE_ENV === "true",  // For Migration === 'Production'
    // synchronize: process.env.NODE_ENV === 'development', // Without Migration
    synchronize: true,
    /**
     * logging: Prints all SQL queries to the terminal.
     * Useful for debugging complex joins between Categories and Products.
     */
    logging: process.env.NODE_ENV === 'false',
    // logging: process.env.NODE_ENV === 'development',
    /**
     * entities: The list of classes that TypeORM should track.
     * All hierarchy levels (Type -> Cat -> SubCat -> Product) must be listed here.
     */
    entities: [
        ProductType, Category, SubCategory, Product,
        User, CartItem, Order, OrderItem, ResetCode
    ],
    /**
     * Commented because we are not using sql server we are using SQLIte
     * timezone: 'Z' (Zulu/UTC).
     * Ensures that all 'created_at' and 'expires_at' timestamps are stored in UTC format.
     * Prevents time-shift bugs when the server and database are in different regions.
     */
    // timezone: 'Z',

    // Specify migration files location and history table
    migrations: ["src/migrations/**/*.ts"],    // Path to all migration scripts
    migrationsTableName: 'migrations_history', // Table to track applied migrations
});

