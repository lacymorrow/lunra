# 📚 LLM Documentation Index - Lunra Project

## 🎯 Welcome, Future LLM

This is your comprehensive guide to working on the **Lunra AI Goal Setting Application**. Start here to understand the entire system quickly and work effectively.

## 📋 Essential Documents (Read First)

### 1. 🤖 [LLM_PROJECT_GUIDE.md](./LLM_PROJECT_GUIDE.md)

**Purpose:** Complete project overview and architecture understanding
**Read when:** Starting work on this project
**Contains:**

- Technology stack and system architecture
- Database schema and relationships
- Payment system flow
- File organization and critical components
- Security model and access control
- Common issues and solutions

### 2. 🤖 [LLM_RULES_AND_CONVENTIONS.md](./LLM_RULES_AND_CONVENTIONS.md)

**Purpose:** Development rules, conventions, and best practices
**Read when:** Before making any code changes
**Contains:**

- Core development principles
- File management and naming conventions
- Payment flow critical rules
- Database and authentication standards
- Testing requirements
- What NEVER to do (red flags)

### 3. 🔌 [LLM_API_REFERENCE.md](./LLM_API_REFERENCE.md)

**Purpose:** Complete API and service function reference
**Read when:** Implementing features or debugging issues
**Contains:**

- All API endpoints with examples
- Service function signatures and usage
- React hooks and components
- Business logic patterns
- Error handling patterns
- Quick reference commands

## 📖 Implementation-Specific Guides

### Payment & Webhook Documentation

#### 4. 🔗 [WEBHOOK_ENDPOINTS.md](./WEBHOOK_ENDPOINTS.md)

- Webhook endpoint configuration
- Environment setup instructions
- Stripe Dashboard configuration
- Testing and monitoring

#### 5. 🚀 [WEBHOOK_IMPLEMENTATION_SUMMARY.md](./WEBHOOK_IMPLEMENTATION_SUMMARY.md)

- Recent implementation details
- What was built and why
- Setup instructions
- Next steps

#### 6. 💳 [PAYMENT_TROUBLESHOOTING.md](./PAYMENT_TROUBLESHOOTING.md)

- Complete payment flow troubleshooting
- Common issues and solutions
- System health indicators
- Recovery procedures

### Setup & Configuration

#### 7. 🚨 [STRIPE_NO_WEBHOOKS.md](./STRIPE_NO_WEBHOOKS.md)

- Webhook configuration issues
- Quick fixes and workarounds
- Manual sync procedures

#### 8. 🔧 [scripts/setup-webhook-secrets.sh](./scripts/setup-webhook-secrets.sh)

- Automated environment setup script
- Webhook secret configuration

## 🚀 Quick Start Guide

### For New LLMs (5-minute setup)

1. **Understand the system:**

   ```bash
   # Read: LLM_PROJECT_GUIDE.md (architecture overview)
   # Read: LLM_RULES_AND_CONVENTIONS.md (development rules)
   ```

2. **Check system health:**

   ```bash
   curl "http://localhost:3000/api/dev/test-payment-flow" | jq .
   ```

3. **Verify what you're seeing:**
   - `"overallHealth": "healthy"` = Everything working
   - `"overallHealth": "critical"` = Check `criticalIssues` array

4. **Test payment flow:**

   ```bash
   # Use test card: 4242 4242 4242 4242
   # Verify webhook processing in logs
   # Check user permissions update
   ```

### For Specific Tasks

#### Working on Payment Features

1. Read: `PAYMENT_TROUBLESHOOTING.md`
2. Read: `LLM_API_REFERENCE.md` (webhook endpoints)
3. Test: Run diagnostic before and after changes
4. Verify: Webhook processing works end-to-end

#### Adding New Features

1. Read: `LLM_RULES_AND_CONVENTIONS.md` (development rules)
2. Check: Plan limitation impact
3. Reference: `LLM_API_REFERENCE.md` (service functions)
4. Test: With both free and premium users

#### Debugging Issues

1. Start: `curl "http://localhost:3000/api/dev/test-payment-flow"`
2. Reference: `PAYMENT_TROUBLESHOOTING.md`
3. Check: Stripe Dashboard webhook logs
4. Reference: `LLM_API_REFERENCE.md` (error patterns)

## 🎯 Key Concepts to Understand

### Critical Business Logic

- **Seedling Plan:** Free, 3 goals maximum
- **Bloom Plan:** $9/month, unlimited goals
- **Payment Flow:** Stripe → Webhook → Database → User Permissions
- **Goal Limits:** Enforced client + server side

### System Architecture

```
User Auth (Supabase) → Profile Management → Plan Limits → Goal Creation
                                    ↓
Payment (Stripe) → Webhooks → Subscription Management → Permission Updates
```

### Data Flow

```
Sign Up → Profile (Seedling) → Limited Goals → Upgrade → Payment → Webhook → Unlimited Goals
```

## 🚨 Critical Rules Reminder

### Never Do These

- ❌ Bypass webhook validation in production
- ❌ Skip authentication checks
- ❌ Ignore plan limitations
- ❌ Let users pay without getting access
- ❌ Deploy without testing payment flow

### Always Do These

- ✅ Test with diagnostic endpoint before/after changes
- ✅ Verify webhook processing works
- ✅ Check plan limit enforcement
- ✅ Provide manual sync fallback
- ✅ Log errors with emoji prefixes

## 📊 System Health Indicators

### Healthy System

- Diagnostic shows `"overallHealth": "healthy"`
- Webhook events process successfully (check logs)
- Test payment grants immediate access
- Users can create goals within limits
- Manual sync works as fallback

### Problem Indicators

- Diagnostic shows critical issues
- Webhook signature verification fails
- Users pay but stay on free plan
- Goal creation fails or ignores limits
- Manual sync errors

## 🔍 Debugging Workflow

1. **Check system health:**

   ```bash
   curl "http://localhost:3000/api/dev/test-payment-flow" | jq .
   ```

2. **Identify the issue:**
   - Payment processing: Check Stripe configuration
   - Webhook processing: Check webhook secrets
   - User permissions: Check database records
   - Goal limits: Check plan enforcement

3. **Use the right tool:**
   - Payment issues: `PAYMENT_TROUBLESHOOTING.md`
   - API questions: `LLM_API_REFERENCE.md`
   - Development rules: `LLM_RULES_AND_CONVENTIONS.md`
   - Architecture questions: `LLM_PROJECT_GUIDE.md`

## 🎉 Success Metrics

After making changes, verify:

- [ ] Diagnostic endpoint shows "healthy"
- [ ] Test payment flow works end-to-end  
- [ ] User gets immediate access after payment
- [ ] Plan limits are enforced correctly
- [ ] Manual sync works if webhooks fail
- [ ] All existing functionality still works

## 💡 Pro Tips for LLMs

1. **Always start with the diagnostic endpoint** - it tells you everything
2. **The payment flow is the critical path** - users expect immediate access
3. **Plan limits must be enforced everywhere** - client and server
4. **Webhooks can fail** - always provide manual sync fallback
5. **Log everything with emoji prefixes** - makes debugging easier
6. **Test with both plan types** - free and premium users
7. **When in doubt, prioritize reliability** over new features

## 📞 Getting Help

If you're stuck:

1. Run the diagnostic endpoint
2. Check the specific guide for your issue
3. Look for similar patterns in existing code
4. Test your hypothesis with the development tools
5. Remember: this system handles real payments - be careful!

---

**Welcome to the Lunra codebase! This system is production-ready and handles real user payments. Follow the guides, test thoroughly, and prioritize user experience. Happy coding! 🚀**

---

## 📋 Document Change Log

- **2025-06-10:** Initial comprehensive documentation created
- **Payment System:** Multiple webhook endpoints implemented
- **Testing:** Diagnostic tools enhanced
- **Status:** Production-ready with robust error handling

*Keep this index updated when adding new documentation!*
