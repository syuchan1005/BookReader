import { GQLMiddleware } from '@server/graphql/GQLPlugin';
import { MutationResolvers, QueryResolvers } from '@syuchan1005/book-reader-graphql';
import { BookDataManager } from '@server/database/BookDataManager';

class Read extends GQLMiddleware {
  Query(): QueryResolvers {
    return {
      readList: async (parent, { beforeRevisionCount }, { ctx }) => {
        const subjectId = ctx.state.user.sub;
        const revisionReads = await BookDataManager
          .getRevisionReads(subjectId, beforeRevisionCount);
        if (!revisionReads) {
          return undefined;
        }
        return {
          latestRevision: {
            count: revisionReads.revision.count,
            syncedAt: revisionReads.revision.syncedAt.getTime().toString(),
          },
          readList: revisionReads.readList.map((read) => ({
            bookId: read.bookId,
            infoId: read.infoId,
            page: read.page,
            updatedAt: read.updatedAt.getTime().toString(),
          })),
        };
      },
    };
  }

  Mutation(): MutationResolvers {
    return {
      putReadList: async (parent, { readList }, { ctx }) => {
        const subjectId = ctx.state.user.sub;
        const revision = await BookDataManager.addReads(
          subjectId,
          readList.map((read) => ({
            infoId: read.infoId,
            bookId: read.bookId,
            page: read.page,
            updatedAt: new Date(parseInt(read.updatedAt, 10)),
          })),
        );
        return {
          count: revision.count,
          syncedAt: revision.syncedAt.getTime().toString(),
        };
      },
    };
  }
}

export default Read;
