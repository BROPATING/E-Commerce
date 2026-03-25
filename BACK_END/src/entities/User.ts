import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CartItem } from "./CartItem";
import { Order } from "./Order";

/**
 * Defines the available access levels for users within the system.
 */
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Entity('user')
export class User {
    /**
     * The unique name of the User.
     */
    @PrimaryGeneratedColumn()
    id: number

    /**
     * name of user 
     */
    @Column()
    name: string

    /**
     * The unique user email
     */
    @Column({ unique: true })
    email: string

    /**
     * user password in hash format 
     */
    @Column({ name: 'password_hash' })
    passwordHash: string

    /**
     * The permission level assigned to the user.
     * Defaults to 'customer'.
     */
    @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
    role: UserRole;

    /**
     * Flag to indicate if the account is suspended or locked.
     */
    @Column({ name: 'is_locked', default: false })
    isLocked: boolean;

    /**
     * Automatically recorded timestamp of when the user registered.
     */
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    /**
     * Collection of items currently in the user's shopping cart.
     */
    @OneToMany(() => CartItem, (item) => item.user)
    cartItems: CartItem[];

    /**
     * History of all orders placed by this user.
     */
    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];

}