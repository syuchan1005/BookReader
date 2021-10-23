/* eslint-disable func-names */
import DataLoader from 'dataloader';

const loaders: { [batchId: string]: DataLoader<any, any> } = {};

export function BatchLoading<I, R>(
  batchId: string,
  batchFn: (keys: Array<I>) => Promise<Array<R | undefined>>,
) {
  loaders[batchId] = new DataLoader(batchFn.bind(this));

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originFn = descriptor.value;
    // eslint-disable-next-line no-param-reassign
    descriptor.value = function (...args) {
      if (loaders[batchId]) {
        return loaders[batchId].load(args[0]);
      }
      return originFn.apply(this, args);
    };
  };
}

export function BatchLoadingClear<T>(
  batchId: string,
  selector: (args: T) => unknown = (a) => a[0],
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originFn = descriptor.value;
    // eslint-disable-next-line no-param-reassign
    descriptor.value = function (...args) {
      loaders[batchId]?.clear(selector(args as unknown as T));
      return originFn.apply(this, args);
    };
  };
}

/**
 * deprecate: Use [BatchLoadingClear] instead.
 */
export function BatchLoadingClearAll(batchId: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originFn = descriptor.value;
    // eslint-disable-next-line no-param-reassign
    descriptor.value = function (...args) {
      loaders[batchId]?.clearAll();
      return originFn.apply(this, args);
    };
  };
}
