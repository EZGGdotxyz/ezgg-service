/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [{
            source: '/member/:slug*',
            destination: `http://localhost:3000/member/:slug*`,
          }]}
  ,
};
