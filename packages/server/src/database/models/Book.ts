import { Id } from './Id';
import { InfoId } from './BookInfo';

export type BookId = Id;

export type Book = {
  id: BookId;
  thumbnailPage: number; // default: 0
  number: string;
  pageCount: number;
  infoId: InfoId;
  createdAt: Date
  updatedAt: Date
};

export type SortableBookProperties = 'updatedAt';

export type BookEditableValue = Partial<Pick<Book, 'thumbnailPage' | 'number' | 'pageCount'>>;

type BookRequiredProps = 'number' | 'pageCount' | 'infoId';
export type InputBook = Pick<Book, BookRequiredProps> &
  Partial<Omit<Book, BookRequiredProps | 'updatedAt'>>;
