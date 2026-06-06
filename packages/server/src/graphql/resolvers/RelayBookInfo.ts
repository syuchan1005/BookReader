import {
  BookDataManager,
  type SortKey,
} from '@server/database/BookDataManager';
import { elasticSearchClient, meiliSearchClient } from '@server/search';
import {
  type BookInfo as BookInfoGQLModel,
  BookInfoOrder,
  type BookInfoPartialList,
  type BookInfosOption,
  type QueryRelayBookInfosArgs,
  type Resolvers,
  SearchMode,
} from '@syuchan1005/book-reader-graphql';

const DefaultOptions: BookInfosOption = {
  search: undefined,
  searchMode: SearchMode.Database,
  genres: [],
  order: BookInfoOrder.UpdateNewest,
};

const getCursor = (
  order: BookInfoOrder,
  before?: string,
  after?: string,
):
  | {
      cursorKey: 'name';
      sqlOrder: SortKey;
      before?: string;
      after?: string;
    }
  | {
      cursorKey: 'createdAt' | 'updatedAt';
      sqlOrder: SortKey;
      before?: number;
      after?: number;
    } => {
  let sqlOrder: SortKey;
  switch (order) {
    case BookInfoOrder.UpdateOldest:
    case BookInfoOrder.AddOldest:
    case BookInfoOrder.NameAsc:
      sqlOrder = 'asc';
      break;
    case BookInfoOrder.UpdateNewest:
    case BookInfoOrder.AddNewest:
    case BookInfoOrder.NameDesc:
      sqlOrder = 'desc';
      break;
    default: {
      const _exhaustiveCheck: never = order;
      return _exhaustiveCheck;
    }
  }
  switch (order) {
    case BookInfoOrder.UpdateOldest:
    case BookInfoOrder.UpdateNewest: {
      const convertedBefore = before ? parseInt(before, 10) : undefined;
      const convertedAfter = after ? parseInt(after, 10) : undefined;
      return {
        cursorKey: 'updatedAt',
        sqlOrder,
        before: convertedBefore,
        after: convertedAfter,
      };
    }
    case BookInfoOrder.AddNewest:
    case BookInfoOrder.AddOldest: {
      const convertedBefore = before ? parseInt(before, 10) : undefined;
      const convertedAfter = after ? parseInt(after, 10) : undefined;
      return {
        cursorKey: 'createdAt',
        sqlOrder,
        before: convertedBefore,
        after: convertedAfter,
      };
    }
    case BookInfoOrder.NameAsc:
    case BookInfoOrder.NameDesc: {
      return { cursorKey: 'name', sqlOrder, before, after };
    }
    default: {
      const _exhaustiveCheck: never = order;
      return _exhaustiveCheck;
    }
  }
};

const searchBookInfosByDB = async ({
  first,
  after: argAfter,
  last,
  before: argBefore,
  option = DefaultOptions,
}: Partial<QueryRelayBookInfosArgs>) => {
  const { search, genres, order: bookInfoOrder } = option;

  const cursor = getCursor(bookInfoOrder, argBefore, argAfter);
  let paginationWhere: [typeof cursor.before, typeof cursor.after] | undefined;
  if (cursor.after === undefined && cursor.before === undefined) {
    paginationWhere = undefined;
  } else if (cursor.after !== undefined && cursor.before !== undefined) {
    paginationWhere = [cursor.after, cursor.before];
  } else {
    if (cursor.sqlOrder === 'asc') {
      paginationWhere = [cursor.after, cursor.before];
    } else {
      paginationWhere = [cursor.before, cursor.after];
    }
  }

  const bookInfos = await BookDataManager.getBookInfos({
    limit: first !== undefined ? first + 1 : undefined,
    filter: {
      genres,
      name: {
        include: search,
        between:
          cursor.cursorKey === 'name' ? (paginationWhere as any) : undefined,
      },
      ...(cursor.cursorKey !== 'name'
        ? {
            [cursor.cursorKey]: paginationWhere,
          }
        : undefined),
    },
    sort: [[cursor.cursorKey, cursor.sqlOrder]],
  });
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
      cursor: bookInfo[cursor.cursorKey],
      node: bookInfo as unknown as BookInfoGQLModel,
    })),
    pageInfo: {
      hasNextPage: bookInfos.length > first,
      hasPreviousPage: false, // TODO: actual value
      startCursor: edges[0]?.[cursor.cursorKey] ?? '',
      endCursor: edges[edges.length - 1]?.[cursor.cursorKey] ?? '',
    },
  } as BookInfoPartialList;
};

const searchBookInfosByMeiliSearch = async ({
  first,
  option = DefaultOptions,
}: Partial<QueryRelayBookInfosArgs>) => {
  const infoIds = await meiliSearchClient.search(
    option.search,
    option.genres,
    first,
  );
  const bookInfos = await BookDataManager.getBookInfosFromIds(infoIds);
  return {
    edges: bookInfos.map((bookInfo) => ({
      cursor: bookInfo.name,
      node: bookInfo as unknown as BookInfoGQLModel,
    })),
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: bookInfos[0]?.name ?? '',
      endCursor: bookInfos[bookInfos.length - 1]?.name ?? '',
    },
  } as BookInfoPartialList;
};

const searchBookInfosByElasticSearch = async ({
  first,
  option = DefaultOptions,
}: Partial<QueryRelayBookInfosArgs>) => {
  const infoIds = await elasticSearchClient.search(
    option.search,
    option.genres,
    first,
  );
  const bookInfos = await BookDataManager.getBookInfosFromIds(infoIds);
  return {
    edges: bookInfos.map((bookInfo) => ({
      cursor: bookInfo.name,
      node: bookInfo as unknown as BookInfoGQLModel,
    })),
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: bookInfos[0]?.name ?? '',
      endCursor: bookInfos[bookInfos.length - 1]?.name ?? '',
    },
  } as BookInfoPartialList;
};

export const resolvers: Resolvers = {
  Query: {
    relayBookInfos: ((_parent, args: QueryRelayBookInfosArgs) => {
      const searchMode = (args.option || DefaultOptions).searchMode;
      switch (searchMode) {
        case SearchMode.Meilisearch:
          if (args.option.search && meiliSearchClient.isAvailable()) {
            return searchBookInfosByMeiliSearch(args);
          }
          break;
        case SearchMode.Elasticsearch:
          if (args.option.search && elasticSearchClient.isAvailable()) {
            return searchBookInfosByElasticSearch(args);
          }
          break;
        case SearchMode.Database:
          return searchBookInfosByDB(args);
        default: {
          const _exhaustiveCheck: never = searchMode;
          return _exhaustiveCheck;
        }
      }
      throw Error('Unknown searchMode');
    }) as any,
  },
};
