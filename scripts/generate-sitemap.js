import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wusyykhngnxglvftrmrb.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1c3l5a2huZ254Z2x2ZnRybXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDE4MTksImV4cCI6MjA4NzYxNzgxOX0.t4HrTIT-NQida5UgA56M6IGVkuf2RDLt1zI19mAhH_I';

const BASE_URL = 'https://upcharhealth.com';

const staticRoutes = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/doctors', priority: '0.9', changefreq: 'daily' },
    { url: '/diagnostics', priority: '0.8', changefreq: 'weekly' },
    { url: '/hospitals', priority: '0.8', changefreq: 'weekly' },
    { url: '/medicals', priority: '0.8', changefreq: 'weekly' },
    { url: '/emergency', priority: '0.7', changefreq: 'monthly' },
    { url: '/blogs', priority: '0.8', changefreq: 'daily' },
    { url: '/about', priority: '0.6', changefreq: 'monthly' },
    { url: '/support', priority: '0.6', changefreq: 'monthly' },
    { url: '/terms', priority: '0.3', changefreq: 'monthly' },
    { url: '/privacy-policy', priority: '0.3', changefreq: 'monthly' },
    { url: '/login', priority: '0.5', changefreq: 'monthly' },
    { url: '/register', priority: '0.5', changefreq: 'monthly' },
    { url: '/patient/login', priority: '0.4', changefreq: 'monthly' },
    { url: '/patient/register', priority: '0.4', changefreq: 'monthly' },
    { url: '/doctor/login', priority: '0.4', changefreq: 'monthly' },
];

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

async function generateSitemap() {
    console.log('🔄 Generating sitemap.xml...');

    let posts = [];
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data, error } = await supabase
            .from('posts')
            .select('id, title, slug, status, updated_at, published_at')
            .eq('status', 'published')
            .order('published_at', { ascending: false });

        if (error) {
            console.error('⚠️ Error fetching blog posts from Supabase:', error.message);
        } else if (data) {
            posts = data;
        }
    } catch (e) {
        console.error('⚠️ Supabase connection error:', e.message);
    }

    console.log(`📌 Found ${posts.length} published blog post(s).`);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    xml += `  <!-- Core Public Pages -->\n`;
    for (const route of staticRoutes) {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}${route.url}</loc>\n`;
        xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
        xml += `    <priority>${route.priority}</priority>\n`;
        xml += `  </url>\n`;
    }

    xml += `\n  <!-- Blog Posts (Dynamic) -->\n`;
    for (const post of posts) {
        if (!post.slug) continue;
        const lastmodDate = post.updated_at || post.published_at;
        const lastmod = lastmodDate ? new Date(lastmodDate).toISOString().split('T')[0] : null;

        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/blogs/${escapeXml(post.slug)}</loc>\n`;
        if (lastmod) {
            xml += `    <lastmod>${lastmod}</lastmod>\n`;
        }
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    const publicSitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
    fs.writeFileSync(publicSitemapPath, xml, 'utf8');
    console.log(`✅ Written sitemap to: ${publicSitemapPath}`);

    const distDir = path.join(rootDir, 'dist');
    if (fs.existsSync(distDir)) {
        const distSitemapPath = path.join(distDir, 'sitemap.xml');
        fs.writeFileSync(distSitemapPath, xml, 'utf8');
        console.log(`✅ Written sitemap to: ${distSitemapPath}`);
    }
}

generateSitemap().catch(err => {
    console.error('❌ Sitemap generation failed:', err);
    process.exit(1);
});
