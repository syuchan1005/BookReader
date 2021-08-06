export type Genre = {
  id: number;
  name: string;
  invisible: boolean;
};

export type InputGenre = {
  id?: number;
  name: string;
  invisible?: boolean; // default: false
};
