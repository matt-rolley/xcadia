import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "./src/modules/team",
    },
    {
      resolve: "./src/modules/company",
    },
    {
      resolve: "./src/modules/portfolio",
    },
    {
      resolve: "./src/modules/email",
    },
    {
      resolve: "./src/modules/activity",
    },
    {
      resolve: "./src/modules/notification",
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "./src/modules/resend",
            id: "resend",
            options: {
              channels: ["email"],
              api_key: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM_EMAIL,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/file-s3",
      options: {
        file_url: 'https://assets.xcadia.com', 
        access_key_id: process.env.S3_ACCESS_KEY_ID,
        secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
        region: 'auto',
        bucket: 'xcadia',
        // Optional: Configure CDN
        // cdn_url: process.env.S3_CDN_URL, // e.g., CloudFront URL
        // Optional: Set cache control headers
        // cache_control: "max-age=31536000",
        endpoint: 'https://t3.storage.dev',
        additional_client_config: {
          forcePathStyle: true,
        },
        
      },
    },
  ],
})
