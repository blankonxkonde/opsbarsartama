// ==UserScript==
// @name         Opsbarsartama Enhancements
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Bypass Firefox check and adjust table width on specific subdomains.
// @author       (Your Name)
// @match        *://opsbarsartama.com/*
// @match        *://te.opsbarsartama.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- User-Agent Spoofing (Applied to both domains) ---
    // This part runs for both opsbarsartama.com and te.opsbarsartama.com
    const firefoxUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0';

    Object.defineProperty(navigator, 'userAgent', {
        get: function() {
            return firefoxUserAgent;
        }
    });

    // --- Conditional Styling (Applied only to te.opsbarsartama.com) ---
    // Check if the current hostname is 'te.opsbarsartama.com'
    if (window.location.hostname === 'te.opsbarsartama.com') {
        // This style adjustment only runs on the 'te' subdomain.
        GM_addStyle('#waiting_list table { width: 100% !important; }');
    }

})(); 