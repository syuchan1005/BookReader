import { SubjectId } from '@server/database/models/SubjectId';
import { InfoId } from '@server/database/models/BookInfo';
import { BookId } from '@server/database/models/Book';

export type Read = {
  subjectId: SubjectId;
  infoId: InfoId;
  bookId: BookId;
  page: number;
  updatedAt: Date;
};
