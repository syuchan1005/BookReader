import { BookId } from '@server/database/models/Book';
import { InputGenre } from '@server/database/models/Genre';

export type InfoId = string;

export type BookInfo = {
  id: InfoId;
  name: string;
  thumbnail: BookId | null; // default: null
  count: number; // default: 0
  history: boolean; // default: false
  createdAt: Date;
  updatedAt: Date;
};

export type SortableBookInfoProperties = 'name' | 'createdAt' | 'updatedAt';

export type BookInfoThumbnail = {
  bookId: BookId;
  pages: number;
  thumbnail: number;
};

export type BookInfoEditableValue = Partial<Pick<BookInfo, 'name' | 'thumbnail'>> & {
  genres?: Array<InputGenre>;
};

export type InputBookInfo = Required<Pick<BookInfo, 'name'>> & Partial<Omit<BookInfo, 'name'>> & {
  genres?: Array<InputGenre>;
};

export type InputBookHistory = Required<Pick<BookInfo, 'name' | 'count'>>;

export type InfoType = 'Normal' | 'History';
