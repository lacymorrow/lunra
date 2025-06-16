# 🤖 LLM Rules & Conventions - Lunra Project

## 🎯 Core Principles

### 1. User-First Development

- **Always prioritize user experience over technical elegance**
- **Payments MUST grant immediate access** - No delays or manual steps
- **Error messages should be helpful, not technical**
- **Loading states for all async operations**

### 2. Security-First Approach

- **Never bypass authentication or RLS policies**
- **Validate all user inputs on server-side**
- **Use environment variables for all secrets**
- **Implement proper error handling without exposing internals**

### 3. Maintainable Code

- **Prefer small, atomic, composable pieces (< 700 lines per file)**
- **Server components over client components when possible**
- **Check for existing functions before creating new ones**
- **Don't repeat yourself (DRY principle)**

## 📋 Development Rules

### File Management

1. **ALWAYS check for existing files before creating new ones**
2. **Keep files under 700 lines** - Split into smaller components if needed
3. **Use consistent naming patterns:**
   - API routes: `route.ts`
   - Components: `PascalCase.tsx`
   - Utilities: `kebab-case.ts`
   - Types: `Database*` prefix for DB types

### Code Organization

1. **Server-side logic in `lib/services/`**
2. **Client-side logic in `lib/services/*-client.ts`**
3. **Types in `types/database.ts`**
4. **Configuration in `lib/*-config.ts`**

### Error Handling

1. **Always return meaningful error messages**
2. **Use proper HTTP status codes**
3. **Log errors with consistent emoji prefixes:**
   - ✅ Success
   - ❌ Error
   - ⚠️ Warning
   - 🔍 Debug info
   - 🎯 Specific component (e.g., 🔧 webhook, 💳 payment)

### TypeScript Standards

1. **Use strict type checking**
2. **Avoid `any` types - use proper interfaces**
3. **Export types for reuse across files**
4. **Consistent naming: `Database*` for DB types**

## 💳 Payment Flow Rules

### Critical Rules

1. **Webhook processing MUST be reliable** - Users expect immediate access
2. **Always validate webhook signatures** - Security is paramount
3. **Handle all Stripe webhook events:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. **Provide manual sync fallback** - For when webhooks fail

### Testing Requirements

1. **Test with Stripe test cards:** `4242 4242 4242 4242`
2. **Verify webhook delivery in Stripe Dashboard**
3. **Test subscription state transitions**
4. **Verify plan limit enforcement**

### Error Recovery

1. **Graceful degradation** - If webhooks fail, provide manual sync
2. **Clear error messages** - Users should know what to do
3. **Comprehensive logging** - For debugging payment issues
4. **Fallback mechanisms** - Multiple webhook endpoints available

## 🗄️ Database Rules

### Supabase Best Practices

1. **Always use Row Level Security (RLS)**
2. **Users can only access their own data**
3. **Use service role key for server operations**
4. **Use anon key for client operations**

### Query Patterns

1. **Use service functions for complex operations**
2. **Handle null returns gracefully**
3. **Consistent error logging**
4. **Use transactions for multi-table operations**

### Schema Changes

1. **Update TypeScript types first**
2. **Test with existing data**
3. **Update RLS policies if needed**
4. **Verify client compatibility**

## 🔐 Authentication Rules

### Access Control

1. **Every API route should verify authentication**
2. **Use `createClientServerWithAuth()` for server routes**
3. **Check user permissions before operations**
4. **Implement proper session management**

### User State Management

1. **Use `auth-context.tsx` for user state**
2. **Refresh profile data after subscription changes**
3. **Handle auth state changes gracefully**
4. **Provide loading states during auth operations**

## 🎨 UI/UX Rules

### User Experience

1. **Loading states for all async operations**
2. **Clear success/error feedback**
3. **Responsive design (mobile-first)**
4. **Accessible components**

### Component Standards

1. **Prefer server components when possible**
2. **Use Tailwind CSS for styling**
3. **Consistent spacing and typography**
4. **Reusable UI components in `components/ui/`**

### State Management

1. **Minimize client-side state**
2. **Use React Query for server state**
3. **Context for global user state only**
4. **Local state for component-specific data**

## 🧪 Testing Standards

### Development Testing

1. **Always test the happy path first**
2. **Test error conditions second**
3. **Use development tools:**

   ```bash
   curl "http://localhost:3000/api/dev/test-payment-flow" | jq .
   ```

4. **Verify database state after operations**

### Payment Testing

1. **Test complete payment flow end-to-end**
2. **Verify webhook processing**
3. **Test subscription state changes**
4. **Check plan limit enforcement**

### Manual Testing Checklist

- [ ] User can sign up and create profile
- [ ] Free users limited to 3 goals
- [ ] Payment flow completes successfully
- [ ] User immediately gets unlimited access
- [ ] Billing page shows correct status
- [ ] Manual sync works if webhooks fail

## 📝 Documentation Rules

### Code Documentation

1. **Document complex business logic**
2. **Include TypeScript JSDoc comments**
3. **Explain webhook processing flows**
4. **Document environment variable requirements**

### API Documentation

1. **Document all API endpoints**
2. **Include request/response examples**
3. **Document error conditions**
4. **Explain authentication requirements**

### User-Facing Documentation

1. **Clear setup instructions**
2. **Troubleshooting guides**
3. **FAQ for common issues**
4. **Step-by-step tutorials**

## 🚨 Critical Path Monitoring

### Payment System Health

1. **Webhooks must process within 30 seconds**
2. **Payment completion should update permissions immediately**
3. **Failed payments should be logged and retried**
4. **Subscription status should be synced regularly**

### User Experience Metrics

1. **Sign-up to first goal < 2 minutes**
2. **Payment to access < 1 minute**
3. **Goal creation success rate > 95%**
4. **Webhook processing success rate > 99%**

## 🔄 Deployment Rules

### Environment Management

1. **Never commit secrets to version control**
2. **Use environment variables for all configuration**
3. **Test environment variable changes**
4. **Document required variables**

### Production Deployment

1. **Test payment flow in staging first**
2. **Verify webhook endpoints are accessible**
3. **Monitor webhook delivery rates**
4. **Have rollback plan ready**

### Monitoring

1. **Log all payment events**
2. **Monitor webhook success rates**
3. **Alert on payment failures**
4. **Track user subscription states**

## 🎯 LLM-Specific Guidelines

### When Modifying Payment Code

1. **ALWAYS test with the diagnostic endpoint**
2. **Verify webhook processing still works**
3. **Check subscription state transitions**
4. **Test manual sync functionality**

### When Adding New Features

1. **Consider plan limitation impact**
2. **Update subscription checks if needed**
3. **Test with both free and premium users**
4. **Update diagnostic tools if needed**

### When Debugging Issues

1. **Start with diagnostic endpoint**
2. **Check Stripe Dashboard logs**
3. **Verify environment variables**
4. **Test webhook delivery manually**

### Communication Patterns

1. **Be specific about what was implemented**
2. **Provide testing commands**
3. **Document any breaking changes**
4. **Include rollback instructions if needed**

## ⚠️ Red Flags - Never Do These

1. **❌ Never bypass webhook validation in production**
2. **❌ Never hardcode secrets in code**
3. **❌ Never skip authentication checks**
4. **❌ Never ignore RLS policies**
5. **❌ Never deploy without testing payment flow**
6. **❌ Never make database changes without backups**
7. **❌ Never assume webhooks will always work**
8. **❌ Never let users pay without getting access**

## 📊 Success Criteria

### For Payment Features

- ✅ Diagnostic shows "healthy"
- ✅ Test payment completes successfully
- ✅ User permissions update immediately
- ✅ Manual sync works as fallback
- ✅ All webhook events process correctly

### For New Features

- ✅ Works with both plan types
- ✅ Respects plan limitations
- ✅ Has proper error handling
- ✅ Includes loading states
- ✅ Is properly documented

### For Bug Fixes

- ✅ Root cause identified and fixed
- ✅ Related issues prevented
- ✅ Regression tests added
- ✅ Documentation updated
- ✅ Monitoring alerts configured

---

**Remember: This is a production system handling real payments. User trust is paramount. When in doubt, prioritize reliability over features.** 💳✨
