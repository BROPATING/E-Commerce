import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Product } from "./Product";

/**
 * Represents a specific product and its quantity inside a user's shopping cart.
 * This acts as a junction between the User and the Product.
 * It act as a whishList / Bucket
 */
@Entity('cart_item')
export class CartItem {
    /**
     * Unique identifier for the cart item entry.
     */
    @PrimaryGeneratedColumn()
    id: number

    /**
     * The user who owns this cart item.
     * { onDelete: 'CASCADE' } ensures if a user is deleted, their cart is cleared automatically.
     */
    @ManyToOne(() => User, (user) => user.cartItems, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    /**
     * The specific product added to the cart.
     * { onDelete: 'CASCADE' } ensures if a product is removed from the store, 
     * it's also removed from all active carts.
     */
    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    /**
     * How many units of the product the user wants to purchase.
     * Defaults to 1.
     */
    @Column({ default: 1 })
    quantity: number;

}