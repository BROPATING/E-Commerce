import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Product } from "./Product";
import { OrderItem } from "./OrderItem";

@Entity('order')
export class Order{
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, (user) => user.orders, {onDelete: 'RESTRICT'})
    @JoinColumn({name: 'user_id'})
    user: User

    @Column('decimal', { precision: 10, scale: 2, name: 'total_amount' })
    totalAmount: number

    @Column({name: 'payment_method'})
    paymentMethod: string

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date

    @OneToMany(() => OrderItem, (item) => item.order, {onDelete:'CASCADE'})
    items: OrderItem[];
}