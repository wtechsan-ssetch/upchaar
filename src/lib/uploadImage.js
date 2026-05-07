/**
 * uploadImage.js
 * ─────────────────────────────────────────────────────────────────
 * Supabase Storage upload helpers.
 *
 *   uploadAvatar(file, userId)      → public URL for profile pictures
 *   uploadBlogImage(file, userId)   → public URL for blog cover images
 *
 * Both functions:
 *  - Upload the file to the correct bucket/path
 *  - Return the permanent public URL (suitable for storing in DB or state)
 *  - Throw a user-friendly Error on failure
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from '@/lib/supabase.js';

/**
 * Get the file extension from a File object.
 * Falls back to 'jpg' if the type is unknown.
 */
function getExtension(file) {
    const type = file.type || '';
    const map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
    };
    return map[type] || 'jpg';
}

/**
 * uploadAvatar
 * Uploads a user's profile picture to the `avatars` bucket.
 *
 * Path: avatars/{userId}/avatar.{ext}
 * Overwrites any existing avatar for this user.
 *
 * @param {File}   file    - The image File selected by the user
 * @param {string} userId  - Supabase auth user ID (UUID)
 * @returns {Promise<string>} The public URL of the uploaded avatar
 */
export async function uploadAvatar(file, userId) {
    if (!file || !userId) throw new Error('File and user ID are required.');

    const ext = getExtension(file);
    const path = `${userId}/avatar.${ext}`;

    // upsert: true overwrites the existing avatar file
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
            contentType: file.type,
            upsert: true,
        });

    if (uploadError) {
        console.error('[uploadAvatar]', uploadError.message);
        throw new Error('Failed to upload profile picture. Please try again.');
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    // Append a cache-busting query param so the browser reloads immediately
    return `${data.publicUrl}?t=${Date.now()}`;
}

/**
 * uploadBlogImage
 * Uploads a blog cover/inline image to the `blog-images` bucket.
 *
 * Path: blog-images/{userId}/{timestamp}.{ext}
 * Each upload creates a new file (timestamped) to avoid conflicts.
 *
 * @param {File}   file    - The image File selected by the blogger
 * @param {string} userId  - Supabase auth user ID (UUID)
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export async function uploadBlogImage(file, userId) {
    if (!file || !userId) throw new Error('File and user ID are required.');

    const ext = getExtension(file);
    const timestamp = Date.now();
    const path = `${userId}/${timestamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(path, file, {
            contentType: file.type,
            upsert: false,
        });

    if (uploadError) {
        console.error('[uploadBlogImage]', uploadError.message);
        throw new Error('Failed to upload image. Please try again.');
    }

    const { data } = supabase.storage.from('blog-images').getPublicUrl(path);
    return data.publicUrl;
}

/**
 * getStorageUrl
 * Resolves a storage path or URL into a final public URL.
 * 
 * @param {string} path   - The path stored in DB (e.g. "avatars/123.jpg") or a full URL
 * @param {string} bucket - The fallback bucket name if path is just a filename
 * @returns {string|null}  - The resolved public URL
 */
export function getStorageUrl(path, bucket = 'avatars') {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    
    // If it's a raw path, get the public URL from Supabase
    try {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data?.publicUrl || null;
    } catch (err) {
        console.error('[getStorageUrl] Error resolving path:', path, err);
        return null;
    }
}
