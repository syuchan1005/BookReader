export const asyncMap = async <T, E>(
  arr: Array<E>,
  transform: (e: E, index: number, array: Array<E>) => Promise<T>,
  reversed = false,
): Promise<T[]> => {
  const result = [];
  if (reversed) {
    for (let i = arr.length - 1; i >= 0; i -= 1) {
      result[i] = await transform(arr[i], i, arr);
    }
  } else {
    for (let i = 0; i < arr.length; i += 1) {
      result[i] = await transform(arr[i], i, arr);
    }
  }
  return result;
};
