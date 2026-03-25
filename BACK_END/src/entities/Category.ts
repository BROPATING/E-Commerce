import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductType } from "./ProductType";
import { SubCategory } from "./SubCategory";

/**
 * Represents the Product Category ex. electronics, clothing, beauty
 */
@Entity("catogory")
export class Category{
    /** * Unique identifier for the Category.
     * Auto-incremented by the database.
     */
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The unique name of the category (e.g., "Laptops", "Kitchenware").
     */
    @Column({unique: true})
    name: string;

    /**
     * The parent ProductType this category belongs to.
     * { onDelete: 'RESTRICT' } ensures we cannot delete a ProductType 
     * if it still contains active categories.
     */
    @ManyToOne(() => ProductType, (prod) => prod.categories, { onDelete: 'RESTRICT'} )
    @JoinColumn({name: 'type_id'})
    type: ProductType;

    /**
     * More specification for the category ex. Electronics -> Mobile/Laptop -> Iphone/HP
     */
    @OneToMany(() => SubCategory, (subCat) => subCat.category)
    subCategories: SubCategory[];
}