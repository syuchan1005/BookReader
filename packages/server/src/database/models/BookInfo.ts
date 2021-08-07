import { BookId } from '@server/database/models/Book';
import { InputGenre } from '@server/database/models/Genre';

export type InfoId = string;

export type BookInfo = {
  id: InfoId;
  name: string;
  bookCount: number; // default: 0
  isHistory: boolean; // default: false
  createdAt: Date;
  updatedAt: Date;
};

export type SortableBookInfoProperties = 'name' | 'createdAt' | 'updatedAt';

export type BookInfoThumbnail = {
  bookId: BookId;
  pageCount: number;
  thumbnailPage: number;
};

export type BookInfoEditableValue = Partial<Pick<BookInfo, 'name'>> & {
  thumbnail?: BookId;
  genres?: Array<InputGenre>;
};

export type InputBookInfo = Required<Pick<BookInfo, 'name'>> & Partial<Omit<BookInfo, 'name'>> & {
  thumbnail?: BookId;
  genres?: Array<InputGenre>;
};

export type InputBookHistory = Required<Pick<BookInfo, 'name' | 'bookCount'>>;

export type InfoType = 'Normal' | 'History';
