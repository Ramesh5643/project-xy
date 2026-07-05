/**
 * GET /api/storefront/config
 *
 * Public single-store config endpoint used by the root storefront preview.
 */

import sql from "@/app/api/utils/sql";
import {
  normalizeStorefrontConfig,
  resolveSingleTenantStore,
} from "@/app/api/utils/single-tenant";

export async function GET() {
  const store = await resolveSingleTenantStore(sql, "onlinebdshop");

  if (!store) {
    return Response.json(
      { success: false, error: "Store not found." },
      { status: 404 },
    );
  }

  const normalized = normalizeStorefrontConfig(store);

  return Response.json({
    success: true,
    data: normalized,
  });
}
