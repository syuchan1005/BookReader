import { BookId } from '@server/database/models/Book';

export type InfoId = string;

export type BookInfo = {
  id: InfoId;
  name: string;
  thumbnail: BookId | null;
  count: number;
  history: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BookInfoThumbnail = {
  bookId: BookId;
  pages: number;
  thumbnail: number;
};
