#!/usr/bin/env node

/**
 * Script to test sitemap generation
 * Usage: node scripts/test-sitemap.js [url]
 * Example: node scripts/test-sitemap.js https://your-site.vercel.app
 */

const https = require('https');
const http = require('http');

const url = process.argv[2] || 'http://localhost:3000';
const sitemapUrl = `${url}/sitemap.xml`;

console.log('🔍 Testing sitemap...');
console.log('📍 URL:', sitemapUrl);
console.log('');

const protocol = sitemapUrl.startsWith('https') ? https : http;

protocol.get(sitemapUrl, (res) => {
  let data = '';

  console.log('📡 Status Code:', res.statusCode);
  console.log('📄 Content-Type:', res.headers['content-type']);
  console.log('');

  if (res.statusCode !== 200) {
    console.error('❌ Error: Sitemap returned status', res.statusCode);
    return;
  }

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      // Count URLs in sitemap
      const urlMatches = data.match(/<url>/g);
      const urlCount = urlMatches ? urlMatches.length : 0;

      console.log('✅ Sitemap loaded successfully!');
      console.log('📊 Total URLs:', urlCount);
      console.log('');

      // Extract and display sample URLs
      const locMatches = data.match(/<loc>(.*?)<\/loc>/g);
      if (locMatches && locMatches.length > 0) {
        console.log('📋 Sample URLs (first 10):');
        locMatches.slice(0, 10).forEach((loc, index) => {
          const url = loc.replace(/<\/?loc>/g, '');
          console.log(`${index + 1}. ${url}`);
        });
        
        if (locMatches.length > 10) {
          console.log(`... and ${locMatches.length - 10} more`);
        }
      }

      console.log('');
      console.log('✨ Sitemap is working correctly!');
    } catch (error) {
      console.error('❌ Error parsing sitemap:', error.message);
    }
  });

}).on('error', (error) => {
  console.error('❌ Error fetching sitemap:', error.message);
});

