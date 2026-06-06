import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchClient } from '../search';
import { BookDataManager } from '../../database/BookDataManager';

vi.mock('../../database/BookDataManager', () => {
  return {
    BookDataManager: {
      getBookInfosForSearch: vi.fn(),
      getBookInfoForSearch: vi.fn(),
    },
  };
});

describe('SearchClient with invisible genres filter', () => {
  let searchClient: SearchClient;

  beforeEach(() => {
    searchClient = new SearchClient();
    vi.clearAllMocks();
  });

  it('should filter out books with invisible genres when no filters are selected', async () => {
    const mockBooks = [
      {
        id: 'book1',
        name: 'Visible Book',
        genres: [
          { name: 'Completed', isInvisible: false }
        ]
      },
      {
        id: 'book2',
        name: 'Invisible Book',
        genres: [
          { name: 'Invisible', isInvisible: true }
        ]
      },
      {
        id: 'book3',
        name: 'Mixed Book',
        genres: [
          { name: 'Completed', isInvisible: false },
          { name: 'Invisible', isInvisible: true }
        ]
      },
      {
        id: 'book4',
        name: 'No Genre Book',
        genres: []
      }
    ];

    vi.mocked(BookDataManager.getBookInfosForSearch).mockResolvedValue(mockBooks);

    await searchClient.init();

    // 1. Search with no genre filter: should find Visible Book and No Genre Book, but not Invisible or Mixed Books.
    const resultsAll = await searchClient.search('Book', []);
    expect(resultsAll).toContain('book1');
    expect(resultsAll).not.toContain('book2');
    expect(resultsAll).not.toContain('book3');
    expect(resultsAll).toContain('book4');

    // 2. Search with "Completed" filter: should find Visible Book, but not Mixed Book (because it contains "Invisible")
    const resultsCompleted = await searchClient.search('Book', ['Completed']);
    expect(resultsCompleted).toContain('book1');
    expect(resultsCompleted).not.toContain('book3');

    // 3. Search with "Invisible" filter: should find Invisible Book and Mixed Book
    const resultsInvisible = await searchClient.search('Book', ['Invisible']);
    expect(resultsInvisible).toContain('book2');
    expect(resultsInvisible).toContain('book3');

    // 4. Search with both "Completed" and "Invisible": should find Mixed Book
    const resultsBoth = await searchClient.search('Book', ['Completed', 'Invisible']);
    expect(resultsBoth).toContain('book3');
    expect(resultsBoth).not.toContain('book1');
    expect(resultsBoth).not.toContain('book2');
  });
});
