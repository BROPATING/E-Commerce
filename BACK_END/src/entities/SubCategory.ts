import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category";
import { Product } from "./Product";

@Entity("sub_category")
export class SubCategory{
    @PrimaryGeneratedColumn()
    id: number

    @Column({unique: true})
    name: string

    @ManyToOne(() => Category, (category) => category.subCategories, {onDelete: 'RESTRICT'})
    @JoinColumn({name: 'category_id'})
    category: Category[]

    @OneToMany(() => Product, (prod) => prod.subCategory)
    products: Product
}