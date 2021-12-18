import db, { Read } from '@client/indexedDb/Database';
import { ApolloClient } from '@apollo/client';
import {
  ReadListQueryVariables,
  ReadListDocument,
  ReadListQuery,
  PutReadListMutationVariables,
  PutReadListDocument,
  PutReadListMutation,
} from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

/**
 * @returns {Promise<Read[]>} dirty reads
 */
const migrate = async (serverReads: Array<Omit<Read, 'isDirty'>>): Promise<Read[]> => {
  const diffReads: { [bookId: string]: Read } = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const serverRead of serverReads) {
    /* eslint-disable no-await-in-loop */
    const localRead = await db.read.get(serverRead.bookId);
    if (!localRead || serverRead.updatedAt > localRead.updatedAt) {
      await db.read.put({
        infoId: serverRead.infoId,
        bookId: serverRead.bookId,
        page: serverRead.page,
        updatedAt: serverRead.updatedAt,
        isDirty: false,
      });
    } else if (serverRead.updatedAt < localRead.updatedAt) {
      diffReads[localRead.bookId] = localRead;
    }
    // else if (same) doNothing();
  }

  const serverReadBookIds = serverReads.map(({ bookId }) => bookId);
  const reads = (await db.read.getAllWithFilter(
    (read) => read.isDirty && !serverReadBookIds.includes(read.bookId),
  ))
    .reduce((map, read) => {
      // eslint-disable-next-line no-param-reassign
      map[read.bookId] = map[read.bookId] ?? read;
      return map;
    }, diffReads);
  return Object.values(reads);
};

export default async (
  apolloClient: ApolloClient<any>,
  accessToken: string,
) => {
  const revisions = await db.revision.getAll(1, {
    key: 'count',
    direction: 'prev',
  });
  const localLatestRevision = revisions[0];
  const {
    data: { readList: readListResult },
  } = await apolloClient.query<ReadListQuery, ReadListQueryVariables>({
    query: ReadListDocument,
    fetchPolicy: 'no-cache',
    variables: {
      revisionCount: localLatestRevision?.count,
    },
    context: {
      fetchOptions: {
        _headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  });
  if (readListResult && readListResult?.latestRevision?.count !== localLatestRevision?.count) {
    const serverRevision = readListResult.latestRevision;
    await db.revision.put({
      count: serverRevision.count,
      serverSyncedAt: new Date(parseInt(serverRevision.syncedAt, 10)),
      localSyncedAt: new Date(),
    });
  }
  const serverReads = (readListResult?.readList || []).map(({
    updatedAt,
    ...read
  }) => ({
    ...read,
    updatedAt: new Date(parseInt(updatedAt, 10)),
  }));

  const changeReads = await migrate(serverReads);
  if (changeReads.length === 0) {
    return true;
  }
  const {
    data: {
      putReadList: serverLatestRevision,
    },
  } = await apolloClient.query<PutReadListMutation, PutReadListMutationVariables>({
    query: PutReadListDocument,
    fetchPolicy: 'no-cache',
    variables: {
      readList: changeReads.map((read) => ({
        bookId: read.bookId,
        infoId: read.infoId,
        page: read.page,
        updatedAt: read.updatedAt.getTime().toString(),
      })),
    },
    context: {
      fetchOptions: {
        _headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  });
  await db.read.bulkUpdate((read) => ({ ...read, isDirty: false }));
  if (!readListResult || readListResult.latestRevision.count + 1 === serverLatestRevision.count) {
    await db.revision.put({
      count: serverLatestRevision.count,
      serverSyncedAt: new Date(parseInt(serverLatestRevision.syncedAt, 10)),
      localSyncedAt: new Date(),
    });
    return true;
  }
  return false;
};
