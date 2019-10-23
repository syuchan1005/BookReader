import GQLMiddleware from '@server/graphql/GQLMiddleware';

import os from 'os';
import { promises as fs, createWriteStream } from 'fs';

import uuidv4 from 'uuid/v4';
import rimraf from 'rimraf';

import { withFilter } from 'graphql-subscriptions';
import { SubscriptionKeys } from '@server/graphql';
import GQLUtil from '../GQLUtil';

class BookBatch extends GQLMiddleware {
  Mutation() {
    return {
      addCompressBookBatch: async (parent, { id, file }): Promise<string> => {
        const batchId = uuidv4();

        const type = await GQLUtil.checkArchiveType(file);
        if (type.success === false) {
          return null;
        }
        const { createReadStream, archiveType } = type;

        const tempPath = `${os.tmpdir()}/bookReader/${batchId}`;
        const filePath = `${tempPath}.${archiveType}`;

        await new Promise((resolve) => {
          const writable = createWriteStream(filePath);
          createReadStream()
            .pipe(writable)
            .on('finish', resolve);
        });

        GQLUtil.batchCompressFile(
          this.gm,
          this.pubsub,
          id,
          batchId,
          tempPath,
          { path: filePath, archiveType },
        ).then(() => {
          fs.unlink(filePath);
        }).catch((e) => {
          fs.unlink(filePath);
          new Promise((resolve) => rimraf(tempPath, resolve))
            .then(() => {
              this.pubsub.publish(SubscriptionKeys.ADD_BOOKS_BATCH, {
                id: batchId,
                addCompressBookBatch: {
                  finished: true,
                  error: e.toString(),
                },
              });
            });
        });

        return batchId;
      },
    };
  }

  Subscription() {
    return {
      addCompressBookBatch: {
        subscribe: withFilter(
          () => this.pubsub.asyncIterator([SubscriptionKeys.ADD_BOOKS_BATCH]),
          (payload, variables) => payload.id === variables.id,
        ),
      },
    };
  }
}

export default BookBatch;
