import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category";

/**
 * Represents the highest level of product classification (e.g., Electronics, Fashion, Home).
 * This entity serves as the root for the Category and SubCategory hierarchy.
 */

@Entity("product_type")
export class ProductType {
    /** * Unique identifier for the Product Type.
     * Auto-incremented by the database.
     */
    @PrimaryGeneratedColumn()
    id: number;

    /** * The display name of the product type (e.g., "Electronics").
     * Must be unique to prevent duplicate top-level departments.
     */
    @Column({unique: true})
    name: string;

    /** * List of categories associated with this product type.
     * This is the inverse side of the ManyToOne relationship in the Category entity.
     */
    @OneToMany(() => Category, (cat) => cat.type)
    categories: Category[];
}