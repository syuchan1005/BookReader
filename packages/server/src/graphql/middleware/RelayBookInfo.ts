import GQLMiddleware from '@server/graphql/GQLMiddleware';
import {
  QueryResolvers,
  BookInfosOption,
  BookInfoOrder,
  HistoryType,
  BookInfo, BookInfo as BookInfoGQLModel,
} from '@syuchan1005/book-reader-graphql';
import { BookDataManager, SortKey } from '@server/database/BookDataManager';
import { InfoType } from '@server/database/models/BookInfo';
import { BookInfoResolveAttrs } from '@server/graphql/middleware/BookInfo';

const DefaultOptions: BookInfosOption = {
  search: undefined,
  genres: [],
  history: HistoryType.All,
  order: BookInfoOrder.UpdateNewest,
};

const getCursor = (
  order: BookInfoOrder,
  before?: string,
  after?: string,
): [
  cursorKey: 'name',
  sqlOrder: SortKey,
  beforeValue?: string,
  afterValue?: string,
] | [
  cursorKey: 'createdAt' | 'updatedAt',
  sqlOrder: SortKey,
  beforeValue?: number,
  afterValue?: number,
] => {
  let cursor;
  switch (order) {
    case BookInfoOrder.UpdateNewest:
    case BookInfoOrder.UpdateOldest:
      cursor = 'updatedAt';
      break;
    case BookInfoOrder.AddNewest:
    case BookInfoOrder.AddOldest:
      cursor = 'createdAt';
      break;
    default:
    case BookInfoOrder.NameAsc:
    case BookInfoOrder.NameDesc:
      cursor = 'name';
      break;
  }
  let sqlOrder;
  switch (order) {
    case BookInfoOrder.UpdateOldest:
    case BookInfoOrder.AddNewest:
    case BookInfoOrder.NameAsc:
      sqlOrder = 'asc';
      break;
    default:
    case BookInfoOrder.UpdateNewest:
    case BookInfoOrder.AddOldest:
    case BookInfoOrder.NameDesc:
      sqlOrder = 'desc';
      break;
  }
  switch (order) {
    case BookInfoOrder.UpdateOldest:
    case BookInfoOrder.UpdateNewest:
    case BookInfoOrder.AddNewest:
    case BookInfoOrder.AddOldest: {
      const convertedBefore = before ? parseInt(before, 10) : undefined;
      const convertedAfter = after ? parseInt(after, 10) : undefined;
      return [cursor, sqlOrder, convertedBefore, convertedAfter];
    }
    default:
    case BookInfoOrder.NameAsc:
    case BookInfoOrder.NameDesc:
      return [cursor, sqlOrder, before, after];
  }
};

class RelayBookInfo extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query(): QueryResolvers {
    return {
      // @ts-ignore
      relayBookInfos: async (_parent, {
        first,
        after: argAfter,
        last,
        before: argBefore,
        option = DefaultOptions,
      }) => {
        const {
          search,
          genres,
          history,
          order: bookInfoOrder,
        } = option;

        let infoType: InfoType;
        switch (history) {
          default:
          case HistoryType.All:
            infoType = undefined;
            break;
          case HistoryType.HistoryOnly:
            infoType = 'History';
            break;
          case HistoryType.NormalOnly:
            infoType = 'Normal';
            break;
        }
        const [cursorKey, sqlOrder, before, after] = getCursor(bookInfoOrder, argBefore, argAfter);
        let paginationWhere;
        if (after === undefined && before === undefined) {
          paginationWhere = undefined;
        } else if (after !== undefined && before !== undefined) {
          paginationWhere = [after, before];
        } else {
          paginationWhere = [after, before];
          if (sqlOrder === 'desc') {
            paginationWhere = paginationWhere.reverse();
          }
        }

        const bookInfos = (await BookDataManager.getBookInfos({
          limit: first !== undefined ? first + 1 : undefined,
          filter: {
            infoType,
            genres,
            name: {
              include: search,
              between: (cursorKey === 'name') ? paginationWhere : undefined,
            },
            ...(cursorKey !== 'name' ? {
              [cursorKey]: paginationWhere,
            } : undefined),
          },
          sort: [[cursorKey, sqlOrder]],
        })).map((bookInfo) => ({
          ...bookInfo,
          createdAt: `${bookInfo.createdAt.getTime()}`,
          updatedAt: `${bookInfo.updatedAt.getTime()}`,
        }));

        let edges = bookInfos;
        if (first !== undefined) {
          if (first < 0) {
            throw new Error('first less than 0');
          }
          if (edges.length >= first) {
            edges = edges.slice(0, first);
          }
        }
        if (last !== undefined) {
          if (last < 0) {
            throw new Error('last less than 0');
          }
          if (edges.length >= last) {
            edges = edges.slice(edges.length - last, edges.length);
          }
        }

        return {
          edges: edges.map((bookInfo) => ({
            cursor: bookInfo[cursorKey],
            node: {
              ...bookInfo,
              count: bookInfo.bookCount,
              history: bookInfo.isHistory,
            } as Omit<BookInfoGQLModel, BookInfoResolveAttrs>,
          })),
          pageInfo: {
            hasNextPage: bookInfos.length > first,
            hasPreviousPage: false, // TODO: actual value
            startCursor: edges[0]?.[cursorKey] ?? '',
            endCursor: edges[edges.length - 1]?.[cursorKey] ?? '',
          },
        };
      },
    };
  }
}

export default RelayBookInfo;
