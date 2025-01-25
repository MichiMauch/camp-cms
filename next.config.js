const nextConfig = {
  output: 'standalone',
  env: {
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_DATABASE_AUTH_TOKEN: process.env.TURSO_DATABASE_AUTH_TOKEN,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev",
      },
      {
        protocol: "https",
        hostname: "unsplash.com", // Unsplash Domain hinzufügen
      },
    ],
  },
};

export default nextConfig;

