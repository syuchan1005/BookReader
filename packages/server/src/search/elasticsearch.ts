import { Client } from '@elastic/elasticsearch';
import { BookDataManager } from '../database/BookDataManager';

interface BookInfoIndexEntity {
  id: string;
  infoName: string;
  createdAt: Date;
  updatedAt: Date;
  genres: {
    name: string;
    isInvisible: boolean;
  }[];
}

export class ElasticSearchClient {
  private client: Client | undefined;

  private index: string = 'book-reader';

  async init(): Promise<void> {
    this.index = process.env.BOOKREADER_ELASTICSEARCH_INDEX || 'book-reader';
    const node = process.env.BOOKREADER_ELASTICSEARCH_NODE;
    try {
      const client = new Client({ node });
      const isHealthy = await client.cluster.health()
        .then(() => true)
        .catch(() => false);

      if (isHealthy) {
        this.client = client;
      }
      // eslint-disable-next-line no-empty
    } catch (ignored) {
    }
  }

  isAvailable(): boolean {
    return !!this.client;
  }

  async rebuildBookIndex() {
    if (!this.client) {
      return;
    }
    const bookInfos: BookInfoIndexEntity[] = await BookDataManager.Debug.getBookInfos()
      .then((res) => res.map((bookInfo) => ({
        id: bookInfo.id,
        infoName: bookInfo.name,
        createdAt: bookInfo.createdAt,
        updatedAt: bookInfo.updatedAt,
        genres: bookInfo.genres,
      })));
    await this.client.indices.delete({ index: this.index }, { ignore: [404] });
    await this.client.indices.create({
      index: this.index,
      settings: {
        index: {
          analysis: {
            analyzer: {
              default: {
                type: 'custom',
                char_filter: ['icu_normalizer'],
                tokenizer: 'kuromoji_tokenizer',
                filter: [
                  'kuromoji_baseform',
                  'kuromoji_part_of_speech',
                  'cjk_width',
                  'ja_stop',
                  'kuromoji_stemmer',
                  'lowercase',
                ],
              },
            },
          },
        },
      },
    }, { ignore: /* ignore exists */ [400] });
    await this.client.bulk<BookInfoIndexEntity>({
      refresh: true,
      operations: bookInfos.flatMap((doc) => [{ index: { _index: this.index } }, doc]),
    });
  }

  async addBookInfo(infoId: string) {
    if (!this.client) {
      return;
    }
    const bookInfo = await BookDataManager.Debug.getBookInfo(infoId);
    if (!bookInfo) {
      return;
    }
    await this.client.bulk<BookInfoIndexEntity>({
      refresh: true,
      operations: [
        { index: { _index: this.index } },
        {
          id: bookInfo.id,
          infoName: bookInfo.name,
          createdAt: bookInfo.createdAt,
          updatedAt: bookInfo.updatedAt,
          genres: bookInfo.genres,
        },
      ],
    });
  }

  async removeBookInfo(infoId: string) {
    if (!this.client) {
      return;
    }
    await this.client.deleteByQuery({
      index: this.index,
      query: {
        match: {
          id: infoId,
        },
      },
    });
  }

  /**
   * Returns the list of infoId.
   */
  async search(query: string, genres: string[], limit: number): Promise<string[]> {
    const nameQuery = query ? [{
      match: {
        infoName: query,
      },
    }] : [];
    const result = await this.client.search<BookInfoIndexEntity>({
      index: this.index,
      size: limit,
      query: {
        bool: {
          must: nameQuery,
          should: genres.map((genre) => ({
            match: {
              'genres.name.keyword': genre,
            },
          })),
        },
      },
      _source: ['id'],
    });
    // eslint-disable-next-line no-underscore-dangle
    return result.hits.hits.map((h) => h._source.id);
  }
}

export const elasticSearchClient = new ElasticSearchClient();
