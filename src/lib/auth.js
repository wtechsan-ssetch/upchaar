export const PASSWORD_RULE_MESSAGE =
    'Password must include uppercase, lowercase, a number, and a special character.';

export const AUTH_TIMEOUT_MS = 15000;

export function isStrongPassword(password) {
    return /[a-z]/.test(password)
        && /[A-Z]/.test(password)
        && /\d/.test(password)
        && /[^A-Za-z0-9]/.test(password);
}

export function withAuthTimeout(promise, message = 'Authentication request timed out. Please try again.') {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS);
        }),
    ]);
}
