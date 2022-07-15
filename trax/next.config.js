module.exports = {
  reactStrictMode: true,
  env: {
    // Stripe
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    // S3 Storage
    S3_ACCESS_ID: process.env.S3_ACCESS_ID,
    S3_APP_ACCESS_KEY: process.env.S3_APP_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    S3_REGION: process.env.S3_REGION
  }
}
