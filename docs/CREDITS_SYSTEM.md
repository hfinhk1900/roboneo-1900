# Credits System Documentation

This document explains how the credits system works in Roboneo Art and how to set up automated monthly resets.

## 📊 Credits Overview

### Plan Allocations

| Plan | Credits | Images | Reset Type |
|------|---------|--------|------------|
| Free | 10 | 1 image | One-time |
| Pro | 2,000 | 200 images | Monthly |
| Ultimate | 5,000 | 500 images | Monthly |

### Credits per Image
- Each image generation costs **10 credits**
- This is configurable in `src/config/credits-config.ts` via `CREDITS_PER_IMAGE`

## 🏗️ System Architecture

### Core Files

1. **`src/config/credits-config.ts`** - Credits configuration and utilities
2. **`src/actions/allocate-credits-action.ts`** - Server actions for credits allocation
3. **`src/actions/credits-actions.ts`** - Credits management (existing)
4. **`src/app/api/credits/reset-monthly/route.ts`** - Monthly reset API endpoint

### Database Schema

The credits are stored in the `user` table:
```sql
credits: integer('credits').notNull().default(10)
```

## 🔄 Automatic Credits Allocation

### On Subscription Creation
When a user subscribes to Pro or Ultimate:
1. Stripe webhook triggers payment record creation
2. `allocateCreditsToUser()` is called automatically
3. User's credits are set to their plan's monthly allocation

### On Monthly Reset
For subscription users:
1. API endpoint `/api/credits/reset-monthly` is called
2. All active subscriptions are queried
3. Users with monthly reset plans get their credits refreshed

## 🛠️ Setup Instructions

### 1. Environment Variables

Add to your `.env` file:
```bash
# API key for automated credits reset (used by cron jobs)
CRON_API_KEY="your-secure-api-key-here"
```

### 2. Monthly Reset Automation

#### Option A: Vercel Cron Jobs (Recommended)

Create `vercel.json` in your project root:
```json
{
  "crons": [
    {
      "path": "/api/credits/reset-monthly",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

#### Option B: External Cron Service

Set up a monthly cron job to call:
```bash
curl -X POST https://your-domain.com/api/credits/reset-monthly \
  -H "Authorization: Bearer your-secure-api-key-here"
```

### 3. Manual Reset (Testing)

For testing purposes, you can manually trigger the reset:
```bash
curl -X POST http://localhost:3000/api/credits/reset-monthly \
  -H "Authorization: Bearer your-secure-api-key-here"
```

## 📝 Usage Examples

### Check User Credits
```typescript
import { getUserCreditsAction } from '@/actions/credits-actions';

const result = await getUserCreditsAction({ userId: "user-id" });
if (result.success) {
  console.log(`User has ${result.data.credits} credits`);
}
```

### Deduct Credits (Image Generation)
```typescript
import { deductCreditsAction } from '@/actions/credits-actions';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';

const result = await deductCreditsAction({
  userId: "user-id",
  amount: CREDITS_PER_IMAGE
});
```

### Manually Allocate Credits (Admin)
```typescript
import { allocateCreditsToUser } from '@/actions/allocate-credits-action';

const result = await allocateCreditsToUser("user-id", "pro");
```

## 🔧 Configuration

### Modify Credits per Image
Edit `src/config/credits-config.ts`:
```typescript
export const CREDITS_PER_IMAGE = 10; // Change this value
```

### Add New Plans
1. Add to `PLAN_CREDITS_CONFIG` in `credits-config.ts`
2. Update `getPlanIdFromPriceId()` function
3. Add plan to website configuration
4. Update translation files

### Custom Reset Logic
Modify `src/app/api/credits/reset-monthly/route.ts` for custom reset behavior.

## 🚨 Security Considerations

1. **API Key Protection**: Keep `CRON_API_KEY` secure and rotate regularly
2. **Rate Limiting**: Consider adding rate limiting to the reset endpoint
3. **Logging**: Monitor credits allocation/reset logs for anomalies
4. **Database Backups**: Ensure regular backups before credits operations

## 📊 Monitoring

### Log Messages to Watch
- `✅ Allocated X credits to user Y for subscription Z`
- `🔄 Starting monthly credits reset...`
- `🎉 Monthly credits reset completed. Updated X users.`

### Error Monitoring
- Failed credits allocation after payment
- Monthly reset failures
- Insufficient credits for image generation

## 🔍 Troubleshooting

### Common Issues

1. **Credits not allocated after payment**
   - Check Stripe webhook logs
   - Verify price ID mapping in `getPlanIdFromPriceId()`
   - Check payment record creation

2. **Monthly reset not working**
   - Verify cron job is running
   - Check API key configuration
   - Review active subscriptions query

3. **Wrong credits amount**
   - Verify plan configuration in `credits-config.ts`
   - Check price ID to plan ID mapping

### Debug Tools

1. Check payment records:
```sql
SELECT * FROM payment WHERE status = 'active' AND type = 'subscription';
```

2. Check user credits:
```sql
SELECT id, email, credits FROM user ORDER BY credits DESC;
```

3. Test credits allocation:
```bash
# Check API endpoint
curl -X POST http://localhost:3000/api/credits/reset-monthly \
  -H "Authorization: Bearer your-api-key"
```
