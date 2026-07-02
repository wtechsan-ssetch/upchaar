/**
 * rateLimit.js
 * ─────────────────────────────────────────────────
 * Client-side rate limiter as a secondary DDoS / brute-force defense.
 *
 * Uses an in-memory sliding window per action key.
 * Primary DDoS protection should be handled at the network level (Cloudflare).
 *
 * Usage:
 *   import { checkRateLimit, getRemainingCooldown } from '@/lib/rateLimit.js';
 *
 *   // Will throw if the user has exceeded the limit
 *   checkRateLimit('sign_in');
 * ─────────────────────────────────────────────────
 */

// In-memory store: { [key]: timestamp[] }
const attemptStore = {};

/**
 * Rate limit configuration per action key.
 * maxAttempts: how many attempts are allowed
 * windowMs: within this time window (in milliseconds)
 * cooldownMs: how long to block after exceeding limit
 */
const RATE_LIMIT_CONFIG = {
    sign_in: {
        maxAttempts: 5,
        windowMs: 5 * 60 * 1000,      // 5 minutes
        cooldownMs: 10 * 60 * 1000,   // 10 minute lockout
        label: 'Sign in',
    },
    sign_up: {
        maxAttempts: 3,
        windowMs: 10 * 60 * 1000,     // 10 minutes
        cooldownMs: 15 * 60 * 1000,   // 15 minute lockout
        label: 'Sign up',
    },
    send_otp: {
        maxAttempts: 3,
        windowMs: 5 * 60 * 1000,      // 5 minutes
        cooldownMs: 10 * 60 * 1000,   // 10 minute lockout
        label: 'OTP sending',
    },
    verify_otp: {
        maxAttempts: 5,
        windowMs: 5 * 60 * 1000,      // 5 minutes
        cooldownMs: 10 * 60 * 1000,   // 10 minute lockout
        label: 'OTP verification',
    },
    api_request: {
        maxAttempts: 60,
        windowMs: 1 * 60 * 1000,      // 1 minute
        cooldownMs: 2 * 60 * 1000,    // 2 minute cooldown
        label: 'API request',
    },
    forgot_password: {
        maxAttempts: 3,
        windowMs: 10 * 60 * 1000,     // 10 minutes
        cooldownMs: 10 * 60 * 1000,   // 10 minute lockout
        label: 'Password reset',
    },
};

/** Persists lockouts in sessionStorage so page refresh doesn't bypass them. */
const LOCKOUT_KEY_PREFIX = 'rl_lockout_';

function getLockout(key) {
    try {
        const raw = sessionStorage.getItem(LOCKOUT_KEY_PREFIX + key);
        if (!raw) return null;
        const val = parseInt(raw, 10);
        if (isNaN(val)) return null;
        return val; // Unix timestamp (ms) when lockout expires
    } catch {
        return null;
    }
}

function setLockout(key, durationMs) {
    try {
        const expiresAt = Date.now() + durationMs;
        sessionStorage.setItem(LOCKOUT_KEY_PREFIX + key, String(expiresAt));
    } catch {
        // sessionStorage unavailable (private browsing, etc.) — fail open
    }
}

function clearLockout(key) {
    try {
        sessionStorage.removeItem(LOCKOUT_KEY_PREFIX + key);
    } catch { /* ignore */ }
}

/**
 * Returns how many milliseconds remain in the current lockout (0 if not locked).
 */
export function getRemainingCooldown(key) {
    const expiresAt = getLockout(key);
    if (!expiresAt) return 0;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
        clearLockout(key);
        return 0;
    }
    return remaining;
}

/**
 * Returns a human-readable countdown string like "8m 32s".
 */
export function formatCooldown(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

/**
 * Records an attempt for the given key and throws if the limit is exceeded.
 * @param {string} key - One of the keys in RATE_LIMIT_CONFIG
 * @throws {Error} with a user-friendly message if rate limit exceeded
 */
export function checkRateLimit(key) {
    const config = RATE_LIMIT_CONFIG[key];
    if (!config) return; // Unknown key — fail open

    // Check persistent lockout first
    const remaining = getRemainingCooldown(key);
    if (remaining > 0) {
        throw new Error(
            `Too many ${config.label.toLowerCase()} attempts. Please wait ${formatCooldown(remaining)} before trying again.`
        );
    }

    const now = Date.now();
    if (!attemptStore[key]) attemptStore[key] = [];

    // Slide the window — remove timestamps older than windowMs
    attemptStore[key] = attemptStore[key].filter(t => now - t < config.windowMs);

    // Record this attempt
    attemptStore[key].push(now);

    // Check if limit exceeded
    if (attemptStore[key].length > config.maxAttempts) {
        setLockout(key, config.cooldownMs);
        attemptStore[key] = []; // Reset in-memory list

        throw new Error(
            `Too many ${config.label.toLowerCase()} attempts. Please wait ${formatCooldown(config.cooldownMs)} before trying again.`
        );
    }
}

/**
 * Manually clear all rate limit data (e.g. on successful sign in).
 */
export function clearRateLimit(key) {
    delete attemptStore[key];
    clearLockout(key);
}
