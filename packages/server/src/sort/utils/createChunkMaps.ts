import type { ChunkMaps } from '../types';
import createChunks from './createChunks';
import createChunkMap from './createChunkMap';

const createChunkMaps = (value: string, customChunkString?: string[]): ChunkMaps => {
  const chunksMaps = createChunks(value, customChunkString).map((c, i, cs) => createChunkMap(c, i, cs, customChunkString));
  return chunksMaps;
};

export default createChunkMaps;