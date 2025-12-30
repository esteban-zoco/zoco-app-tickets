import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { storage } from "../utils/storage";
import { clearAuthSnapshot, setAuthSnapshot, subscribeAuth } from "./authStore";

const AUTH_KEY = "zoco:auth";

const AuthContext = createContext(null);

const initialState = {
  isLoading: true,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  user: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "RESTORE":
      return { ...state, ...action.payload, isLoading: false };
    case "SIGN_IN":
      return { ...state, ...action.payload, isAuthenticated: true };
    case "SIGN_OUT":
      return { ...initialState, isLoading: false };
    case "UPDATE_TOKENS":
      return { ...state, accessToken: action.payload.accessToken, refreshToken: action.payload.refreshToken };
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await storage.get(AUTH_KEY);
        if (saved?.accessToken) {
          dispatch({ type: "RESTORE", payload: { ...saved, isAuthenticated: true } });
          setAuthSnapshot(saved);
          return;
        }
      } catch {}
      dispatch({ type: "RESTORE", payload: { isAuthenticated: false } });
    };
    restore();
  }, []);

  useEffect(() => {
    const unsub = subscribeAuth((snapshot) => {
      dispatch({
        type: "RESTORE",
        payload: {
          accessToken: snapshot.accessToken,
          refreshToken: snapshot.refreshToken,
          user: snapshot.user,
          isAuthenticated: Boolean(snapshot.accessToken),
        },
      });
    });
    return unsub;
  }, []);

  const auth = useMemo(
    () => ({
      state,
      signIn: async ({ accessToken, refreshToken, user }) => {
        const next = { accessToken, refreshToken, user };
        dispatch({ type: "SIGN_IN", payload: { ...next, isAuthenticated: true } });
        setAuthSnapshot(next);
        await storage.set(AUTH_KEY, next);
      },
      signOut: async () => {
        dispatch({ type: "SIGN_OUT" });
        clearAuthSnapshot();
        await storage.remove(AUTH_KEY);
      },
      updateTokens: async ({ accessToken, refreshToken }) => {
        dispatch({ type: "UPDATE_TOKENS", payload: { accessToken, refreshToken } });
        const next = { accessToken, refreshToken, user: state.user };
        setAuthSnapshot(next);
        await storage.set(AUTH_KEY, next);
      },
      updateUser: async (user) => {
        dispatch({ type: "UPDATE_USER", payload: user });
        const next = { accessToken: state.accessToken, refreshToken: state.refreshToken, user: { ...state.user, ...user } };
        setAuthSnapshot(next);
        await storage.set(AUTH_KEY, next);
      },
    }),
    [state]
  );

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
