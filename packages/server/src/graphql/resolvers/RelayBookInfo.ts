import {
  BookInfosOption,
  BookInfoOrder,
  SearchMode,
  QueryRelayBookInfosArgs,
  BookInfoPartialList,
  Resolvers,
  BookInfo as BookInfoGQLModel,
} from '@syuchan1005/book-reader-graphql';
import { BookDataManager, SortKey } from '@server/database/BookDataManager';
import { meiliSearchClient, elasticSearchClient } from '@server/search';

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
    case BookInfoOrder.NameAsc:
    case BookInfoOrder.NameDesc:
    default:
      cursor = 'name';
      break;
  }
  let sqlOrder;
  switch (order) {
    case BookInfoOrder.UpdateOldest:
    case BookInfoOrder.AddOldest:
    case BookInfoOrder.NameAsc:
      sqlOrder = 'asc';
      break;
    case BookInfoOrder.UpdateNewest:
    case BookInfoOrder.AddNewest:
    case BookInfoOrder.NameDesc:
    default:
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
    case BookInfoOrder.NameAsc:
    case BookInfoOrder.NameDesc:
    default:
      return [cursor, sqlOrder, before, after];
  }
};

const searchBookInfosByDB = async ({
  first,
  after: argAfter,
  last,
  before: argBefore,
  option = DefaultOptions,
}: Partial<QueryRelayBookInfosArgs>) => {
  const {
    search,
    genres,
    order: bookInfoOrder,
  } = option;

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
      // @ts-ignore https://github.com/dotansimha/graphql-code-generator/issues/3131
      node: bookInfo as BookInfoGQLModel,
    })),
    pageInfo: {
      hasNextPage: bookInfos.length > first,
      hasPreviousPage: false, // TODO: actual value
      startCursor: edges[0]?.[cursorKey] ?? '',
      endCursor: edges[edges.length - 1]?.[cursorKey] ?? '',
    },
  } as BookInfoPartialList;
};

const searchBookInfosByMeiliSearch = async ({
  first,
  option = DefaultOptions,
}: Partial<QueryRelayBookInfosArgs>) => {
  const infoIds = await meiliSearchClient.search(option.search, option.genres, first);
  const bookInfos = await BookDataManager.getBookInfosFromIds(infoIds);
  return {
    edges: bookInfos.map((bookInfo) => ({
      cursor: bookInfo.name,
      // @ts-ignore https://github.com/dotansimha/graphql-code-generator/issues/3131
      node: bookInfo as BookInfoGQLModel,
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
  const infoIds = await elasticSearchClient.search(option.search, option.genres, first);
  const bookInfos = await BookDataManager.getBookInfosFromIds(infoIds);
  return {
    edges: bookInfos.map((bookInfo) => ({
      cursor: bookInfo.name,
      // @ts-ignore https://github.com/dotansimha/graphql-code-generator/issues/3131
      node: bookInfo as BookInfoGQLModel,
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
    // @ts-ignore https://github.com/dotansimha/graphql-code-generator/issues/3131
    relayBookInfos: (_parent, args) => {
      // eslint-disable-next-line default-case
      switch ((args.option || DefaultOptions).searchMode) {
        case SearchMode.Meilisearch:
          if (args.option.search && meiliSearchClient.isAvailable()) {
            return searchBookInfosByMeiliSearch(args);
          }
        // eslint-disable-next-line no-fallthrough
        case SearchMode.Elasticsearch:
          if (args.option.search && elasticSearchClient.isAvailable()) {
            return searchBookInfosByElasticSearch(args);
          }
        // eslint-disable-next-line no-fallthrough
        case SearchMode.Database:
          return searchBookInfosByDB(args);
      }
      throw Error('Unknown searchMode');
    },
  },
};
