import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | undefined;

export function getDb(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  if (!pool) pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 8,
    maxIdle: 4,
    idleTimeout: 60_000,
    enableKeepAlive: true,
    charset: "utf8mb4",
  });
  return pool;
}
