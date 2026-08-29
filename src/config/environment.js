import dotenv from "dotenv";

dotenv.config({ quiet: true });

const qfEnvironment = process.env.QF_ENV || "prelive";

if (!["prelive", "production"].includes(qfEnvironment)) {
  throw new Error("QF_ENV must be either prelive or production");
}

export const environment = Object.freeze({
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  qfClientId: process.env.QF_CLIENT_ID?.trim() || "",
  qfClientSecret: process.env.QF_CLIENT_SECRET?.trim() || "",
  qfEnvironment,
  isQuranConfigured: Boolean(
    process.env.QF_CLIENT_ID?.trim() && process.env.QF_CLIENT_SECRET?.trim(),
  ),
});
