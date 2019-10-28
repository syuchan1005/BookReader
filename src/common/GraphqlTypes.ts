export interface BookInfo {
  id: string;
  name: string;
  thumbnail: string;
  count: number;
  history: boolean;
  finished: boolean;
  invisible: boolean;
  books: Book[];
}

export interface Book {
  id: string;
  thumbnail: string;
  number: string;
  pages: number;
  // infoId: string;
  info: BookInfo;
}

export interface Result {
  success: boolean;
  code?: string;
  message?: string;
}

export interface ResultWithInfoId extends Result {
  infoId?: string;
}

export interface ResultWithBookResults extends Result {
  bookResults?: Result[];
}

export interface BookInfoResult {
  success: boolean;
  code?: string;
  message?: string;
  books: Book[];
}

export interface BookInfoList {
  length: number;
  infos: BookInfo[];
}
