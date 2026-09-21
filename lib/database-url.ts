/**
 * Supabase dashboard URLs use `?sslmode=require`. node-postgres treats that
 * mode as full certificate verification (verify-full) unless libpq
 * compatibility is enabled, and the Supabase pooler certificate fails that
 * check.
 *
 * libpq's `sslmode=require` encrypts the connection and does not verify the
 * CA. For `*.supabase.co` and `*.supabase.com` (including the pooler) we
 * match that behavior:
 * - the app sets `ssl: { rejectUnauthorized: false }` and strips `sslmode`
 *   so the connection string cannot overwrite it
 * - Drizzle Kit only receives a URL, so the same hosts get `sslmode=no-verify`
 *   (node-postgres's equivalent: encrypt, do not verify)
 *
 * Other hosts, and Supabase URLs that already ask for verification
 * (`verify-full`, `verify-ca`, `sslrootcert`) or disable SSL, are unchanged.
 */

const SSLMODE_RE = /([?&])sslmode=([^&#]*)/i;

const RELAXED_MODES = new Set(["disable", "verify-full", "verify-ca", "no-verify"]);

export function isSupabaseDatabaseHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  return (
    host === "supabase.co" ||
    host.endsWith(".supabase.co") ||
    host === "supabase.com" ||
    host.endsWith(".supabase.com")
  );
}

/** Hostname from a postgres URL without re-encoding the userinfo. */
export function postgresHostname(databaseUrl: string): string | null {
  const match = databaseUrl.match(
    /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/?#]*@)?(\[[^\]]+\]|[^:/?#]+)/i,
  );
  if (!match) return null;
  const host = match[1];
  if (host.startsWith("[") && host.endsWith("]")) return host.slice(1, -1);
  return host;
}

function sslmode(databaseUrl: string): string | null {
  const match = databaseUrl.match(SSLMODE_RE);
  if (!match) return null;
  return decodeURIComponent(match[2]).toLowerCase();
}

/** True when a Supabase URL should skip certificate verification. */
export function shouldRelaxSupabaseSsl(databaseUrl: string): boolean {
  const host = postgresHostname(databaseUrl);
  if (!host || !isSupabaseDatabaseHost(host)) return false;
  if (/[?&]sslrootcert=/i.test(databaseUrl)) return false;
  const mode = sslmode(databaseUrl);
  if (mode === null) return true;
  return !RELAXED_MODES.has(mode);
}

function stripSslMode(databaseUrl: string): string {
  return databaseUrl
    .replace(/([?&])sslmode=[^&#]*&/i, "$1")
    .replace(/([?&])sslmode=[^&#]*/i, "")
    .replace(/[?&]$/, "");
}

/**
 * Pool options for Supabase hosts that need libpq-style `sslmode=require`.
 * Returns null when the URL should be passed through unchanged.
 */
export function supabaseSslOverride(databaseUrl: string): {
  connectionString: string;
  ssl: { rejectUnauthorized: false };
} | null {
  if (!shouldRelaxSupabaseSsl(databaseUrl)) return null;
  return {
    connectionString: stripSslMode(databaseUrl),
    ssl: { rejectUnauthorized: false },
  };
}

/**
 * Connection string for Drizzle Kit, which connects with
 * `new Pool({ connectionString })` and therefore honors `sslmode` itself.
 * Supabase hosts that would fail certificate verification get `sslmode=no-verify`.
 */
export function databaseUrlForPg(databaseUrl: string): string {
  if (!shouldRelaxSupabaseSsl(databaseUrl)) return databaseUrl;

  if (SSLMODE_RE.test(databaseUrl)) {
    return databaseUrl.replace(SSLMODE_RE, "$1sslmode=no-verify");
  }

  const hash = databaseUrl.indexOf("#");
  const before = hash === -1 ? databaseUrl : databaseUrl.slice(0, hash);
  const after = hash === -1 ? "" : databaseUrl.slice(hash);
  const joiner = before.includes("?") ? "&" : "?";
  return `${before}${joiner}sslmode=no-verify${after}`;
}
