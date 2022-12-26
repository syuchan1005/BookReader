import { MeiliSearch } from 'meilisearch';
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

export class MeiliSearchClient {
  private client: MeiliSearch | undefined;

  private index: string = 'book-reader';

  async init(): Promise<void> {
    this.index = process.env.BOOKREADER_MEILISEARCH_INDEX || 'book-reader';
    const host = process.env.BOOKREADER_MEILISEARCH_HOST;
    const apiKey = process.env.BOOKREADER_MEILISEARCH_API_KEY;
    try {
      const client = new MeiliSearch({
        host,
        apiKey,
      });
      const isHealthy = await client.isHealthy()
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
    const bookInfoIndex = this.client.index(this.index);
    await bookInfoIndex.deleteAllDocuments();
    await bookInfoIndex.updateFilterableAttributes(['genres']);
    await bookInfoIndex.updateSearchableAttributes(['infoName']);
    await bookInfoIndex.addDocuments(bookInfos);
  }

  async addBookInfo(infoId: string) {
    if (!this.client) {
      return;
    }
    const bookInfo = await BookDataManager.Debug.getBookInfo(infoId);
    if (!bookInfo) {
      return;
    }
    await this.client.index<BookInfoIndexEntity>(this.index)
      .addDocuments([
        {
          id: bookInfo.id,
          infoName: bookInfo.name,
          createdAt: bookInfo.createdAt,
          updatedAt: bookInfo.updatedAt,
          genres: bookInfo.genres,
        },
      ]);
  }

  async removeBookInfo(infoId: string) {
    if (!this.client) {
      return;
    }
    await this.client.index(this.index)
      .deleteDocument(infoId);
  }

  /**
   * Returns the list of infoId.
   */
  async search(query: string, genres: string[], limit: number): Promise<string[]> {
    const result = await this.client.index(this.index)
      .search<BookInfoIndexEntity>(query, {
        limit,
        attributesToRetrieve: ['id'],
        filter: [genres.map((g) => `genres.name = ${g}`)],
      });
    return result.hits.map((h) => h.id);
  }
}

export const meiliSearchClient = new MeiliSearchClient();
