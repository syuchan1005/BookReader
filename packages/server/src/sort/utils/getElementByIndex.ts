const getElementByIndex = <T>(collection: ReadonlyArray<T>, index: number): T =>
  collection[index];

export default getElementByIndex;