import React, { useState, useEffect, useMemo } from "react";
import { FixedSizeList as List } from "react-window";

interface VirtualizedTableProps<T> {
  data: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMore?: () => Promise<void>;
  hasMore?: boolean;
  loading?: boolean;
}

export function VirtualizedTable<T>({
  data,
  height,
  itemHeight,
  renderItem,
  loadMore,
  hasMore = false,
  loading = false,
}: VirtualizedTableProps<T>) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleScroll = async ({
    scrollOffset,
    scrollUpdateWasRequested,
  }: any) => {
    if (scrollUpdateWasRequested || !loadMore || !hasMore || isLoadingMore)
      return;

    const scrollPercentage = scrollOffset / (data.length * itemHeight - height);

    // Load more when 80% scrolled
    if (scrollPercentage > 0.8) {
      setIsLoadingMore(true);
      try {
        await loadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => <div style={style}>{renderItem(data[index], index)}</div>;

  return (
    <div className="relative">
      <List
        height={height}
        itemCount={data.length}
        itemSize={itemHeight}
        onScroll={handleScroll}
      >
        {Row}
      </List>
      {(loading || isLoadingMore) && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80 backdrop-blur-sm text-center text-sm text-muted-foreground">
          Loading more items...
        </div>
      )}
    </div>
  );
}
