import React, { memo } from 'react';

export interface VirtualTableProps<T> {
  items: T[];
  height?: number;
  rowHeight?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  className?: string;
}

function VirtualTableInner<T>({ items, renderRow, className }: VirtualTableProps<T>) {
  // Minimal non-virtual fallback to avoid blocking the build if react-window is not yet installed.
  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={index}>{renderRow(item, index)}</div>
      ))}
    </div>
  );
}

export const MemoizedVirtualTable = memo(VirtualTableInner) as typeof VirtualTableInner;
