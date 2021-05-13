import type { Order } from '../types';

const getOrders = (orders?: ReadonlyArray<Order> | Order): Array<Order> => {
  if (!orders) {
    return [];
  }

  const orderList = !Array.isArray(orders) ? [orders] : [...orders];

  if (
    orderList.some(
      order =>
        order !== 'asc' && order !== 'desc' && typeof order !== 'function',
    )
  ) {
    return [];
  }

  return orderList as Array<Order>;
};

export default getOrders;