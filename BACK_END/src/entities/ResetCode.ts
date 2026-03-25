import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';

/**
 * Stores temporary verification codes for password resets.
 * These codes are short-lived and should be invalidated after use.
 */
@Entity('reset_code')
export class ResetCode {
    /**
   * Unique identifier for the reset record.
   */
    @PrimaryGeneratedColumn()
    id: number;

    /**
   * The user requesting the password reset.
   * { onDelete: 'CASCADE' } ensures if a user is deleted, their pending reset codes are too.
   */
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    /**
   * The actual code sent to the user (e.g., a 6-digit number or a random string).
   * Pro-tip: For high security, consider hashing this like a password.
   */
    @Column()
    code: string;

    @Column({ name: 'expires_at' })
    expiresAt: Date;

    @Column({ default: false })
    used: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}