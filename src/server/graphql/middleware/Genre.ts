import GenreModel from '@server/sequelize/models/Genre';
import InfoGenreModel from '@server/sequelize/models/InfoGenre';
import {
  QueryResolvers,
  MutationResolvers,
  MutationEditGenreArgs,
  ResolversTypes,
} from '@common/GQLTypes';
import GQLMiddleware from '@server/graphql/GQLMiddleware';
import Database from '@server/sequelize/models';
import { createError } from '@server/Errors';
import { defaultGenres } from '../../../common/Common';

class Genre extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query(): QueryResolvers {
    return {
      genres: () => GenreModel.findAll() as unknown as ResolversTypes['Genre'][],
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
      editGenre: async (parent, argz) => {
        const args: Partial<MutationEditGenreArgs> = Object.fromEntries(Object.entries(argz)
          .filter((e) => e[1] !== undefined));
        if (Object.keys(args).length <= 1) {
          return createError('Unknown', 'must be args');
        }
        const isDefault = defaultGenres.includes(args.oldName);
        if (isDefault && !args.newName) {
          return createError('QL0010');
        }

        const genreModel = await GenreModel.findOne({
          where: { name: args.oldName },
        });
        if (!genreModel) return createError('QL0008');
        if (!args.newName && genreModel.invisible === args.invisible) return createError('Unknown', 'must be change args');

        let newGenreModel = (args.newName)
          ? (
            await GenreModel.findOne({
              where: { name: args.newName },
            }))
          : undefined;
        if (args.newName && newGenreModel) {
          return createError('QL0011');
        }
        try {
          if (isDefault) {
            await Database.sequelize.transaction(async (transaction) => {
              newGenreModel = await GenreModel.create({
                name: args.newName,
                invisible: args.invisible || false,
              }, {
                transaction,
              });
              await InfoGenreModel.update({ genreId: newGenreModel.id }, {
                where: { genreId: genreModel.id },
                transaction,
              });
            });
          } else {
            await GenreModel.update({
              name: args.newName || genreModel.name,
              invisible: args.invisible ?? genreModel.invisible,
            }, {
              where: { id: genreModel.id },
            });
          }
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
