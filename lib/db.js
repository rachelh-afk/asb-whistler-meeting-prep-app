import { Pool } from "pg";
import { normalizePerson } from "./people";
import { SEED_PEOPLE } from "./seedPeople";

let pool;
function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set. Add it to .env.local (see README.md).");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

let schemaReady;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  }
  return schemaReady;
}

// Inserts any SEED_PEOPLE not already present (matched by id), and backfills
// revenue/orderHistory/fstRegion onto any existing row that predates those
// fields — mirroring the original artifact's client-side seed-merge logic,
// just run once server-side instead of on every browser load.
//
// Cached per warm serverless instance (like ensureSchema below) so this
// full-table scan + comparison only runs once, not on every single
// GET /api/people request — that was adding real, user-visible latency to
// every page load for no benefit once the table is already fully seeded.
let seedReady;
function ensureSeeded(client) {
  if (!seedReady) {
    seedReady = ensureSeededOnce(client);
  }
  return seedReady;
}

async function ensureSeededOnce(client) {
  const { rows } = await client.query("SELECT id, data FROM people");
  const existingIds = new Set(rows.map((r) => r.id));

  const toInsert = SEED_PEOPLE.filter((sp) => !existingIds.has(sp.id));
  for (const sp of toInsert) {
    await client.query(
      "INSERT INTO people (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
      [sp.id, sp]
    );
  }

  const seedById = new Map(SEED_PEOPLE.map((sp) => [sp.id, sp]));
  for (const row of rows) {
    const seed = seedById.get(row.id);
    if (!seed) continue;
    const p = row.data;
    const hasRevenue = p.revenue && (p.revenue.y2025 || p.revenue.y2026ytd);
    const hasOrderHistory =
      p.orderHistory && (p.orderHistory.products?.length || p.orderHistory.logos?.length);
    const hasFstRegion = !!p.fstRegion;
    const hasYearsInIndustry = !!p.yearsInIndustry;
    const hasBrandAffiliation = !!(p.brandAffiliation && p.brandAffiliation.length);
    const hasToolsWeCanOffer = !!p.ourPrep?.toolsWeCanOffer;
    if (!hasRevenue || !hasOrderHistory || !hasFstRegion || !hasYearsInIndustry || !hasBrandAffiliation) {
      const patched = {
        ...p,
        revenue: hasRevenue ? p.revenue : { ...seed.revenue },
        orderHistory: hasOrderHistory ? p.orderHistory : { ...seed.orderHistory },
        fstRegion: hasFstRegion ? p.fstRegion : seed.fstRegion,
        yearsInIndustry: hasYearsInIndustry ? p.yearsInIndustry : seed.yearsInIndustry,
        brandAffiliation: hasBrandAffiliation ? p.brandAffiliation : seed.brandAffiliation,
        ourPrep: hasToolsWeCanOffer
          ? p.ourPrep
          : { ...p.ourPrep, toolsWeCanOffer: seed.ourPrep?.toolsWeCanOffer || "" },
      };
      await client.query("UPDATE people SET data = $2, updated_at = now() WHERE id = $1", [
        row.id,
        patched,
      ]);
    }
  }
}

export async function getAllPeople() {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await ensureSeeded(client);
    const { rows } = await client.query(
      "SELECT data FROM people ORDER BY (data->>'company') ASC NULLS LAST"
    );
    return rows.map((r) => r.data);
  } finally {
    client.release();
  }
}

export async function insertPeople(drafts) {
  await ensureSchema();
  const normalized = drafts.map((d) => normalizePerson(d, d.id));
  const client = await getPool().connect();
  try {
    const inserted = [];
    for (const person of normalized) {
      const { rows } = await client.query(
        "INSERT INTO people (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING data",
        [person.id, person]
      );
      if (rows[0]) inserted.push(rows[0].data);
    }
    return inserted;
  } finally {
    client.release();
  }
}

export async function updatePerson(id, person) {
  await ensureSchema();
  const normalized = normalizePerson(person, id);
  const { rows } = await getPool().query(
    `INSERT INTO people (id, data) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = now()
     RETURNING data`,
    [id, normalized]
  );
  return rows[0]?.data;
}

export async function deletePerson(id) {
  await ensureSchema();
  await getPool().query("DELETE FROM people WHERE id = $1", [id]);
}
