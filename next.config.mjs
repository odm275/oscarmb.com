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
};

export default nextConfig;
