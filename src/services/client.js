import axios from "axios";
import { API_BASE_URL } from "./config";
import { clearAuthSnapshot, getAuthSnapshot, setAuthSnapshot } from "../store/authStore";
import { storage } from "../utils/storage";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

client.interceptors.request.use((config) => {
  const { accessToken } = getAuthSnapshot();
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config || {};
    const { refreshToken } = getAuthSnapshot();

    if ((status === 401 || status === 402) && refreshToken && !original._retry) {
      original._retry = true;
      try {
        const refreshRes = await axios.post(`${API_BASE_URL}/api/app/user/refreshToken`, { refreshToken });
        const accessToken = refreshRes?.data?.info?.token;
        const newRefreshToken = refreshRes?.data?.info?.refreshToken;

        if (accessToken && newRefreshToken) {
          const next = { accessToken, refreshToken: newRefreshToken, user: getAuthSnapshot().user };
          setAuthSnapshot(next);
          try {
            await storage.set("zoco:auth", next);
          } catch {}
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${accessToken}`;
          return client(original);
        }
      } catch {}
      clearAuthSnapshot();
    }

    return Promise.reject(error);
  }
);

export default client;
