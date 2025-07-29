'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Remove fallback data to avoid SSR issues
        // Components will fetch data on the client side
        fetcher: (url: string) => fetch(url).then((res) => res.json()),
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
