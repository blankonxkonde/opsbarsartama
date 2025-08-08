// ==UserScript==
// @name         TE - Modal Detail SL Bongkar
// @namespace    te.opsbarsartama.modal
// @version      1.0.1
// @description  Tampilkan response detail SL Bongkar dalam modal, tanpa ganti halaman
// @match        https://te.opsbarsartama.com/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';
  
    const OVERLAY_ID = 'tm-sl-overlay';
    const IFRAME_ID = 'tm-sl-iframe';
  
    // Styles
    const css = `
  #${OVERLAY_ID}{
    position:fixed; inset:0; background:rgba(0,0,0,0.5);
    display:none; z-index: 999999;
  }
  #${OVERLAY_ID} .tm-modal{
    position:absolute; top:50%; left:50%;
    transform:translate(-50%,-50%);
    background:#fff; width:90vw; height:90vh;
    border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,.3);
    display:flex; flex-direction:column; overflow:hidden;
  }
  #${OVERLAY_ID} .tm-header{
    padding:8px 12px; background:#0d6efd; color:#fff; display:flex; align-items:center; justify-content:space-between;
  }
  #${OVERLAY_ID} .tm-title{ font-weight:600; }
  #${OVERLAY_ID} .tm-close{
    background:transparent; border:none; color:#fff; font-size:20px; cursor:pointer; padding:0 6px;
  }
  #${OVERLAY_ID} .tm-body{ flex:1; position:relative; background:#f7f7f7; }
  #${IFRAME_ID}{
    width:100%; height:100%; border:0; background:#fff;
  }
  .tm-loading{
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    font: 500 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#333;
  }
    `;
    try { GM_addStyle?.(css); } catch { addStyle(css); }
  
    function addStyle(text) {
      const style = document.createElement('style');
      style.textContent = text;
      document.head.appendChild(style);
    }
  
    function ensureModal() {
      if (document.getElementById(OVERLAY_ID)) return;
      const overlay = document.createElement('div');
      overlay.id = OVERLAY_ID;
      overlay.innerHTML = `
        <div class="tm-modal" role="dialog" aria-modal="true" aria-label="Detail SL">
          <div class="tm-header">
            <div class="tm-title">Detail SL Bongkar</div>
            <button class="tm-close" title="Tutup" aria-label="Tutup">×</button>
          </div>
          <div class="tm-body">
            <div class="tm-loading">Loading…</div>
            <iframe id="${IFRAME_ID}" sandbox="allow-forms allow-scripts allow-same-origin"></iframe>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
  
      // Close behaviors
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideModal();
      });
      overlay.querySelector('.tm-close').addEventListener('click', hideModal);
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideModal();
      });
    }
  
    function showModalLoading(titleText) {
      ensureModal();
      const overlay = document.getElementById(OVERLAY_ID);
      overlay.style.display = 'block';
      const title = overlay.querySelector('.tm-title');
      if (titleText) title.textContent = titleText;
      overlay.querySelector('.tm-loading').style.display = 'flex';
      const iframe = document.getElementById(IFRAME_ID);
      iframe.removeAttribute('src');
      iframe.removeAttribute('srcdoc');
    }
  
    function showModalWithHtml(html, titleText) {
      ensureModal();
      const overlay = document.getElementById(OVERLAY_ID);
      overlay.style.display = 'block';
      const title = overlay.querySelector('.tm-title');
      if (titleText) title.textContent = titleText;
      overlay.querySelector('.tm-loading').style.display = 'none';
  
      // Ensure relative links load correctly
      if (!/<!doctype/i.test(html)) {
        html = `<!doctype html><html><head><base href="${location.origin}"></head><body>${html}</body></html>`;
      } else if (!/base\s+href=/i.test(html)) {
        html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${location.origin}">`);
      }
      // Normalize table width 120% -> 100%
      html = html
        .replace(/(<table\b[^>]*?\bwidth\s*=\s*["']?)120%(["'][^>]*>)/gi, '$1100%$2')
        .replace(/(<table\b[^>]*?\bwidth\s*=\s*)120%(\s|>|\/>)/gi, '$1100%$2');
      const iframe = document.getElementById(IFRAME_ID);
      iframe.srcdoc = html;
    }
  
    function showModalWithUrl(url, titleText) {
      ensureModal();
      const overlay = document.getElementById(OVERLAY_ID);
      overlay.style.display = 'block';
      const title = overlay.querySelector('.tm-title');
      if (titleText) title.textContent = titleText;
      overlay.querySelector('.tm-loading').style.display = 'none';
      const iframe = document.getElementById(IFRAME_ID);
      iframe.src = url;
    }
  
    function hideModal() {
      const overlay = document.getElementById(OVERLAY_ID);
      if (overlay) overlay.style.display = 'none';
    }
  
    function getCsrfToken() {
      return (
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
        document.querySelector('input[name="_token"]')?.value ||
        ''
      );
    }
  
    async function fetchDetailSL(slValue) {
      // Coba POST (sesuai perilaku saat ini). Jika gagal, fallback ke GET via iframe.
      const csrf = getCsrfToken();
      const body = new URLSearchParams({ sl: slValue }).toString();
  
      try {
        const res = await fetch('/surat/detail_sl_bongkar', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
            'X-Requested-With': 'XMLHttpRequest'
          },
          body
        });
  
        const text = await res.text();
  
        // Jika response nampak seperti redirect/HTML penuh, tetap render di modal.
        showModalWithHtml(text, `Detail SL: ${slValue}`);
      } catch (err) {
        // Fallback GET via iframe
        const url = `/surat/detail_sl_bongkar?sl=${encodeURIComponent(slValue)}`;
        showModalWithUrl(url, `Detail SL: ${slValue}`);
      }
    }
  
    // Intercept klik tombol "View" dengan id bongkar_sl_spv (mungkin duplikat id di tabel)
    document.addEventListener('click', function (e) {
      const btn = e.target?.closest('button#bongkar_sl_spv');
      if (!btn) return;
  
      // Cegat lebih awal
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  
      const slValue =
        btn.value ||
        btn.getAttribute('data-sl') ||
        btn.dataset?.sl ||
        '';
  
      if (!slValue) {
        alert('Tidak menemukan nilai SL pada tombol.');
        return;
      }
  
      showModalLoading(`Detail SL: ${slValue}`);
      fetchDetailSL(slValue);
    }, true); // capture=true agar menang sebelum handler asli halaman
  })();