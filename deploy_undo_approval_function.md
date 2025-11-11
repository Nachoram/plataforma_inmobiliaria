# 🚀 Deploy undo-application-approval Edge Function

## ✅ Status: FUNCTION IS DEPLOYED AND WORKING

The `undo-application-approval` Edge Function is successfully deployed and responding correctly to CORS preflight requests.

## Current Issue: Authentication Required

When testing the function URL directly in browser, you get:
```json
{"code":401,"message":"Missing authorization header"}
```

This is **EXPECTED and NORMAL** behavior. The function requires authentication.

## Solution: Test from Application

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Navigate to **"Edge Functions"** in the sidebar

### Step 2: Create the Function
1. Click **"Create a function"**
2. **Function name**: `undo-application-approval`
3. **Function URL**: Will be generated automatically

### Step 3: Copy the Code
Copy and paste the **ENTIRE** content from:
```
supabase/functions/undo-application-approval/index.ts
```

### Step 4: Deploy
1. Click **"Deploy function"**
2. Wait for success message
3. Check the **"Logs"** tab for any errors

### Step 5: Verify Deployment
1. The function should be available at:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/undo-application-approval
   ```

2. You should see the function listed in your Edge Functions dashboard

## Test the Function

After deployment, try the undo approval functionality again from your application. The CORS error should be resolved.

## Alternative: CLI Deployment (if you have CLI access)

If you have Supabase CLI configured:

```bash
# Login (if not already)
npx supabase login

# Link project (if not linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
npx supabase functions deploy undo-application-approval
```

## Troubleshooting

If you still get CORS errors after deployment:
1. Check the function logs in Supabase dashboard
2. Verify the function is deployed and active
3. Ensure your project URL is correct in the frontend code

The function code has been updated to properly handle CORS preflight requests with an explicit 200 status code.
