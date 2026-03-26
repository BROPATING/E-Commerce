import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Product } from "./Product";
import { OrderItem } from "./OrderItem";

/**
 * Records a completed transaction. 
 * Unlike a Cart, an Order is a permanent record of what was purchased and at what price.
 */
@Entity('order')
export class Order {
    /**
     * Unique identifier for the Order
     */
    @PrimaryGeneratedColumn()
    id: number

    /**
     * The customer who placed the order.
     * { onDelete: 'RESTRICT' } ensures we don't delete users who have a purchase history.
     */
    @ManyToOne(() => User, (user) => user.orders, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'user_id' })
    user: User

    /**
     * Final Total Amount including all taxes 
     * Using decimal for financial precision.
     */
    @Column('decimal', { precision: 10, scale: 2, name: 'total_amount' })
    totalAmount: number

    /**
     * Represents the Payment Method (e.g., 'STRIPE', 'PAYPAL', 'COD').
     */
    @Column({ name: 'payment_method' })
    paymentMethod: string

    /**
     * The date and time the order was finalized.
     */
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    /**
     * The individual products tied to this specific order.
     * These are stored in OrderItem to "freeze" the price at the time of purchase.
     */
    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];
}