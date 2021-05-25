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

export const defaultTitle = 'Book Reader';
