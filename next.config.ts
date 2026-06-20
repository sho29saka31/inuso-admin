import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
