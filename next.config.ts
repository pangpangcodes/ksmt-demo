import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize canvas module for pdfjs-dist (server-side only, not used for text extraction)
  serverExternalPackages: ['canvas', 'pdfjs-dist'],

  // Turbopack config to specify correct workspace root
  turbopack: {
    root: '/Users/monica.pang/Documents/monica-pang/bridezilla',
  },

  // Use webpack mode explicitly since Turbopack doesn't fully support serverExternalPackages
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('canvas');
    }
    return config;
  },

  // URL redirects for restructured routes
  async redirects() {
    return [
      // Legacy admin URLs → /couples
      {
        source: '/admin',
        destination: '/couples',
        permanent: true,
      },
      {
        source: '/admin/:path*',
        destination: '/couples/:path*',
        permanent: true,
      },

      // Legacy /planner → /planners (add plural)
      {
        source: '/planner',
        destination: '/planners',
        permanent: true,
      },
      {
        source: '/planner/:path*',
        destination: '/planners/:path*',
        permanent: true,
      },

      // Legacy /shared → /s (shorten)
      {
        source: '/shared/:uuid',
        destination: '/s/:uuid',
        permanent: true,
      },

      // Root demo pages → /demo prefix
      {
        source: '/itinerary',
        destination: '/demo/itinerary',
        permanent: true,
      },
      {
        source: '/accommodation',
        destination: '/demo/accommodation',
        permanent: true,
      },
      {
        source: '/travel',
        destination: '/demo/travel',
        permanent: true,
      },
      {
        source: '/faq',
        destination: '/demo/faq',
        permanent: true,
      },
      {
        source: '/rsvp',
        destination: '/demo/rsvp',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
