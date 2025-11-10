import { loadEnv, defineConfig } from '@medusajs/framework/utils'

const env = process.env.NODE_ENV || 'development'

loadEnv(env, process.cwd())

const modules = env === 'production' && process.env.REDIS_URL
  ? [
      {
        resolve: '@medusajs/medusa/cache-redis',
        options: {
          redisUrl: process.env.REDIS_URL,
        },
      },
      {
        resolve: '@medusajs/medusa/event-bus-redis',
        options: {
          redisUrl: process.env.REDIS_URL,
        },
      },
      {
        resolve: '@medusajs/medusa/workflow-engine-redis',
        options: {
          redis: {
            url: process.env.REDIS_URL,
          },
        },
      },
    ]
  : []

module.exports = defineConfig({
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
    backendUrl: process.env.MEDUSA_BACKEND_URL,
    path: process.env.MEDUSA_ADMIN_PATH as any || `/app`,
  },
  projectConfig: {
    workerMode: (process.env.WORKER_MODE || 'shared') as 'shared' | 'worker' | 'server',
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  modules: [
    ...modules,
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
      resolve: "./src/modules/deal",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/payment-stripe',
            id: 'stripe',
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              capture: true,
              automatic_payment_methods: true,
            },
          },
        ],
      },
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
    // {
    //   resolve: "@medusajs/file-s3",
    //   options: {
    //     file_url: 'https://assets.xcadia.com', 
    //     access_key_id: process.env.S3_ACCESS_KEY_ID,
    //     secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
    //     region: 'auto',
    //     bucket: 'xcadia',
    //     endpoint: 'https://t3.storage.dev',
    //     additional_client_config: {
    //       forcePathStyle: true,
    //     },
        
    //   },
    // },
  ],
})
