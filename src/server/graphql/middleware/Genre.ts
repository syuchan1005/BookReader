import GenreModel from '@server/sequelize/models/Genre';
import GQLMiddleware from '../GQLMiddleware';

class Genre extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query() {
    return {
      genres: () => GenreModel.findAll().then((genres) => genres.map((g) => g.name)),
    };
  }
}

export default Genre;
