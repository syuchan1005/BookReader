import GQLMiddleware from '@server/graphql/GQLMiddleware';

import os from 'os';

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
          return type;
        }
        const { createReadStream, archiveType } = type;

        const readStream = createReadStream();
        const buffer: Buffer = await new Promise((resolve, reject) => {
          const chunks = [];
          readStream.once('error', (err) => reject(err));
          readStream.once('end', () => resolve(Buffer.concat(chunks)));
          readStream.on('data', (c) => chunks.push(c));
        });

        const tempPath = `${os.tmpdir()}/bookReader/${batchId}`;
        GQLUtil.batchCompressFile(
          this.gm,
          this.pubsub,
          id,
          batchId,
          tempPath,
          { buffer, archiveType },
        ).catch((e) => {
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
