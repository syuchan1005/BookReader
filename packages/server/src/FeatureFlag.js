function value(rawValue/* string | undefined */, defaultValue/* unknown */) {
  if (typeof defaultValue === 'boolean') {
    return rawValue === 'true';
  }
  if (typeof defaultValue === 'string') {
    return rawValue || defaultValue;
  }
  return rawValue;
}

const FeatureFlag = {
  useUlidForIds: value(process.env.BOOK_READER_ULID, false),
  prisma: {
    dbFileSuffix: value(process.env.BOOK_READER_PRISMA_SUFFIX, '-p'),
  },
};

module.exports = { FeatureFlag };
