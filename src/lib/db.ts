import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const url = process.env.DATABASE_URL;
const local = !url || /localhost|127\.0\.0\.1/.test(url);
const g = globalThis as unknown as { prisma?: PrismaClient };
// Supabase uses its own CA, so the TLS chain is not verified here; tighten by supplying Supabase's CA cert if required.
export const db = g.prisma ?? new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 5, ssl: local ? false : { rejectUnauthorized: false } }) });
if (process.env.NODE_ENV !== "production") g.prisma = db;
