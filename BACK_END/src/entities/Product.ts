import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { SubCategory } from './SubCategory';

@Entity('product')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true, name: 'image_path' })
  imagePath: string | null;

  @ManyToOne(() => SubCategory, (sub) => sub.products, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: SubCategory;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}