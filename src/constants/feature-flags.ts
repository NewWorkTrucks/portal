/**
 * "View as another user" for demos and testing. On only when NODE_ENV is "development"
 * (`npm run dev` sets it, and so does NODE_ENV=development in .env). `next build`/`next start`
 * use "production", so it is compiled out of production bundles.
 */
export const IS_USER_SIMULATION_ENABLED = process.env.NODE_ENV === "development";
