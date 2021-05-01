import React from 'react';

const useLoadMore = (fetchMore) => {
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  const loadMore = React.useCallback((fetchMoreOptions: any) => {
    setIsLoadingMore(true);
    fetchMore({
      ...fetchMoreOptions,
      updateQuery: (...d) => {
        setIsLoadingMore(false);
        if (fetchMoreOptions.updateQuery) {
          return fetchMoreOptions.updateQuery(...d);
        }
        return d[2];
      },
    });
  }, [fetchMore]);

  return [isLoadingMore, loadMore];
};

export default useLoadMore;
