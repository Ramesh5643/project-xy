const DEFAULT_SINGLE_TENANT_SLUG = process.env.SINGLE_TENANT_STORE_SLUG ?? "onlinebdshop";

function buildFallbackStore(requestedSlug = "") {
  const slug = getSingleTenantStoreSlug(requestedSlug);
  return {
    id: process.env.SINGLE_STORE_ID ?? null,
    name: process.env.SINGLE_STORE_NAME ?? "Single Store",
    slug,
    is_active: true,
    theme_config: {},
  };
}

export function getSingleTenantStoreSlug(requestedSlug = "") {
  const raw = (requestedSlug ?? "").trim().toLowerCase();
  return raw || DEFAULT_SINGLE_TENANT_SLUG;
}

export function normalizeStorefrontConfig(store = {}) {
  const themeConfig = store.theme_config ?? {};
  const seo = themeConfig.seo ?? {};
  const paymentConfig = themeConfig.payment_config ?? {};
  const shippingConfig = themeConfig.shipping_config ?? {};

  return {
    storeId: store.id ?? null,
    storeName: store.name ?? "Store",
    slug: store.slug ?? DEFAULT_SINGLE_TENANT_SLUG,
    themeConfig: {
      ...themeConfig,
      bg: themeConfig.bg ?? themeConfig["--sf-bg"] ?? "",
      surface: themeConfig.surface ?? themeConfig["--sf-surface"] ?? "",
      accent: themeConfig.accent ?? themeConfig["--sf-accent"] ?? "",
      text: themeConfig.text ?? themeConfig["--sf-text"] ?? "",
      text2: themeConfig.text2 ?? themeConfig["--sf-text2"] ?? "",
    },
    seo: {
      title: seo.title ?? `${store.name ?? "Store"} | Shop` ,
      description: seo.description ?? "Premium products and seamless shopping.",
      keywords: seo.keywords ?? "",
      ogImage: seo.ogImage ?? seo.image ?? "",
      canonicalUrl: seo.canonicalUrl ?? "",
    },
    paymentConfig: {
      cod: paymentConfig.cod ?? true,
      stripe: paymentConfig.stripe ?? false,
      bkash: paymentConfig.bkash ?? false,
      nagad: paymentConfig.nagad ?? false,
      sslcommerz: paymentConfig.sslcommerz ?? false,
      paypal: paymentConfig.paypal ?? false,
    },
    shippingConfig: {
      freeShippingThreshold: shippingConfig.freeShippingThreshold ?? 5000,
      estimatedDays: shippingConfig.estimatedDays ?? 3,
      methods: shippingConfig.methods ?? [],
    },
    storefrontMeta: {
      homepageTitle: seo.title ?? `${store.name ?? "Store"} | Shop`,
      homepageDescription: seo.description ?? "Premium products and seamless shopping.",
      ogImage: seo.ogImage ?? seo.image ?? "",
    },
  };
}

export async function resolveSingleTenantStore(sql, requestedSlug = "") {
  const preferredSlug = getSingleTenantStoreSlug(requestedSlug);

  try {
    const bySlug = await sql`
      SELECT id, name, slug, is_active, theme_config
      FROM stores
      WHERE slug = ${preferredSlug}
      LIMIT 1
    `;

    if (bySlug[0]) return bySlug[0];

    const firstActive = await sql`
      SELECT id, name, slug, is_active, theme_config
      FROM stores
      WHERE is_active = true
      ORDER BY created_at ASC
      LIMIT 1
    `;

    if (firstActive[0]) return firstActive[0];
  } catch (error) {
    console.warn(
      "[single-tenant] Falling back to the default single-store configuration.",
      error?.message ?? error,
    );
  }

  return buildFallbackStore(preferredSlug);
}
