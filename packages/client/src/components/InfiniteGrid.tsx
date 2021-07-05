import React, { ComponentType } from 'react';
import { GridChildComponentProps, VariableSizeGrid } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

interface InfiniteGridProps<T = any> {
  gridWidth: number;
  gridHeight: number;
  itemWidth: number;
  itemHeight: number;
  isItemLoaded: (index: number) => boolean;
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<any> | null;
  itemCount: number;
  gridPadding?: number;
  gridGap?: number,
  children: ComponentType<GridChildComponentProps<T> & {
    columnCount: number,
    gridProps: InfiniteGridProps,
  }>;
}

type Mutable<T> = {
  -readonly [k in keyof T]: T[k];
};

const composeRefs = (...refs: React.Ref<any>[]) => (component: any): void => {
  refs.forEach((ref) => {
    if (typeof ref === 'function') {
      ref(component);
    } else if (ref && 'current' in ref) {
      // eslint-disable-next-line no-param-reassign
      (ref as Mutable<React.RefObject<any>>).current = component;
    }
  });
};

const InfiniteGrid = (props: InfiniteGridProps) => {
  const {
    children,
    gridWidth: width,
    gridHeight: height,
    itemWidth,
    itemHeight,
    isItemLoaded,
    loadMoreItems,
    itemCount,
    gridPadding = 0,
    gridGap = 0,
  } = props;

  const gridRef = React.useRef<VariableSizeGrid>();

  React.useEffect(() => {
    gridRef.current?.resetAfterIndices({ columnIndex: 0, rowIndex: 0 });
  }, [itemWidth, itemHeight, gridGap, gridPadding, width, height]);

  const columnCount = React.useMemo(() => {
    const availableWidth = width - (gridPadding * 2);
    return Math.floor((availableWidth + gridGap) / (itemWidth + gridGap));
  }, [gridGap, gridPadding, itemWidth, width]);

  const widthMargin = React.useMemo(() => {
    const availableWidth = width - (gridPadding * 2);
    const itemsWidth = (itemWidth * columnCount) + (gridGap * (columnCount - 1));
    return availableWidth - itemsWidth;
  }, [columnCount, gridGap, gridPadding, itemWidth, width]);

  const columnWidth = React.useCallback((columnIndex: number) => {
    const isStartColumn = columnIndex === 0;
    const isEndColumn = columnIndex === (columnCount - 1);
    const columnPadding = isStartColumn ? gridPadding + (widthMargin / 2) : 0;
    const columnGap = isEndColumn ? 0 : gridGap;
    return itemWidth + columnPadding + columnGap;
  }, [columnCount, gridPadding, widthMargin, gridGap, itemWidth]);

  const rowCount = React.useMemo(
    () => Math.ceil(itemCount / columnCount),
    [columnCount, itemCount],
  );

  const rowHeight = React.useCallback((rowIndex: number) => {
    const isTopRow = rowIndex === 0;
    const isBottomRow = rowIndex === (rowCount - 1);
    const rowPadding = (isTopRow || isBottomRow) ? gridPadding : 0;
    const rowGap = isBottomRow ? 0 : gridGap;
    return itemHeight + rowPadding + rowGap;
  }, [gridGap, gridPadding, itemHeight, rowCount]);

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      loadMoreItems={loadMoreItems}
      itemCount={itemCount}
    >
      {({
        onItemsRendered,
        ref,
      }) => (
        <VariableSizeGrid
          onItemsRendered={(gridProps) => {
            onItemsRendered({
              overscanStartIndex: gridProps.overscanRowStartIndex * columnCount,
              overscanStopIndex: gridProps.overscanRowStopIndex * columnCount,
              visibleStartIndex: gridProps.visibleRowStartIndex * columnCount,
              visibleStopIndex: gridProps.visibleRowStopIndex * columnCount,
            });
          }}
          ref={composeRefs(gridRef, ref)}
          columnCount={columnCount}
          columnWidth={columnWidth}
          rowCount={rowCount}
          rowHeight={rowHeight}
          width={width}
          height={height}
          style={{ overflowX: 'hidden', overflowY: 'auto' }}
        >
          {({
            columnIndex,
            rowIndex,
            style,
            ...innerProps
          }) => {
            const index = rowIndex * columnCount + columnIndex;
            const isStartColumn = (index % columnCount) === 0;
            const isTopRow = index < columnCount;

            return React.createElement(children, {
              columnIndex,
              rowIndex,
              ...innerProps,
              style: {
                ...style,
                width: itemWidth,
                height: itemHeight,
                marginLeft: isStartColumn ? gridPadding + (widthMargin / 2) : undefined,
                marginTop: isTopRow ? gridPadding : undefined,
              },
              columnCount,
              gridProps: props,
            });
          }}
        </VariableSizeGrid>
      )}
    </InfiniteLoader>
  );
};

export default React.memo(InfiniteGrid);
