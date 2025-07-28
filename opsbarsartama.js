// ==UserScript==
// @name         Opsbarsartama Enhancements
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Bypass Firefox check, adjust table width, and enable multi-login.
// @author       (Your Name)
// @match        *://opsbarsartama.com/*
// @match        *://te.opsbarsartama.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

// --- User-Agent Spoofing (IMMEDIATE EXECUTION) ---
// This is placed in the global scope to run immediately, winning the race condition against the site's browser check.
const firefoxUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0';
Object.defineProperty(navigator, 'userAgent', {
    get: function() { return firefoxUserAgent; }
});


(function() {
    'use strict';

    // --- Multi-Login Session Isolation ---
    // This part isolates localStorage per tab to allow multiple simultaneous sessions.
    (function() {
        // A unique identifier for this tab. sessionStorage is used because it's naturally tab-specific.
        let tabId = sessionStorage.getItem('multilogin_tab_id');
        if (!tabId) {
            tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('multilogin_tab_id', tabId);
        }

        const prefix = `ml_${tabId}_`;

        // Store original localStorage methods
        const originalLocalStorage = {
            setItem: localStorage.setItem.bind(localStorage),
            getItem: localStorage.getItem.bind(localStorage),
            removeItem: localStorage.removeItem.bind(localStorage),
            clear: localStorage.clear.bind(localStorage),
            key: localStorage.key.bind(localStorage)
        };

        // Helper function to get all keys for the current tab
        const getTabKeys = () => {
            const keys = [];
            // We must iterate over the real localStorage to find our tab-specific keys
            for (let i = 0; i < localStorage.length; i++) {
                const key = originalLocalStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keys.push(key.substring(prefix.length));
                }
            }
            return keys;
        };

        // Override localStorage methods to be tab-specific.
        // Note: We cannot override `length` with a getter due to browser security restrictions.
        // The core functionality remains intact.
        Object.defineProperties(window.localStorage, {
            setItem: {
                value: function(key, value) {
                    originalLocalStorage.setItem(prefix + key, String(value));
                },
                writable: true, configurable: true, enumerable: true
            },
            getItem: {
                value: function(key) {
                    return originalLocalStorage.getItem(prefix + key);
                },
                writable: true, configurable: true, enumerable: true
            },
            removeItem: {
                value: function(key) {
                    originalLocalStorage.removeItem(prefix + key);
                },
                writable: true, configurable: true, enumerable: true
            },
            clear: {
                value: function() {
                    // Important: Create a static copy of keys before removing
                    const tabKeys = getTabKeys().map(k => prefix + k);
                    tabKeys.forEach(k => originalLocalStorage.removeItem(k));
                },
                writable: true, configurable: true, enumerable: true
            },
            key: {
                value: function(index) {
                    // This will return the nth key for *this tab*, not the global storage.
                    return getTabKeys()[index] || null;
                },
                writable: true, configurable: true, enumerable: true
            }
        });
    })();


    // --- Conditional Styling (Applied only to te.opsbarsartama.com) ---
    // Check if the current hostname is 'te.opsbarsartama.com'
    if (window.location.hostname === 'te.opsbarsartama.com') {
        // This style adjustment only runs on the 'te' subdomain.
        GM_addStyle('#waiting_list table, #display_sl_kirim table { width: 100% !important; }');
    }

})(); 