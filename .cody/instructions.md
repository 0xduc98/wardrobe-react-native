# Wardrobe Project - Cody AI Instructions

## Project Overview

This is a React Native application for a wardrobe management and virtual try-on system. The backend API is documented in the `docs_agent` folder.

## 🚨 MANDATORY: Antigravity Agent Rules

**CRITICAL**: You are **Antigravity**. You MUST strictly follow the rules defined in **`docs_agent/ANTIGRAVITY_RULES.md`**. This is your primary directive. Before implementing any feature, API call, or model interaction, consult the documentation in the `docs_agent/` folder.

## 📚 Documentation Files (Required Reading)

1. **`docs_agent/API_DOCUMENTATION.md`**

   - Complete backend API reference
   - All endpoints, request/response formats, authentication, error handling
   - **When to use**: Before implementing ANY API calls or backend integrations

2. **`docs_agent/MODELS_DOCUMENTATION.md`**

   - Database models and ML model specifications
   - All data structures with exact field names and types
   - **When to use**: When working with data structures or state management

3. **`docs_agent/USER_FLOW.md`**

   - Visual flowchart of user interactions
   - **When to use**: When designing screens or navigation flows

4. **`docs_agent/USER_JOURNEY.md`**

   - Detailed user decision-making process
   - **When to use**: When implementing UX logic or outfit recommendations

5. **`docs_agent/QUICK_REFERENCE.md`**
   - Fast lookup cheat sheet for common patterns
   - **When to use**: For quick reference during development

## 🎯 Core Development Principles

### 1. Documentation-First Approach

**ALWAYS**:

- ✅ **Read the documentation first** - Check `docs_agent/` before implementing
- ✅ **Match exact specifications** - Use exact field names, endpoints, and formats from docs
- ✅ **Follow documented patterns** - Don't invent new patterns when docs provide them
- ✅ **Use documented examples** - Refer to workflow examples in API_DOCUMENTATION.md

**NEVER**:

- ❌ Guess API endpoints or data structures
- ❌ Make assumptions about field names or types
- ❌ Skip reading documentation to save time
- ❌ Implement features without checking documented patterns

### 2. API Integration

**Rules**:

- Check `docs_agent/API_DOCUMENTATION.md` for all endpoints
- Use exact request/response formats documented
- Implement proper authentication (JWT + Refresh Token)
- Handle all documented HTTP status codes (400, 401, 403, 404, 413, 422, 429, 500, 501)
- Validate files before upload (size, type, format)
- Implement rate limiting awareness

### 3. Data Models

**Rules**:

- Check `docs_agent/MODELS_DOCUMENTATION.md` for all data structures
- Use exact field names and types as documented
- Respect relationships and constraints
- Use UUIDs for IDs (not integers)
- Use ISO 8601 timestamps for dates

### 4. User Experience

**Rules**:

- Follow the flow from `docs_agent/USER_FLOW.md`
- Implement context-aware logic from `docs_agent/USER_JOURNEY.md`
- Provide fallbacks when processing fails
- Allow manual correction before final save
- Support "Edit & Retry" workflow

### 5. Code Quality

**ALWAYS**:

- ✅ Add TypeScript types for all API responses
- ✅ Use environment variables (never hardcode URLs/tokens)
- ✅ Implement loading states
- ✅ Show meaningful error messages
- ✅ Add retry logic for network errors
- ✅ Log for debugging (but never log sensitive data)

**NEVER**:

- ❌ Use `any` type
- ❌ Hardcode credentials
- ❌ Silently fail
- ❌ Block UI during operations
- ❌ Store passwords in plain text
- ❌ Ignore TypeScript errors

### 6. Security

**MUST implement**:

- ✅ Secure token storage (Keychain/Keystore, NOT AsyncStorage)
- ✅ Token refresh before expiry
- ✅ HTTPS for all API calls
- ✅ Input sanitization
- ✅ File validation before upload
- ✅ Proper logout (revoke refresh token)

**NEVER**:

- ❌ Log sensitive data (tokens, passwords)
- ❌ Store credentials in plain text
- ❌ Skip SSL verification
- ❌ Trust client-side validation alone

## 📖 Development Workflow

### Before Starting ANY Task:

1. **Read** relevant sections from `docs_agent/` documentation
2. **Understand** the documented patterns and examples
3. **Plan** implementation following documented structure
4. **Implement** matching exact specifications
5. **Test** against documented behavior
6. **Verify** error handling matches documented patterns

### Quick Lookup Process:

```
Need API endpoint?          → docs_agent/API_DOCUMENTATION.md
Need data structure?        → docs_agent/MODELS_DOCUMENTATION.md
Need user flow?             → docs_agent/USER_FLOW.md
Need business logic?        → docs_agent/USER_JOURNEY.md
Need quick reference?       → docs_agent/QUICK_REFERENCE.md
```

## 🎓 Key Reminders

1. **Single Source of Truth**: `docs_agent/` folder contains all specifications
2. **No Duplication**: Don't duplicate doc content here - always reference the source
3. **Stay Synchronized**: When docs update, behavior updates automatically
4. **No Assumptions**: If it's not in the docs, ask or check the backend
5. **Exact Matching**: Field names, endpoints, formats must match exactly

## 📝 When in Doubt

1. Check `docs_agent/QUICK_REFERENCE.md` first
2. Read relevant section in `docs_agent/API_DOCUMENTATION.md` or `docs_agent/MODELS_DOCUMENTATION.md`
3. Look for examples in the documentation
4. Follow documented patterns, never improvise

---

**Remember**: This file provides principles and reminders. All detailed specifications live in `docs_agent/` folder.

**Last Updated**: January 13, 2026
