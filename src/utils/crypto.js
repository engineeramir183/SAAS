/**
 * crypto.js — Password hashing utilities
 *
 * Uses the Web Crypto API (SHA-256) for browser-compatible, synchronous-free hashing.
 *
 * Migration strategy (backward-compatible):
 *   - All NEW password writes store the SHA-256 hex digest.
 *   - Login flows try the hash first, then fall back to plaintext for existing accounts
 *     and silently upgrade the stored password on a successful plaintext match.
 *
 * NOTE: For maximum security, migrate to server-side bcrypt via a Supabase
 * Edge Function. SHA-256 is deterministic (no salt), so identical passwords produce
 * identical hashes. This is far safer than plaintext but not as strong as bcrypt.
 */

/**
 * Hash a password using SHA-256 with optional salt.
 * @param {string} password - The plaintext password to hash.
 * @param {string} salt - Optional salt to append to the password before hashing.
 * @returns {Promise<string>} Hex-encoded SHA-256 digest.
 */
export async function hashPassword(password, salt = '') {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
