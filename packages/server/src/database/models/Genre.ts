export type GenreName = string;

export type Genre = {
  name: GenreName;
  isInvisible: boolean;
};

export type InputGenre = {
  name: string;
  isInvisible?: boolean; // default: false
};

export type GenreEditableValue = {
  name?: string;
  isInvisible?: boolean;
};

export type DeleteGenreError = 'DELETE_DEFAULT';
