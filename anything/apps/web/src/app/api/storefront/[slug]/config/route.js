/**
 * GET /api/storefront/:slug/config
 *
 * Public — no JWT required.
 * Returns store name, theme_config, and active integrations (non-sensitive).
 * This is the first call the ThemeProvider makes to boot the storefront.
 */

import sql from "@/app/api/utils/sql";
import {
  normalizeStorefrontConfig,
  resolveSingleTenantStore,
} from "@/app/api/utils/single-tenant";

export async function GET(_req, { params }) {
  const { slug } = await params;

  const store = await resolveSingleTenantStore(sql, slug);

  if (!store) {
    return Response.json(
      { success: false, error: "Store not found." },
      { status: 404 },
    );
  }

  if (!store.is_active) {
    return Response.json(
      { success: false, error: "This store is unavailable." },
      { status: 403 },
    );
  }

  const normalized = normalizeStorefrontConfig(store);

  // Fetch active integrations (public config only — no credentials)
  const integrations = await sql`
    SELECT integration, public_config
    FROM   integration_configs
    WHERE  store_id  = ${store.id}
      AND  is_active = TRUE
      AND  category  = 'payment'
  `;

  const activePaymentMethods = integrations.map((i) => ({
    id: i.integration,
    public_config: i.public_config,
  }));

  return Response.json({
    success: true,
    data: {
      storeId: store.id,
      name: store.name,
      slug: store.slug,
      themeConfig: normalized.themeConfig,
      seo: normalized.seo,
      paymentConfig: normalized.paymentConfig,
      shippingConfig: normalized.shippingConfig,
      storefrontMeta: normalized.storefrontMeta,
      paymentMethods: activePaymentMethods,
    },
  });
}
