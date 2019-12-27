import * as React from 'react';
import { useApolloClient } from '@apollo/react-hooks';

import {
  BookInfoQuery as BookInfoQueryType,
  BookInfoQueryVariables,
} from "@common/GQLTypes";
import BookInfoQuery from '@client/graphqls/common/BookInfoQuery.gql';

const usePrevNextBook = (infoId, bookId) => {
  const client = useApolloClient();
  const [bookInfo, setBookInfo] = React.useState(undefined);
  const [books, setBooks] = React.useState([undefined, undefined]);

  React.useEffect(() => {
    if (!infoId) {
      setBookInfo(undefined);
    } else {
      try {
        const readQuery = client.cache.readQuery<BookInfoQueryType, BookInfoQueryVariables>({
          query: BookInfoQuery,
          variables: {
            id: infoId,
          },
        });
        // @ts-ignore
        setBookInfo(readQuery.bookInfo);
      } catch (e) {
        setBookInfo(undefined);
      }
    }
  }, [infoId]);

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
