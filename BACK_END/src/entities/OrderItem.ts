import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./Order";
import { Product } from "./Product";

@Entity('order_item')
export class OrderItem{
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Order, (order) => order.items, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'order_id'})
    order: Order

    @ManyToOne(() => Product, {onDelete: 'RESTRICT'})
    @JoinColumn({name: 'product_id'})
    product: Product

    @Column({default: 1})
    quantity: number

    @Column('decimal', {precision: 10, scale: 2, name: 'price_at_purchase'})
    priceAtPurchase: number
}