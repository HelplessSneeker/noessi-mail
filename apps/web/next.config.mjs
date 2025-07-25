import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@noessi/types"],
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
