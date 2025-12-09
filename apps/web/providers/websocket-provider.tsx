"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsClient } from "@/lib/ws";
import type {
  DeviceStatusChangePayload,
  DeviceUpdatesChangedPayload,
  DeviceRegisteredPayload,
  DeviceRemovedPayload,
} from "@/lib/types";

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple connections
    if (isConnectedRef.current) {
      return;
    }

    console.log("[WebSocketProvider] Initializing WebSocket connection...");
    isConnectedRef.current = true;

    // Connect to WebSocket server
    wsClient.connect();

    // Subscribe to device status changes (includes heartbeats)
    const unsubscribeStatus = wsClient.subscribe(
      "device_status_change",
      (payload: DeviceStatusChangePayload) => {
        console.log("[WebSocketProvider] Device status change:", payload);

        // Invalidate devices list to refresh
        queryClient.invalidateQueries({ queryKey: ["devices"] });

        // Invalidate specific device if we have it cached
        queryClient.invalidateQueries({
          queryKey: ["device", payload.deviceId],
        });

        // Invalidate stats to update counters
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      }
    );

    // Subscribe to device updates changes
    const unsubscribeUpdates = wsClient.subscribe(
      "device_updates_changed",
      (payload: DeviceUpdatesChangedPayload) => {
        console.log("[WebSocketProvider] Device updates changed:", payload);

        // Invalidate devices list
        queryClient.invalidateQueries({ queryKey: ["devices"] });

        // Invalidate specific device
        queryClient.invalidateQueries({
          queryKey: ["device", payload.deviceId],
        });

        // Invalidate device updates
        queryClient.invalidateQueries({
          queryKey: ["deviceUpdates", payload.deviceId],
        });

        // Invalidate global updates list
        queryClient.invalidateQueries({ queryKey: ["updates"] });

        // Invalidate stats
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      }
    );

    // Subscribe to device registration
    const unsubscribeRegistered = wsClient.subscribe(
      "device_registered",
      (payload: DeviceRegisteredPayload) => {
        console.log("[WebSocketProvider] Device registered:", payload);

        // Invalidate devices list to show new device
        queryClient.invalidateQueries({ queryKey: ["devices"] });

        // Invalidate stats
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      }
    );

    // Subscribe to device removal
    const unsubscribeRemoved = wsClient.subscribe(
      "device_removed",
      (payload: DeviceRemovedPayload) => {
        console.log("[WebSocketProvider] Device removed:", payload);

        // Invalidate devices list
        queryClient.invalidateQueries({ queryKey: ["devices"] });

        // Remove device from cache
        queryClient.removeQueries({
          queryKey: ["device", payload.deviceId],
        });

        // Invalidate stats
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      }
    );

    // Subscribe to connection events
    const unsubscribeConnected = wsClient.subscribe("connected", () => {
      console.log("[WebSocketProvider] Connected to WebSocket server");

      // Refresh all data when reconnecting
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["updates"] });
    });

    const unsubscribeDisconnected = wsClient.subscribe("disconnected", () => {
      console.log("[WebSocketProvider] Disconnected from WebSocket server");
    });

    const unsubscribeError = wsClient.subscribe("error", (error: Error) => {
      console.error("[WebSocketProvider] WebSocket error:", error);
    });

    // Cleanup on unmount
    return () => {
      console.log("[WebSocketProvider] Cleaning up WebSocket connection...");

      unsubscribeStatus();
      unsubscribeUpdates();
      unsubscribeRegistered();
      unsubscribeRemoved();
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();

      wsClient.disconnect();
      isConnectedRef.current = false;
    };
  }, [queryClient]);

  return <>{children}</>;
}
