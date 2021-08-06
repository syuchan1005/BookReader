import {
  QueryResolvers,
  MutationResolvers,
} from '@syuchan1005/book-reader-graphql';
import GQLMiddleware from '@server/graphql/GQLMiddleware';

import { createError } from '@server/Errors';
import { BookDataManager, maybeRequireAtLeastOne } from '@server/database/BookDataManager';

class Genre extends GQLMiddleware {
  Query(): QueryResolvers {
    return {
      genres: () => BookDataManager.getGenres(),
    };
  }

  Mutation(): MutationResolvers {
    return {
      editGenre: async (_parent, {
        oldName: currentGenreName,
        newName,
        invisible,
      }) => {
        const editGenre = maybeRequireAtLeastOne({
          name: newName,
          invisible,
        });
        if (!editGenre) {
          return createError('QL0005');
        }

        const genreModel = await BookDataManager.getGenre(currentGenreName);
        if (!genreModel) {
          return createError('QL0008');
        }
        await BookDataManager.editGenre(currentGenreName, editGenre);
        return {
          success: true,
        };
      },
      deleteGenre: async (parent, { genre }) => {
        const error = await BookDataManager.deleteGenre(genre);
        if (error === 'DELETE_DEFAULT') {
          return createError('QL0009');
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
