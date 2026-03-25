import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CartItem } from "./CartItem";
import { Order } from "./Order";

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Entity('user')
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ unique: true })
    email: string

    @Column({ name: 'password_hash' })
    passwordHash: string

    @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
    role: UserRole;

    @Column({ name: 'is_locked', default: false })
    isLocked: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToMany(() => CartItem, (item) => item.user)
    cartItems: CartItem[];

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];

}