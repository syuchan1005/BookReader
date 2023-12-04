import { useApolloClient } from '@apollo/client';
import { useEffect, useState } from 'react';

import {
  BookInfoDocument,
  BookInfoQuery,
  BookInfoQueryVariables,
  BookOrder,
} from '@syuchan1005/book-reader-graphql';

export const usePrevNextBook = (
  infoId,
  bookId,
): [prev: string | undefined, next: string | undefined] => {
  const client = useApolloClient();
  const [bookInfo, setBookInfo] = useState(undefined);
  const [books, setBooks] = useState<[string, string]>([undefined, undefined]);

  useEffect(() => {
    if (!infoId) {
      setBookInfo(undefined);
    } else {
      try {
        const readQuery = client.cache.readQuery<
          BookInfoQuery,
          BookInfoQueryVariables
        >({
          query: BookInfoDocument,
          variables: {
            id: infoId,
            order: BookOrder.NumberAsc,
          },
        });
        setBookInfo(readQuery.bookInfo);
      } catch (e) {
        setBookInfo(undefined);
      }
    }
  }, [client, infoId]);

  useEffect(() => {
    if (!bookId || !bookInfo) {
      setBooks([undefined, undefined]);
    } else {
      const i = bookInfo.books.findIndex((v) => v.id === bookId);
      if (i === -1) {
        setBooks([undefined, undefined]);
      } else {
        setBooks([bookInfo.books[i - 1]?.id, bookInfo.books[i + 1]?.id]);
      }
    }
  }, [bookInfo, bookId]);

  return books;
};
