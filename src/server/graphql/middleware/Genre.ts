import GenreModel from '@server/sequelize/models/Genre';
import GQLMiddleware from '../GQLMiddleware';
import { QueryResolvers } from '@common/GQLTypes';

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
