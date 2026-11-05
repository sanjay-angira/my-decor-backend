import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  subtitle!: string;

  /** Desktop banner image URL (uploaded as WebP). */
  @Column({ type: 'varchar', length: 2048, nullable: true })
  image!: string | null;

  /** Mobile banner image URL (uploaded as WebP). */
  @Column({ type: 'varchar', length: 2048, nullable: true })
  mobileImage!: string | null;

  @Column({ nullable: true })
  bannerLink!: string;

  @Column({ default: 0 })
  position!: number;

  @Column({ default: true })
  status!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
