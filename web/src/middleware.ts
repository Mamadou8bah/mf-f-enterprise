export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/",
    "/properties/:path*",
    "/pay/:path*",
    "/receipts/:path*",
    "/search",
    "/documents/:path*",
    "/admin/:path*",
    "/settings",
    "/tenants/:path*",
    "/units/:path*",
    // /offline stays public for the PWA fallback shell
    "/api/payments",
    "/api/search",
    "/api/units/:path*",
    "/api/receipts/:path*",
    "/api/export/:path*",
    "/api/admin/:path*",
    "/api/tenants",
    "/api/tenancies",
    "/api/settings",
    "/api/me",
  ],
};
