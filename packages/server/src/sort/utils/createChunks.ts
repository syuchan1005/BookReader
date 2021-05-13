import { RE_NUMBERS } from './regex';

const createCustomChunkStringRegex = (values: string[]): RegExp => {
  const escapedValues = values
    .map((v: string) => v.replace(/[.*+?^=!:${}()|[\]\/\\]/g, '\\$&'))
    .join('|');
  return new RegExp(`(${escapedValues})`, 'g');
};

const createChunks = (value: string, customChunkString?: string[]): Array<string> => {
  const splitStrings = value
    .replace(RE_NUMBERS, '\0$1\0')
    .replace(/\0$/, '')
    .replace(/^\0/, '')
    .split(/\0/);

  if (customChunkString && Array.isArray(customChunkString) && customChunkString.length > 0) {
    const splitChunkRegexp = createCustomChunkStringRegex(customChunkString);
    return splitStrings.flatMap(s => s.split(splitChunkRegexp).filter(s => s.length > 0));
  }

  return splitStrings;
}

export default createChunks;