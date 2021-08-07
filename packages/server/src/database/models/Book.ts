import { InfoId } from './BookInfo';

export type BookId = string;

export type Book = {
  id: BookId;
  thumbnailPage: number; // default: 0
  number: string;
  pageCount: number;
  infoId: InfoId;
  createdAt: Date
  updatedAt: Date
};

export type BookEditableValue = Partial<Pick<Book, 'thumbnailPage' | 'number' | 'pageCount'>>;

type BookRequiredProps = 'number' | 'pageCount' | 'infoId';
export type InputBook = Pick<Book, BookRequiredProps> & Partial<Omit<Book, BookRequiredProps>>;
