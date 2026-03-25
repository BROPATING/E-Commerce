import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category";


@Entity("product_type")
export class ProductType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    name: string;

    @OneToMany(() => Category, (cat) => cat.type)
    categories : Category[];
}