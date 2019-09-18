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

  nextBook?: string | null;
  prevBook?: string | null;
}

export interface Result {
  success: boolean;
  code?: string;
  message?: string;
}

export interface BookInfoResult {
  success: boolean;
  code?: string;
  message?: string;
  books: Book[];
}
