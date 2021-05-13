import type { Chunk, Chunks, ChunkMap } from '../types';
import normalizeAlphaChunk from './normalizeAlphaChunk';
import normalizeNumericChunk from './normalizeNumericChunk';

const createChunkMap = (
  chunk: Chunk,
  index: number,
  chunks: Chunks,
  customChunkString?: string[],
): ChunkMap => ({
  parsedNumber: normalizeNumericChunk(chunk, index, chunks),
  normalizedString: normalizeAlphaChunk(chunk),
  isCustomChunk: customChunkString ? customChunkString.includes(chunk) : undefined,
});

export default createChunkMap;