const fs = require('fs');

const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function(path, options) {
    const pathStr = path ? path.toString() : '';
    // Filter out node_modules logs to avoid cluttering, but keep config and local files
    if (!pathStr.includes('node_modules')) {
        console.log('[DEBUG-READ] readFileSync:', pathStr);
    }
    try {
        return originalReadFileSync.apply(this, arguments);
    } catch (err) {
        console.error('[DEBUG-READ] ERROR readFileSync:', pathStr, err);
        throw err;
    }
};

const originalReadSync = fs.readSync;
fs.readSync = function(fd, buffer, offset, length, position) {
    try {
        return originalReadSync.apply(this, arguments);
    } catch (err) {
        // Find path associated with fd if possible
        let pathStr = 'unknown fd';
        try {
            pathStr = fs.readFileSync(fd); // Wait, this might fail, let's just log fd
        } catch {}
        console.error('[DEBUG-READ] ERROR readSync fd:', fd, err);
        throw err;
    }
};

// Now import Vite and run build
import('vite').then(({ build }) => build()).catch(console.error);
