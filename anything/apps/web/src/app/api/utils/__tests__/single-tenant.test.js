import { describe, expect, it } from "vitest";
import { normalizeStorefrontConfig } from "../single-tenant.js";

describe("normalizeStorefrontConfig", () => {
  it("merges theme, seo, payment, and shipping settings into a single payload", () => {
    const store = {
      name: "Northstar",
      slug: "northstar",
      theme_config: {
        bg: "#0f172a",
        accent: "#f59e0b",
        seo: {
          title: "Northstar Commerce",
          description: "Premium essentials",
          ogImage: "https://cdn.example.com/og.png",
        },
        payment_config: {
          cod: true,
          stripe: false,
        },
        shipping_config: {
          freeShippingThreshold: 5000,
          estimatedDays: 3,
        },
      },
    };

    const config = normalizeStorefrontConfig(store);

    expect(config.themeConfig.bg).toBe("#0f172a");
    expect(config.themeConfig.accent).toBe("#f59e0b");
    expect(config.seo.title).toBe("Northstar Commerce");
    expect(config.paymentConfig.cod).toBe(true);
    expect(config.shippingConfig.freeShippingThreshold).toBe(5000);
    expect(config.storefrontMeta.homepageTitle).toBe("Northstar Commerce");
  });

  it("returns sensible fallbacks when config is missing", () => {
    const config = normalizeStorefrontConfig({ name: "Acme", slug: "acme" });

    expect(config.themeConfig).toMatchObject({});
    expect(config.seo.title).toContain("Acme");
    expect(config.paymentConfig.cod).toBe(true);
    expect(config.shippingConfig.estimatedDays).toBe(3);
  });
});
