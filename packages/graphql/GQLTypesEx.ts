 import { Maybe, EditAction, EditType } from './generated/GQLTypes';

type Clean<T> = T;

type Merge<L, R> = Clean<{ [K in keyof L | keyof R]: (K extends keyof L ? L[K] : never) | (K extends keyof R ? R[K] : never) }>;

export type StrictEditAction =
    { [T in EditType]:
        Merge<
            { editType: T },
            { [L in Lowercase<T> & keyof EditAction]:
                EditAction[L] extends Maybe<infer A> | undefined
                ? A
                : never
            }
        >
    }[EditType];
