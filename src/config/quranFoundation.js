import { createServerClient } from "@quranjs/api/server";
import { environment } from "./environment.js";

let client;

const serviceEnvironments = {
  prelive: {
    contentBaseUrl: "https://apis-prelive.quran.foundation",
    tokenHost: "https://prelive-oauth2.quran.foundation",
  },
  production: {
    contentBaseUrl: "https://apis.quran.foundation",
    tokenHost: "https://oauth2.quran.foundation",
  },
};

export function getQuranFoundationClient() {
  if (!environment.isQuranConfigured) {
    const error = new Error("Quran content source is not configured");
    error.status = 503;
    error.code = "QURAN_SOURCE_NOT_CONFIGURED";
    throw error;
  }

  client ??= createServerClient({
    clientId: environment.qfClientId,
    clientSecret: environment.qfClientSecret,
    services: serviceEnvironments[environment.qfEnvironment],
  });

  return client;
}
