import { withSentryConfig } from "@sentry/nextjs";
import { build } from "velite";

// Trigger Velite build on dev/build
const isDev = process.argv.includes("dev");
if (!process.env.VELITE_STARTED && (isDev || process.argv.includes("build"))) {
  process.env.VELITE_STARTED = "1";
  await build({ watch: isDev, clean: !isDev });
}

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  org: "oscarmbcom",

  project: "oscarmbdotcom",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js proxy, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",
});
