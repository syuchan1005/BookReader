import React from 'react';
import { useApolloClient } from '@apollo/react-hooks';

import {
  BookOrder,
  BookInfoDocument, BookInfoQuery, BookInfoQueryVariables,
} from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

const usePrevNextBook = (infoId, bookId): [prev: string | undefined, next: string | undefined] => {
  const client = useApolloClient();
  const [bookInfo, setBookInfo] = React.useState(undefined);
  const [books, setBooks] = React.useState<[string, string]>([undefined, undefined]);

  React.useEffect(() => {
    if (!infoId) {
      setBookInfo(undefined);
    } else {
      try {
        const readQuery = client.cache.readQuery<BookInfoQuery, BookInfoQueryVariables>({
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

  React.useEffect(() => {
    if (!bookId || !bookInfo) {
      setBooks([undefined, undefined]);
    } else {
      const i = bookInfo.books.findIndex((v) => v.id === bookId);
      if (i === -1) {
        setBooks([undefined, undefined]);
      } else {
        setBooks([
          (bookInfo.books[i - 1] || {}).id,
          (bookInfo.books[i + 1] || {}).id,
        ]);
      }
    }
  }, [bookInfo, bookId]);

  return books;
};

export default usePrevNextBook;
