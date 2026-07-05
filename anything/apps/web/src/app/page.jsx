"use client";

import StorefrontLayout from "./storefront-layout";
import StorefrontHomePage from "./storefront-page";

export default function RootPage() {
  return (
    <StorefrontLayout>
      <StorefrontHomePage params={{ storeSlug: "onlinebdshop" }} />
    </StorefrontLayout>
  );
}
