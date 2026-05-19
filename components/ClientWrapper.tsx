"use client";

import { useEffect } from "react";
import { initializeSocket, cleanupSocket } from "@/services/socket";
import { useDataStore } from "@/store/useDataStore";
import { NotificationProvider } from "./NotificationProvider";

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const fetchInitialData = useDataStore(state => state.fetchInitialData);

  useEffect(() => {
    fetchInitialData();
    initializeSocket();

    return () => {
      cleanupSocket();
    };
  }, [fetchInitialData]);

  return (
    <>
      <NotificationProvider />
      {children}
    </>
  );
}
