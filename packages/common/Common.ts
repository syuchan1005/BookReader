export const archiveTypes: { [key: string]: 'zip' | 'rar' } = {
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/x-rar-compressed': 'rar',
};

export const defaultGenres = ['Invisible', 'Completed'];

export const defaultTitle = 'Book Reader';

// Available image formats for delivery, ordered by delivery priority (best performance/compression first).
export const availableImageExtensionWithContentType = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
} as const;

export type AvailableImageExtensionType =
  keyof typeof availableImageExtensionWithContentType;

// The default format in which original images are saved on the server.
export const defaultStoredImageExtension: AvailableImageExtensionType = 'webp';

// Image extensions ordered by performance (priority).
export const availableImageExtensions: AvailableImageExtensionType[] =
  Object.keys(
    availableImageExtensionWithContentType,
  ) as AvailableImageExtensionType[];

export const optionalImageExtensions: AvailableImageExtensionType[] =
  availableImageExtensions.filter((imageType) => imageType !== defaultStoredImageExtension);

// Image extensions and MIME mapping supported for uploads (inputs).
// This includes 'png' which is allowed for upload but converted on save.
export const uploadSupportedExtensions = ['webp', 'jpg', 'jpeg', 'png'] as const;
export type UploadSupportedExtensionType = typeof uploadSupportedExtensions[number];

export const uploadSupportedExtensionToContentType: Record<UploadSupportedExtensionType, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

/**
 * Returns comma-separated MIME types for the file input's accept attribute.
 * Example: "image/webp,image/jpeg,image/png"
 */
export const getUploadAcceptMimeTypes = (): string => {
  return Object.values(uploadSupportedExtensionToContentType).join(',');
};

/**
 * Returns comma-separated MIME types and file extensions for the archive file input's accept attribute.
 * Example: "application/zip,application/x-zip-compressed,application/x-rar-compressed,.zip,.rar"
 */
export const getUploadAcceptArchiveTypes = (): string => {
  return `${Object.keys(archiveTypes).join(',')},${[
    ...new Set(Object.values(archiveTypes)),
  ]
    .map((a) => `.${a}`)
    .join(',')}`;
};

// Sharp format conversion options for each image type.
// You can adjust quality (1-100), effort (0-9 for AVIF CPU computation effort), etc.
export const sharpFormatOptions = {
  avif: {
    quality: 50,
    effort: 2, // Prioritize conversion speed for on-demand delivery (default: 4)
    chromaSubsampling: '4:4:4', // Prevent color bleeding on monochrome manga lineart & screen-tones
  },
  webp: {
    quality: 80,
  },
  jpg: {
    quality: 80,
  },
} as const;

