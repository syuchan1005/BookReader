import { Resolvers } from '@syuchan1005/book-reader-graphql';
import { createError } from '@server/Errors';
import { BookDataManager, maybeRequireAtLeastOne } from '@server/database/BookDataManager';

export const resolvers: Resolvers = {
  Query: {
    genres: () => BookDataManager.getGenres()
      .then((genres) => genres.map((genre) => ({
        name: genre.name,
        invisible: genre.isInvisible,
      }))),
  },
  Mutation: {
    editGenre: async (_parent, {
      oldName: currentGenreName,
      newName,
      invisible,
    }) => {
      const editGenre = maybeRequireAtLeastOne({
        name: newName,
        isInvisible: invisible,
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
  },
};
