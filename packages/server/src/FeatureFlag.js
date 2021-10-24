// eslint-disable-next-line @typescript-eslint/no-unused-vars
function value(rawValue/* string | undefined */, defaultValue/* unknown */) {
  if (typeof defaultValue === 'boolean') {
    return rawValue === 'true';
  }
  if (typeof defaultValue === 'string') {
    return rawValue || defaultValue;
  }
  return rawValue;
}

const FeatureFlag = {};

module.exports = { FeatureFlag };
