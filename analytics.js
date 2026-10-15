(function () {
  var config = { demo: true, analytics: {} };
  var node = document.getElementById('site-config');
  try { if (node) config = JSON.parse(node.textContent); } catch (e) {}
  var ids = config.analytics || {};
  var demo = config.demo !== false;
  // Public IDs belong here; never put API secrets into the site configuration.
  var active = {
    ga4: !demo && /^G-[A-Z0-9]+$/.test(ids.ga4Id || '') && !/DEMO/.test(ids.ga4Id),
    meta: !demo && /^[0-9]{5,20}$/.test(ids.metaPixelId || '') && !/^0+$/.test(ids.metaPixelId),
    clarity: !demo && /^[A-Za-z0-9]+$/.test(ids.clarityId || '') && !/DEMO/i.test(ids.clarityId)
  };
  function load(id, src) {
    if (document.getElementById(id)) return;
    var script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }
  if (active.ga4) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ids.ga4Id);
    load('ga4-tag', 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ids.ga4Id));
  }
  if (active.meta) {
    if (!window.fbq) {
      var fbq = function () { if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments); else fbq.queue.push(arguments); };
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
      window.fbq = window._fbq = fbq;
    }
    window.fbq('init', ids.metaPixelId);
    window.fbq('track', 'PageView');
    load('meta-pixel', 'https://connect.facebook.net/en_US/fbevents.js');
  }
  if (active.clarity) {
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    load('clarity-tag', 'https://www.clarity.ms/tag/' + encodeURIComponent(ids.clarityId));
  }
  window.ShimiAnalytics = {
    demo: demo,
    active: active,
    events: [],
    trackContact: function (placement, language) {
      var detail = { placement: String(placement || 'unknown'), language: language === 'en' ? 'en' : 'he' };
      // A bounded preview queue allows local QA without contacting fake accounts.
      this.events.push({ event: 'whatsapp_click', placement: detail.placement, language: detail.language });
      if (this.events.length > 50) this.events.shift();
      if (active.ga4) window.gtag('event', 'whatsapp_click', detail);
      if (active.meta) window.fbq('track', 'Contact', detail);
      if (active.clarity) {
        window.clarity('set', 'whatsapp_placement', detail.placement);
        window.clarity('set', 'page_language', detail.language);
        window.clarity('event', 'whatsapp_click');
      }
    }
  };
})();
