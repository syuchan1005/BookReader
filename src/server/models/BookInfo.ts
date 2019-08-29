import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import Book from './Book';

@Entity()
export class BookInfo extends BaseEntity {
  @PrimaryColumn()
  public id: string;

  @Column()
  public name: string;

  @Column()
  public thumbnail: string;

  @OneToMany(() => Book, (book) => book.info)
  public books: Book[];

  public static newInstance(id: string, name: string, thumbnail?: string): BookInfo {
    const bookInfo = new BookInfo();
    bookInfo.id = id;
    bookInfo.name = name;
    bookInfo.thumbnail = thumbnail || '';
    bookInfo.books = [];
    return bookInfo;
  }
}

export default BookInfo;
