import GenreModel from '@server/sequelize/models/Genre';
import InfoGenreModel from '@server/sequelize/models/InfoGenre';
import { QueryResolvers, MutationResolvers } from '@common/GQLTypes';
import GQLMiddleware from '@server/graphql/GQLMiddleware';
import Database from '@server/sequelize/models';
import { createError } from '@server/Errors';
import { defaultGenres } from '../../../common/Common';

class Genre extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query(): QueryResolvers {
    return {
      genres: () => GenreModel.findAll().then((genres) => genres.map((g) => g.name)),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  Mutation(): MutationResolvers {
    return {
      deleteGenre: async (parent, { genre }) => {
        if (defaultGenres.includes(genre)) {
          return createError('QL0009');
        }
        const genreModel = await GenreModel.findOne({
          where: { name: genre },
        });
        if (!genreModel) {
          return createError('QL0008');
        }
        try {
          await Database.sequelize.transaction(async (transaction) => {
            await InfoGenreModel.destroy({
              where: { genreId: genreModel.id },
              transaction,
            });
            await genreModel.destroy({
              transaction,
            });
          });
        } catch (e) {
          return createError('Unknown', e);
        }
        return {
          success: true,
        };
      },
      editGenre: async (parent, { oldName, newName }) => {
        if (defaultGenres.includes(oldName)) {
          return createError('QL0010');
        }
        const genreModel = await GenreModel.findOne({
          where: { name: oldName },
        });
        if (!genreModel) return createError('QL0008');
        const newGenreModel = await GenreModel.findOne({
          where: { name: newName },
        });
        if (newGenreModel) return createError('QL0011');
        try {
          await GenreModel.update({ name: newName }, {
            where: { id: genreModel.id },
          });
        } catch (e) {
          return createError('Unknown', e);
        }
        return {
          success: true,
        };
      },
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export default Genre;
