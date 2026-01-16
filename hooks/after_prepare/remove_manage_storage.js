#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var manifestPath = path.join('platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
    var data = fs.readFileSync(manifestPath, 'utf8');
    data = data.replace(/<uses-permission android:name="android\.permission\.MANAGE_EXTERNAL_STORAGE"[^>]*\/>/g, '');
    fs.writeFileSync(manifestPath, data);
    console.log('Removed MANAGE_EXTERNAL_STORAGE permission');
}
