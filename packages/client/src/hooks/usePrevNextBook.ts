import { useApolloClient } from '@apollo/client/react';
import {
  BookInfoDocument,
  type BookInfoQuery,
  type BookInfoQueryVariables,
  BookOrder,
} from '@syuchan1005/book-reader-graphql';
import { useEffect, useState } from 'react';

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
      } catch (_e) {
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
