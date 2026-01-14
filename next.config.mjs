/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oscarmejiabautista.com",
        port: "",
        pathname: "/images/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize native Node modules used by Transformers.js
      // These are server-only dependencies that shouldn't be bundled
      config.externals = config.externals || [];
      config.externals.push({
        "onnxruntime-node": "commonjs onnxruntime-node",
        "sharp": "commonjs sharp",
      });
    }

    // Ignore .node files (native binaries)
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
    });

    return config;
  },
};

export default nextConfig;
