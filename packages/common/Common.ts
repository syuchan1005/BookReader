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

export const availableImageExtensionWithContentType = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
} as const;

type AvailableImageExtensionType = keyof typeof availableImageExtensionWithContentType;

export const defaultStoredImageExtension: AvailableImageExtensionType = 'webp';

// @ts-ignore
export const availableImageExtensions: AvailableImageExtensionType[] = Object
  .keys(availableImageExtensionWithContentType);

// @ts-ignore
export const optionalImageExtensions: AvailableImageExtensionType[] = Object
  .keys(availableImageExtensionWithContentType)
  .filter((imageType) => imageType !== defaultStoredImageExtension);
