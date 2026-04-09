const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('BROWSER_ERROR:', msg.text());
            } else {
                console.log('BROWSER_LOG:', msg.text());
            }
        });

        page.on('pageerror', err => {
            console.error('PAGE_ERROR:', err.message);
        });

        // Use networkidle0 to ensure the page is fully loaded and React renders
        await page.goto('http://localhost:5173/medical/dashboard', { waitUntil: 'networkidle0', timeout: 15000 });
        
        await new Promise(r => setTimeout(r, 2000));
        await browser.close();
        console.log('DONE');
    } catch (e) {
        console.error('SCRIPT_ERROR: ', e);
        process.exit(1);
    }
})();
