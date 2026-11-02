import { createAuthClient } from "better-auth/react";
import { AUTH_BASE_URL } from "@/services/api-client";

/**
 * Exports authClient.
 * @type {*} Exported application value.
*/
export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
