import MiniSearch from 'minisearch';
import { BookDataManager } from '../database/BookDataManager';

interface BookInfoIndexEntity {
  id: string;
  infoName: string;
  genres: string[];
  invisibleGenres: string[];
}

function hiraganaToKatakana(src: string): string {
  return src.replace(/[\u3041-\u3096]/g, (match) => {
    const chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
}

function normalizeText(text: string): string {
  let normalized = text.normalize('NFKC');
  normalized = hiraganaToKatakana(normalized);
  // Normalize wave dashes: ~ (0x7e), ～ (0xff5e), 〜 (0x301c) to ～
  normalized = normalized.replace(/[~〜]/g, '～');
  return normalized.toLowerCase();
}

export class SearchClient {
  private miniSearch: MiniSearch<BookInfoIndexEntity> | undefined;
  private readonly segmenter = new Intl.Segmenter('ja', { granularity: 'word' });

  async init(): Promise<void> {
    this.miniSearch = new MiniSearch<BookInfoIndexEntity>({
      fields: ['infoName', 'genres'],
      storeFields: ['id', 'infoName', 'genres', 'invisibleGenres'],
      processTerm: (term) => {
        if (!term) return null;
        return normalizeText(term);
      },
      tokenize: (text) => {
        const tokens: string[] = [];
        for (const segment of this.segmenter.segment(text)) {
          if (segment.isWordLike) {
            tokens.push(segment.segment);
          }
        }
        return tokens;
      },
      searchOptions: {
        boost: { infoName: 2 },
        prefix: true,
        fuzzy: 0.2,
      },
    });

    await this.rebuildBookIndex();
  }

  isAvailable(): boolean {
    return !!this.miniSearch;
  }

  async rebuildBookIndex() {
    if (!this.miniSearch) {
      return;
    }
    this.miniSearch.removeAll();

    const bookInfos = await BookDataManager.getBookInfosForSearch();
    const entities: BookInfoIndexEntity[] = bookInfos.map((bookInfo) => ({
      id: bookInfo.id,
      infoName: bookInfo.name,
      genres: bookInfo.genres.map((g) => g.name),
      invisibleGenres: bookInfo.genres.filter((g) => g.isInvisible).map((g) => g.name),
    }));

    this.miniSearch.addAll(entities);
  }

  async addBookInfo(infoId: string) {
    if (!this.miniSearch) {
      return;
    }
    const bookInfo = await BookDataManager.getBookInfoForSearch(infoId);
    if (!bookInfo) {
      return;
    }

    if (this.miniSearch.has(bookInfo.id)) {
      this.miniSearch.discard(bookInfo.id);
    }

    this.miniSearch.add({
      id: bookInfo.id,
      infoName: bookInfo.name,
      genres: bookInfo.genres.map((g) => g.name),
      invisibleGenres: bookInfo.genres.filter((g) => g.isInvisible).map((g) => g.name),
    });
  }

  async removeBookInfo(infoId: string) {
    if (!this.miniSearch) {
      return;
    }
    if (this.miniSearch.has(infoId)) {
      this.miniSearch.discard(infoId);
    }
  }

  /**
   * Returns the list of infoIds.
   */
  async search(
    query: string,
    genres: string[],
    limit?: number,
  ): Promise<string[]> {
    if (!this.miniSearch) {
      return [];
    }

    const searchOptions: any = {};
    const filterGenres = genres || [];
    searchOptions.filter = (result: BookInfoIndexEntity) => {
      const matchesFilter = filterGenres.every((g) => result.genres.includes(g));
      if (!matchesFilter) return false;

      const invisibleGenres = result.invisibleGenres || [];
      return invisibleGenres.every((g) => filterGenres.includes(g));
    };

    const results = this.miniSearch.search(query, searchOptions);
    const ids = results.map((r) => r.id);
    return limit !== undefined ? ids.slice(0, limit) : ids;
  }
}

export const searchClient = new SearchClient();
