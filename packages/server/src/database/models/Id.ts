import { v4 as uuidv4 } from 'uuid';
import { ulid } from 'ulid';

import { FeatureFlag } from '@server/FeatureFlag.js';

export const generateId = () => {
  if (FeatureFlag.useUlidForIds) {
    return ulid();
  }
  return uuidv4();
};

export type Id = string;
