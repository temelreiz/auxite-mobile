// services/auth-fetch.ts
//
// Attaches the login token to every request this app makes to the Auxite API.
//
// Why a wrapper instead of editing call sites: the app identifies itself to the
// API with an `x-wallet-address` header in 123 places across 23 files. That
// header is not a credential — it is a string the caller chooses — and the API
// is migrating to the JWT that login already issues and that AuthContext
// already stores in expo-secure-store. Touching 123 call sites by hand would
// certainly miss some, and a missed call site is a screen that stops working
// the moment the server stops accepting the header. A wrapper cannot miss one.
//
// This is additive: the existing headers are left exactly as they are, so
// nothing changes in behaviour until the server starts preferring the token.
// Call sites can then drop `x-wallet-address` at leisure.

import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/api';

// Same key AuthContext writes on login.
const TOKEN_KEY = 'authToken';

let installed = false;

function targetsOurApi(input: RequestInfo | URL): boolean {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request)?.url;

  // Only our own API: the token must never leak to a third-party host (RPC
  // providers, Sumsub, analytics) just because the app happens to call them.
  return typeof url === 'string' && url.startsWith(API_URL);
}

function alreadyAuthorized(init?: RequestInit): boolean {
  const headers = init?.headers;
  if (!headers) return false;
  if (headers instanceof Headers) return headers.has('Authorization');
  if (Array.isArray(headers)) {
    return headers.some(([k]) => k.toLowerCase() === 'authorization');
  }
  return Object.keys(headers).some((k) => k.toLowerCase() === 'authorization');
}

/**
 * Installs the interceptor. Safe to call more than once — Fast Refresh
 * re-runs module side effects, and patching a patched fetch would nest
 * wrappers until the stack gave out.
 */
export function installAuthFetch(): void {
  if (installed) return;
  installed = true;

  const originalFetch = global.fetch;

  global.fetch = async function authFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    // Anything not ours, or already carrying its own Authorization, is passed
    // through untouched.
    if (!targetsOurApi(input) || alreadyAuthorized(init)) {
      return originalFetch(input, init);
    }

    let token: string | null = null;
    try {
      token = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      // Keychain unavailable (locked device, simulator quirk). Not a reason to
      // fail the request — the server still accepts the old header today.
      token = null;
    }

    if (!token) return originalFetch(input, init);

    const headers = new Headers(init?.headers ?? {});
    headers.set('Authorization', `Bearer ${token}`);

    return originalFetch(input, { ...init, headers });
  } as typeof fetch;
}
