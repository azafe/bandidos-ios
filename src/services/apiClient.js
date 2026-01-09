const DEFAULT_BASE_URL =
  "https://bandidos-backend-production.up.railway.app";

import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "bandidos_token";

let unauthorizedHandler = null;
let cachedToken = null;
let hasLoadedToken = false;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export async function loadStoredToken() {
  if (hasLoadedToken) return cachedToken;
  try {
    cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.warn("[apiClient] No se pudo leer el token:", err);
    cachedToken = null;
  } finally {
    hasLoadedToken = true;
  }
  return cachedToken;
}

export function getStoredToken() {
  return cachedToken;
}

export async function setStoredToken(token) {
  cachedToken = token || null;
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.warn("[apiClient] No se pudo guardar el token:", err);
  }
}

function buildUrl(path, params) {
  const baseUrl = process.env.API_BASE_URL || DEFAULT_BASE_URL;
  const url = new URL(path, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

async function handleResponse(res) {
  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      payload?.message || payload?.error || res.statusText || "Error";
    const error = new Error(message);
    error.status = res.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function publicRequest(path, { method = "GET", body, params } = {}) {
  const url = buildUrl(path, params);
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse(res);
}

export async function apiRequest(path, { method = "GET", body, params } = {}) {
  const url = buildUrl(path, params);
  const token = getStoredToken();
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && unauthorizedHandler) {
    unauthorizedHandler();
  }

  return handleResponse(res);
}
