import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category";
import { Product } from "./Product";

/**
 * Represents the specification of category
 */
@Entity("sub_category")
export class SubCategory{
    /** * Unique identifier for the Product Type.
     * Auto-incremented by the database.
     */
    @PrimaryGeneratedColumn()
    id: number

    /**
     * The unique name of the sub-category.
     */
    @Column({unique: true})
    name: string

    /**
     * The parent Category this sub-classification belongs to.
     * Note: Changed from Category[] to Category because one sub-category 
     * belongs to only ONE parent category.
     */
    @ManyToOne(() => Category, (category) => category.subCategories, {onDelete: 'RESTRICT'})
    @JoinColumn({name: 'category_id'})
    category: Category;

    /**
     * List of all products that fall under this specific sub-category.
     * Note: Changed from Product to Product[] because one sub-category 
     * can contain MANY products.
     */
    @OneToMany(() => Product, (prod) => prod.subCategory)
    products: Product
}