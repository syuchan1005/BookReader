function value(rawValue/* string */, defaultValue/* unknown */) {
  if (typeof defaultValue === 'boolean') {
    return rawValue === 'true';
  }
  return rawValue;
}

const FeatureFlag = {
  useUlidForIds: false,
  prisma: {
    enable: value(process.env.BOOK_READER_DB, false),
    dbFileSuffix: '-p',
  },
};

module.exports = { FeatureFlag };
