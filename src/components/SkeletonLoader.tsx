import React from 'react';

export function MessagesSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-10 w-full animate-pulse rounded bg-muted/50" />
      ))}
    </div>
  );
}

export function KeyLogsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-8 w-full animate-pulse rounded bg-muted/50" />
      ))}
    </div>
  );
}

export function DeviceDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-24 w-full animate-pulse rounded bg-muted/50" />
      <div className="h-10 w-full animate-pulse rounded bg-muted/50" />
      <div className="h-10 w-2/3 animate-pulse rounded bg-muted/50" />
      <div className="h-10 w-1/2 animate-pulse rounded bg-muted/50" />
    </div>
  );
}
