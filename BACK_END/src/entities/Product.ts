import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { SubCategory } from './SubCategory';

/**
 * Represents a specific item for sale in the store.
 * Each product is linked to a SubCategory and contains inventory and pricing data.
 */
@Entity('product')
export class Product {
    /**
     * The unique name of the Product.
     */
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * Name of the product
     */
    @Column()
    name: string;

    /**
     * Description of the product
     */
    @Column('text')
    description: string;

    /**
     * Product Price
     */
    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    /**
     * Number of Products available  
     */
    @Column({ default: 0 })
    stock: number;

    /**
     * Product Image
     * explicitly tell TypeORM the storage type is 'text'
     */
    @Column({ type: 'text', nullable: true, name: 'image_path' })
    imagePath: string | null;

    /**
     * The specific sub-category this product belongs to.
     * { onDelete: 'RESTRICT' } prevents deleting a sub-category that still has products.
     */
    @ManyToOne(() => SubCategory, (sub) => sub.products, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'sub_category_id' })
    subCategory: SubCategory;

    /**
     * Define the Product creation date 
     */
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}