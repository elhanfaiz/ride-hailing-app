import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "../api/axios";
import { resolveSocketUrl } from "../utils/runtime";

const SocketContext = createContext(null);
const SOCKET_EVENT_BUFFER_SIZE = 300;

const toSerializablePayload = (value) => {
  if (value === undefined) return null;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return null;
  }
};

const recordSocketEvent = (direction, eventName, payload = null) => {
  if (typeof window === "undefined") return;

  const existingEvents = window.__rideFlowSocketEvents || [];
  const nextEvents = [
    ...existingEvents,
    {
      direction,
      eventName,
      payload: toSerializablePayload(payload),
      timestamp: Date.now(),
    },
  ].slice(-SOCKET_EVENT_BUFFER_SIZE);

  window.__rideFlowSocketEvents = nextEvents;
};

const resolveStoredAccountId = () => {
  if (typeof window === "undefined") return null;

  try {
    const storedAccount = window.localStorage.getItem("uber-clone-account");
    return storedAccount ? JSON.parse(storedAccount)?._id || null : null;
  } catch (_error) {
    return null;
  }
};

export const SocketProvider = ({ children }) => {
  const { auth } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const emitPresenceJoin = useCallback(
    (activeSocket) => {
      if (!activeSocket) return;

      const accountId = auth.account?._id || resolveStoredAccountId();

      if (auth.role === "driver" && accountId) {
        activeSocket.emit("driver:join", { driverId: accountId });
      }

      if (auth.role === "user" && accountId) {
        activeSocket.emit("user:join", { userId: accountId });
      }

      if (auth.role === "admin") {
        activeSocket.emit("admin:join");
      }
    },
    [auth.account?._id, auth.role]
  );

  useEffect(() => {
    if (!auth.token) {
      socketRef.current = null;
      setSocket(null);
      return undefined;
    }

    const nextSocket = io(
      resolveSocketUrl({
        env: import.meta.env,
        apiBaseUrl: API_BASE_URL,
        origin: typeof window !== "undefined" ? window.location.origin : undefined,
      }),
      {
        transports: ["websocket"],
      }
    );
    const originalEmit = nextSocket.emit.bind(nextSocket);

    nextSocket.emit = (eventName, ...args) => {
      recordSocketEvent("sent", eventName, args[0]);
      return originalEmit(eventName, ...args);
    };

    nextSocket.onAny((eventName, ...args) => {
      recordSocketEvent("received", eventName, args[0]);
    });

    setSocket(nextSocket);
    socketRef.current = nextSocket;

    nextSocket.on("connect", () => {
      recordSocketEvent("received", "connect");
      emitPresenceJoin(nextSocket);
    });

    nextSocket.on("connect_error", (error) => {
      recordSocketEvent("received", "connect_error", { message: error.message });
    });

    nextSocket.on("disconnect", (reason) => {
      recordSocketEvent("received", "disconnect", { reason });
    });

    return () => {
      nextSocket.disconnect();
      socketRef.current = null;
    };
  }, [auth.token, emitPresenceJoin]);

  useEffect(() => {
    if (!auth.token || !socketRef.current?.connected) return;
    emitPresenceJoin(socketRef.current);
  }, [auth.token, emitPresenceJoin]);

  const subscribeToRide = useCallback((rideId) => {
    if (!rideId || !socketRef.current) return;
    socketRef.current.emit("ride:subscribe", { rideId });
  }, []);

  const emitDriverLocation = useCallback((payload) => {
    if (!socketRef.current) return;
    socketRef.current.emit("driver:location", payload);
  }, []);

  const value = useMemo(
    () => ({ socket, subscribeToRide, emitDriverLocation }),
    [socket, subscribeToRide, emitDriverLocation]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
