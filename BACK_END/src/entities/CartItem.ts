import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Product } from "./Product";

Entity('cart_item')
export class CartItem {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, (user) => user.cartItems, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ default: 1 })
    quantity: number;

}