export interface BookInfo {
  infoId: string;
  name: string;
  thumbnail: string;
  count: number;
  books: Book[];
}

export interface Book {
  bookId: string;
  info: BookInfo;
  thumbnail: string;
  number: number;
  pages: number;
}

export interface Result {
  success: boolean;
  message?: string;
}
