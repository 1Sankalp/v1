/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'image.thum.io' },
      { protocol: 'https', hostname: 'opengraph.githubassets.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
}

module.exports = nextConfig
