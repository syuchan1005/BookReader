export type ShouldResolveKeys<G, D, Diff = Exclude<keyof G, keyof D>, keyofG = keyof G>
  = Exclude<(keyofG extends keyof G
  ? keyofG extends keyof D
    ? G[keyofG] extends D[keyofG]
      ? never
      : keyofG
    : keyofG
  : never) | Diff, '__typename'>;

// @ts-ignore
export type StrictResolver<G, D, R, K extends keyof R = ShouldResolveKeys<G, D>> =
  Required<Pick<R, K>> & Omit<R, K>;
