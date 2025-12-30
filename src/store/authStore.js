let authSnapshot = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

const listeners = new Set();

export const getAuthSnapshot = () => authSnapshot;

export const setAuthSnapshot = (next) => {
  authSnapshot = { ...authSnapshot, ...next };
  listeners.forEach((fn) => fn(authSnapshot));
};

export const clearAuthSnapshot = () => {
  authSnapshot = { accessToken: null, refreshToken: null, user: null };
  listeners.forEach((fn) => fn(authSnapshot));
};

export const subscribeAuth = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
