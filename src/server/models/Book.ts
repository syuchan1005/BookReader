import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import BookInfo from './BookInfo';

@Entity()
export class Book extends BaseEntity {
  @PrimaryColumn()
  public id: string;

  @ManyToOne(() => BookInfo, (info) => info.books)
  public info: BookInfo;

  @Column()
  public thumbnail: string;

  @Column()
  public number: number;

  @Column()
  public pages: number;
}

export default Book;
