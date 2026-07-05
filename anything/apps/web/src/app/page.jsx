"use client";

import StorefrontLayout from "./[storeSlug]/layout";
import StorefrontHomePage from "./[storeSlug]/page";

export default function RootPage() {
  return (
    <StorefrontLayout>
      <StorefrontHomePage params={{ storeSlug: "onlinebdshop" }} />
    </StorefrontLayout>
  );
}
