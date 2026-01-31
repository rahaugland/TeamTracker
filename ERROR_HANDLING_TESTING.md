# Error Handling & Logging - Testing Guide

This guide helps you test all the error handling and logging features to ensure everything works correctly.

## Pre-Testing Setup

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open browser DevTools**
   - Press F12 or right-click > Inspect
   - Open the Console tab to see logs
   - Keep Network tab available for offline testing

3. **Ensure you're logged in**
   - Navigate to `/login` if needed
   - Sign in with your test account

## Test Checklist

### 1. Toast Notifications ✅

#### Test Success Toast
- [ ] Navigate to `/error-handling-example` (or any page)
- [ ] Click "Success Toast" button
- [ ] Green toast appears in bottom-right
- [ ] Toast has checkmark icon
- [ ] Toast auto-dismisses after ~5 seconds
- [ ] Can manually dismiss with X button

#### Test Error Toast
- [ ] Click "Error Toast" button
- [ ] Red toast appears
- [ ] Toast has error icon
- [ ] Toast displays with title and message
- [ ] Can dismiss manually

#### Test Warning Toast
- [ ] Click "Warning Toast" button
- [ ] Yellow toast appears
- [ ] Toast has warning icon

#### Test Info Toast
- [ ] Click "Info Toast" button
- [ ] Blue toast appears
- [ ] Toast has info icon

#### Test Multiple Toasts
- [ ] Click multiple toast buttons quickly
- [ ] Toasts stack vertically
- [ ] Each toast dismisses independently
- [ ] New toasts appear at bottom of stack

### 2. API Error Handling ✅

#### Test Successful API Call
- [ ] Click "Successful API Call" button
- [ ] Green success toast appears
- [ ] Console shows debug logs for API call
- [ ] No errors in console

#### Test Failed API Call
- [ ] Click "Failed API Call" button
- [ ] Red error toast appears with user-friendly message
- [ ] Console shows error log with details
- [ ] Error is translated (check language switcher)

#### Test Different Error Types
- [ ] Click "Network Error" button
- [ ] Toast shows network offline message
- [ ] Click "Unauthorized (401)" button
- [ ] Toast shows unauthorized message
- [ ] Click "Not Found (404)" button
- [ ] Toast shows not found message
- [ ] Click "Validation Error" button
- [ ] Toast shows validation error message

### 3. Logging System ✅

#### Test Log Levels
- [ ] Click "Trigger Logging Examples" button
- [ ] Open browser console
- [ ] Verify logs appear with different levels:
  - [ ] DEBUG log (gray color)
  - [ ] INFO log (blue color)
  - [ ] WARN log (orange color)
  - [ ] ERROR log (red color)
- [ ] Each log has timestamp
- [ ] Each log has context data
- [ ] Info toast confirms to check console

#### Test Log Context
- [ ] Verify logs include:
  - [ ] User ID (if logged in)
  - [ ] Page name
  - [ ] Action/operation name
  - [ ] Additional context data

#### Test Sensitive Data Sanitization
- [ ] Check that passwords/tokens are [REDACTED] in logs
- [ ] Open browser console
- [ ] Look for any logs with sensitive data
- [ ] Confirm sensitive fields are sanitized

### 4. Error Boundary ✅

#### Test React Error Catching
- [ ] Click "Throw Error (Test Error Boundary)" button
- [ ] Component should crash gracefully
- [ ] Error boundary fallback UI appears
- [ ] Fallback shows:
  - [ ] Error icon
  - [ ] "Something Went Wrong" message
  - [ ] "Try Again" button
  - [ ] "Go Home" button
- [ ] In dev mode, error details are visible
- [ ] Error is logged to console

#### Test Error Recovery
- [ ] Click "Try Again" button
- [ ] Page reloads and error is cleared
- [ ] Or click "Go Home"
- [ ] Navigates to dashboard
- [ ] Error is cleared

### 5. Offline Handling ✅

#### Test Offline Detection
- [ ] Open DevTools > Network tab
- [ ] Set throttling to "Offline"
- [ ] Orange offline banner appears at top
- [ ] Banner shows "Offline" message with wifi icon
- [ ] Check console for offline log message

#### Test Network Status Display
- [ ] Go to `/error-handling-example`
- [ ] View "Network Status" card
- [ ] Red dot shows when offline
- [ ] Status says "Offline"

#### Test Going Back Online
- [ ] Set network throttling to "Online"
- [ ] Offline banner disappears smoothly
- [ ] Network status shows green dot
- [ ] Status says "Online"
- [ ] Check console for online log message

#### Test Offline API Calls
- [ ] Set network to offline
- [ ] Try an API call (e.g., load players)
- [ ] Error toast shows offline message
- [ ] Error indicates user is offline
- [ ] Retry is suggested

### 6. Service Error Handling ✅

#### Test Teams Service
- [ ] Navigate to Teams page
- [ ] Try creating a team
- [ ] Success toast appears on success
- [ ] Error toast appears on failure
- [ ] Check console for structured logs

#### Test Players Service
- [ ] Navigate to Players page
- [ ] Try creating a player
- [ ] Success toast appears on success
- [ ] Error toast appears on failure
- [ ] Verify error messages are translated

#### Test Error with Retry
- [ ] Set network to slow 3G (in DevTools)
- [ ] Load a page with API calls
- [ ] Watch console for retry attempts
- [ ] Should see "Retrying operation" messages
- [ ] Exponential backoff (1s, 2s, 4s delays)

### 7. Internationalization ✅

#### Test English Error Messages
- [ ] Set language to English
- [ ] Trigger various errors
- [ ] All error toasts show English messages
- [ ] Error messages are clear and user-friendly

#### Test Norwegian Error Messages
- [ ] Set language to Norwegian
- [ ] Trigger various errors
- [ ] All error toasts show Norwegian messages
- [ ] Translations are accurate

#### Test Success Messages
- [ ] Test in both languages
- [ ] Success toasts are translated
- [ ] Toast titles are translated

### 8. Session Management ✅

#### Test Session Refresh on 401
This is harder to test without actually expiring a session, but you can:
- [ ] Check code in `api-error-handler.ts`
- [ ] Verify `refreshSessionIfNeeded()` is called on 401
- [ ] Review retry logic after refresh
- [ ] Test with expired session (if possible)

### 9. User Experience ✅

#### Test Toast Accessibility
- [ ] Navigate with keyboard only
- [ ] Tab to toast dismiss button
- [ ] Press Enter to dismiss
- [ ] Screen reader announces toast (if available)

#### Test Error Message Clarity
- [ ] Read all error messages
- [ ] Verify they are:
  - [ ] User-friendly (no technical jargon)
  - [ ] Actionable (tell user what to do)
  - [ ] Specific (not just "An error occurred")
  - [ ] Properly translated

#### Test Visual Feedback
- [ ] All toasts have appropriate colors
- [ ] Icons are visible and meaningful
- [ ] Animations are smooth
- [ ] Text is readable
- [ ] Contrasts meet accessibility standards

### 10. Component Integration ✅

#### Test in Real Pages

**Players Page**
- [ ] Load players list
- [ ] Create new player
- [ ] Edit player
- [ ] Delete player
- [ ] All actions show appropriate toasts
- [ ] Errors are handled gracefully

**Teams Page**
- [ ] Load teams list
- [ ] Create new team
- [ ] Edit team
- [ ] Delete team
- [ ] All actions show appropriate toasts

**Events/Schedule Page**
- [ ] Load events
- [ ] Create event
- [ ] RSVP to event
- [ ] Mark attendance
- [ ] All actions show toasts

### 11. Edge Cases ✅

#### Test Rapid Actions
- [ ] Click multiple buttons quickly
- [ ] Toasts stack correctly
- [ ] No performance issues
- [ ] No console errors

#### Test Long Error Messages
- [ ] Trigger error with long message
- [ ] Toast displays properly
- [ ] Text doesn't overflow
- [ ] Still dismissible

#### Test Network Fluctuation
- [ ] Toggle network on/off repeatedly
- [ ] Offline indicator responds correctly
- [ ] No duplicate banners
- [ ] State updates properly

## Console Checks

While testing, verify the console shows:

### Expected Logs
- [ ] API call started messages (debug level)
- [ ] API call succeeded messages (debug level)
- [ ] API call failed messages (error level)
- [ ] Network status changes (info/warn level)
- [ ] Session refresh attempts (info level)
- [ ] Retry attempts with delay info (info level)

### No Unexpected Output
- [ ] No uncaught errors
- [ ] No unhandled promise rejections
- [ ] No memory leaks
- [ ] No duplicate logs

## Performance Testing

### Load Testing
- [ ] Load page with many toasts
- [ ] No lag or jank
- [ ] Animations remain smooth
- [ ] Memory usage reasonable

### Network Testing
- [ ] Test with slow 3G
- [ ] Test with offline
- [ ] Test with fast 4G
- [ ] App remains responsive

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

For each browser, verify:
- [ ] Toasts display correctly
- [ ] Animations work
- [ ] Offline detection works
- [ ] Console logs appear
- [ ] No browser-specific errors

## Mobile Testing (if applicable)

- [ ] Toast position works on mobile
- [ ] Toasts don't block important UI
- [ ] Touch to dismiss works
- [ ] Offline banner doesn't overlap content
- [ ] Error boundary works on mobile

## Final Checks

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] All imports resolve
- [ ] No unused variables

### Documentation
- [ ] README files are clear
- [ ] Code examples work
- [ ] Comments are accurate
- [ ] Guide is helpful

### Production Readiness
- [ ] Environment check works (dev vs prod)
- [ ] Sensitive data is sanitized
- [ ] External logging hooks are ready
- [ ] Performance is acceptable

## Issues Found

Document any issues found during testing:

| Issue | Severity | Steps to Reproduce | Expected | Actual |
|-------|----------|-------------------|----------|--------|
|       |          |                   |          |        |

## Sign-off

- [ ] All critical tests pass
- [ ] No blocking issues found
- [ ] Documentation is complete
- [ ] Code is ready for production
- [ ] Team has been notified

**Tested by**: _________________
**Date**: _________________
**Version**: TeamTracker 0.1.0

## Notes

Add any additional notes or observations here:

---

## Quick Test Script

For rapid testing, use this sequence:

1. Open app in browser
2. Open DevTools console
3. Navigate to `/error-handling-example`
4. Click all toast buttons → verify toasts
5. Click all error simulation buttons → verify error handling
6. Click logging example → check console
7. Set network to offline → check indicator
8. Set network to online → check indicator disappears
9. Click throw error button → verify error boundary
10. Switch language → verify translations
11. Navigate to real pages → test actual functionality

**Expected time**: 10-15 minutes for full test

**Critical tests** (must pass):
- Toast notifications work
- Error messages display
- Offline indicator appears
- Error boundary catches errors
- Console logging works
- Translations work

If all critical tests pass, the implementation is functional!
