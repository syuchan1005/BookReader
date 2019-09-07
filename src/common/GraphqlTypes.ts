export interface BookInfo {
  infoId: string;
  name: string;
  thumbnail: string;
  count: number;
  books: Book[];
}

export interface SimpleBookInfo {
  infoId: string;
  name: string;
  thumbnail: string;
  count: number;
}

export interface Book {
  bookId: string;
  thumbnail: string;
  number: string;
  pages: number;
  // infoId: string;
  info: SimpleBookInfo;
}

export interface Result {
  success: boolean;
  code?: string;
  message?: string;
}
