import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./Order";
import { Product } from "./Product";
/**
 * Represents an individual line item within a finalized Order.
 * It snapshots the product details at the specific moment of purchase.
 */
@Entity('order_item')
export class OrderItem{
    /**
     * unique identifier for OrderItem
     */
    @PrimaryGeneratedColumn()
    id: number

    /**
     * The parent order this item belongs to.
     * { onDelete: 'CASCADE' } means if the Order is deleted, 
     * these line items are removed automatically.
     */
    @ManyToOne(() => Order, (order) => order.items, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'order_id'})
    order: Order

    /**
     * The product being purchased.
     * { onDelete: 'RESTRICT' } prevents deleting a Product from the system 
     * if it has ever been part of a completed order (for financial history).
     */
    @ManyToOne(() => Product, {onDelete: 'RESTRICT'})
    @JoinColumn({name: 'product_id'})
    product: Product

    /**
     * Number of units Purchase
     */
    @Column({default: 1})
    quantity: number

    /**
     * The historical price of the product at the time the order was placed.
     * This protects the record from future price changes in the Product table.
     */
    @Column('decimal', {precision: 10, scale: 2, name: 'price_at_purchase'})
    priceAtPurchase: number
}