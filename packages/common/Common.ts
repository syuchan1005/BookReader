// eslint-disable-next-line import/prefer-default-export
export const archiveTypes: { [key: string]: 'zip' | 'rar' } = {
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/x-rar-compressed': 'rar',
};

export const defaultGenres = [
  'Invisible',
  'Completed',
];

export const ImageHeader = {
  width: 'x-book-reader-width',
  height: 'x-book-reader-height',
  cache: 'x-book-reader-cache', // default=false
};

export const defaultTitle = 'Book Reader';
