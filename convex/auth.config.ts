import { authConfig } from "convex/server";

export default authConfig({
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex"
    }
  ]
});
