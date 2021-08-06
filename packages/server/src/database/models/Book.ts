import { InfoId } from './BookInfo';

export type BookId = string;

export type Book = {
  id: BookId;
  thumbnail: number; // default: 0
  number: string;
  pages: number;
  infoId: InfoId;
  createdAt: Date
  updatedAt: Date
};

export type BookEditableValue = Partial<Pick<Book, 'thumbnail' | 'number' | 'pages'>>;
