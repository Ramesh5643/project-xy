const DEFAULT_SINGLE_TENANT_SLUG = process.env.SINGLE_TENANT_STORE_SLUG ?? "onlinebdshop";

export function getSingleTenantStoreSlug(requestedSlug = "") {
  const raw = (requestedSlug ?? "").trim().toLowerCase();
  return raw || DEFAULT_SINGLE_TENANT_SLUG;
}

export async function resolveSingleTenantStore(sql, requestedSlug = "") {
  const preferredSlug = getSingleTenantStoreSlug(requestedSlug);

  const bySlug = await sql`
    SELECT id, name, slug, is_active
    FROM stores
    WHERE slug = ${preferredSlug}
    LIMIT 1
  `;

  if (bySlug[0]) return bySlug[0];

  const firstActive = await sql`
    SELECT id, name, slug, is_active
    FROM stores
    WHERE is_active = true
    ORDER BY created_at ASC
    LIMIT 1
  `;

  return firstActive[0] ?? null;
}
