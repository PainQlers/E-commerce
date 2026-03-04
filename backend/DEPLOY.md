Production deploy checklist for CORS and env

1) Set environment variable `ALLOWED_ORIGINS` on your hosting provider (Render/Vercel) to the comma-separated origins that should be allowed. Example:

   ALLOWED_ORIGINS=https://e-commerce-ubg6.vercel.app,https://e-commerce-c61q.onrender.com

2) Set `FRONTEND_URL` to the public URL of your deployed frontend (used by Stripe redirect). Example:

   FRONTEND_URL=https://e-commerce-ubg6.vercel.app

2) Ensure other required env vars (DB_URL, JWT_SECRET, etc.) are set in the hosting dashboard.

3) Redeploy / restart the service after updating env vars.

4) Check the service health and logs (Render/Vercel dashboard) for any 5xx errors. If you still see 502/5xx:
   - Inspect logs for stack traces or DB connection failures.
   - Confirm DB_URL is reachable from the host and credentials are valid.

5) Confirm from the client side by issuing a request (from the origin) and verifying response headers include `Access-Control-Allow-Origin` matching the origin.

Useful test (from your local machine):

curl -i -H "Origin: https://e-commerce-ubg6.vercel.app" https://e-commerce-c61q.onrender.com/api/food/list

You should see `Access-Control-Allow-Origin: https://e-commerce-ubg6.vercel.app` in the response headers when origin is allowed.
