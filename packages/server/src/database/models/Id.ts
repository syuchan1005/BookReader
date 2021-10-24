import { ulid } from 'ulid';

export const generateId = () => ulid();

export type Id = string;
