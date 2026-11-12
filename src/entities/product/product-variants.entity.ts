import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Product } from './product.entity';
import { VariantAttribute } from './product-variant-attribute.entity';
import { VariantImage } from './variant-image.entity';

@Entity('product_variants')
@Index('UQ_product_variants_slug', ['slug'], { unique: true })
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  stock!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  packageHeightCm!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  packageWidthCm!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  packageLengthCm!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  packageWeightGrams!: number;

  @Column({ type: 'varchar', nullable: true })
  sku!: string | null;

  @Column({ type: 'varchar' })
  slug!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @OneToMany(() => VariantAttribute, (va) => va.variant, { cascade: true })
  variantAttributes!: VariantAttribute[];

  @OneToMany(() => VariantImage, (image) => image.variant, { cascade: true })
  images!: VariantImage[];

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  product!: Product;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
