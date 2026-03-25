import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductType } from "./ProductType";
import { SubCategory } from "./SubCategory";

@Entity("catogory")
export class Category{
    @PrimaryGeneratedColumn()
    id: number

    @Column({unique: true})
    name: string

    @ManyToOne(() => ProductType, (prod) => prod.categories, { onDelete: 'RESTRICT'} )
    @JoinColumn({name: 'type_id'})
    type: ProductType

    @OneToMany(() => SubCategory, (subCat) => subCat.category)
    subCategories: SubCategory[]

}