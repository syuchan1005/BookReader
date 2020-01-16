import GenreModel from '@server/sequelize/models/Genre';
import { QueryResolvers } from '@common/GQLTypes';
import GQLMiddleware from '../GQLMiddleware';

class Genre extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query(): QueryResolvers {
    return {
      genres: () => GenreModel.findAll().then((genres) => genres.map((g) => g.name)),
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export default Genre;
