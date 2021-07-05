import GQLMiddleware from '@server/graphql/GQLMiddleware';
import {
  QueryResolvers,
  BookInfosOption,
  BookInfoOrder,
  HistoryType,
} from '@syuchan1005/book-reader-graphql';
import BookInfoModel from '@server/sequelize/models/BookInfo';
import Sequelize, { Op } from 'sequelize';
import GenreModel from '@server/sequelize/models/Genre';
import BookModel from '@server/sequelize/models/Book';
import ModelUtil from '@server/ModelUtil';

const DefaultOptions: BookInfosOption = {
  search: undefined,
  genres: [],
  history: HistoryType.All,
  order: BookInfoOrder.UpdateNewest,
};

type WhereValue = string | number | undefined;
type SQLOrder = 'asc' | 'desc';

const getCursor = (
  order: BookInfoOrder,
  before?: string,
  after?: string,
): [
  cursorKey: keyof BookInfoModel,
  sqlOrder: SQLOrder,
  beforeValue: WhereValue,
  afterValue: WhereValue,
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
      cursor = 'name';
      break;
    default:
      cursor = 'id';
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
  let convertedBefore: WhereValue = before;
  let convertedAfter: WhereValue = after;
  switch (order) {
    case BookInfoOrder.UpdateOldest:
    case BookInfoOrder.UpdateNewest:
    case BookInfoOrder.AddNewest:
    case BookInfoOrder.AddOldest:
      convertedBefore = before ? parseInt(before, 10) : undefined;
      convertedAfter = after ? parseInt(after, 10) : undefined;
      break;
    default:
    case BookInfoOrder.NameAsc:
    case BookInfoOrder.NameDesc:
      break; // string
  }
  return [cursor, sqlOrder, convertedBefore, convertedAfter];
};

class RelayBookInfo extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query(): QueryResolvers {
    return {
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
        let whereHistory: boolean | undefined;
        switch (history) {
          default:
          case HistoryType.All:
            whereHistory = undefined;
            break;
          case HistoryType.HisotryOnly:
            whereHistory = true;
            break;
          case HistoryType.NormalOnly:
            whereHistory = false;
            break;
        }
        const whereId = genres.length === 0
          ? {
            [Op.notIn]: Sequelize.literal('('
              + 'SELECT DISTINCT infoId FROM infoGenres INNER JOIN genres g on infoGenres.genreId = g.id WHERE invisible == 1'
              + ')'),
          }
          : {
            [Op.in]: Sequelize.literal('('
              // @ts-ignore
              + `SELECT DISTINCT infoId FROM infoGenres INNER JOIN genres g on infoGenres.genreId = g.id WHERE name in (${genres.map((g) => `'${g}'`).join(', ')})` // TODO: escape
              + ')'),
          };
        const whereName = search ? {
          [Op.like]: `%${search}%`,
        } : undefined;
        const [cursorKey, sqlOrder, before, after] = getCursor(bookInfoOrder, argBefore, argAfter);
        const paginationWhere = {};
        if (after !== undefined && before !== undefined) {
          const start = sqlOrder === 'asc' ? after : before;
          const end = sqlOrder === 'asc' ? before : after;
          paginationWhere[cursorKey] = {
            [Op.between]: [start, end],
          };
        } else if (after !== undefined) {
          const order = sqlOrder === 'asc' ? Op.gte : Op.lte;
          paginationWhere[cursorKey] = {
            [order]: after,
          };
        } else if (before !== undefined) {
          const order = sqlOrder === 'asc' ? Op.lte : Op.gte;
          paginationWhere[cursorKey] = {
            [order]: before,
          };
        }

        const bookInfos = await BookInfoModel.findAll({
          limit: first !== undefined ? first + 1 : undefined,
          order: [[cursorKey, sqlOrder]],
          where: Object.fromEntries(Object.entries({
            ...paginationWhere,
            history: whereHistory,
            id: whereId,
            name: whereName,
          }).filter((e) => e[1] !== undefined)),
          include: [
            {
              model: GenreModel,
              as: 'genres',
            },
            {
              model: BookModel,
              as: 'thumbnailBook',
            },
          ],
        });

        let edges = bookInfos;
        if (last !== undefined) {
          if (last < 0) {
            throw new Error('last less than 0');
          }
          if (edges.length >= last) {
            const padding = first !== undefined && edges.length > first ? 1 : 0;
            edges = edges
              .slice(edges.length - last - padding, edges.length - padding);
          }
        }

        return {
          edges: edges.map((data) => ({
            cursor: data[cursorKey],
            node: ModelUtil.bookInfo(data),
          })),
          pageInfo: {
            hasNextPage: bookInfos.length > first,
            hasPreviousPage: false, // TODO: actual value
            startCursor: edges[0][cursorKey],
            endCursor: edges[edges.length - 1][cursorKey],
          },
        };
      },
    };
  }
}

export default RelayBookInfo;
