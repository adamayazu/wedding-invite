(function () {
  'use strict';

  /* One page, drawn from one block of details. Guests: the details are read from Supabase.
     /admin: the owner signs in, edits the details and saves them back to Supabase. */

  var ADMIN = document.body.getAttribute('data-mode') === 'admin';
  var CFG = window.INVITE_CONFIG || {};
  var CACHE_KEY = 'invite-details-v1';

  var DEFAULTS = {
    pageTitle: "Ayaz & Dhunya's Wedding",
    groomShort: 'Ayaz', groomFull: 'Adam Ayaz',
    brideShort: 'Dhunya', brideFull: 'Dhunya Ahmed',
    monogram: '',
    date: '2027-04-10', time: '16:30', endTime: '21:30', receptionTime: '6:00 PM',
    venue: 'Venue Name', place: 'Island, Maldives', mapQuery: '',
    rsvpBy: '2027-03-27', whatsapp: '',
    bismillah: true,
    welcomeTitle: 'Welcome to our wedding',
    welcomeText: 'With grateful hearts and the blessings of our families, we invite you to share in the joy of our marriage. Come celebrate the beginning of our life together.',
    hostsIntro: 'together with their families, invite you to celebrate their marriage',
    countdownTitle: 'Countdown', countdownNote: 'until we celebrate together',
    dressTitle: 'Dress Code', dressLabel: 'Formal',
    dressText: 'Soft blush, mauve, sage and pearl tones will sit beautifully with the day. Please leave white and ivory for the bride.',
    storyTitle: 'Our Story',
    storyText: 'Two families, one chain of islands, and a story that kept finding its way back to the two of us. Today we begin the next chapter, and we would be honoured to have you beside us.',
    timelineTitle: 'Timeline',
    giftsTitle: 'Gifts',
    giftsText: 'Your presence and your prayers are the greatest gift we could ask for. If you wish to give something more, a contribution toward our new home would be warmly appreciated.',
    rsvpTitle: 'Will you join us?',
    rsvpText: 'Let us know if you can make it so we can save you a place at the table.',
    closingLabel: 'With love',
    sections: { countdown: true, details: true, dress: true, story: true, timeline: true, gifts: true, rsvp: true },
    timeline: [
      { time: '4:00 PM', title: 'Guests arrive', sub: 'Welcome drinks on the deck', icon: 'arrive' },
      { time: '4:30 PM', title: 'Nikah ceremony', sub: 'Please be seated by 4:20', icon: 'rings' },
      { time: '6:00 PM', title: 'Dinner & reception', sub: 'A shared table for family and friends', icon: 'dinner' },
      { time: '7:30 PM', title: 'Cake cutting', sub: 'Photographs with the couple', icon: 'cake' },
      { time: '9:00 PM', title: 'Farewell', sub: 'Thank you for being with us', icon: 'moon' }
    ]
  };

  function normalise(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var d = {}, k;
    for (k in DEFAULTS) d[k] = DEFAULTS[k];
    for (k in raw) if (k !== 'sections' && k !== 'timeline') d[k] = raw[k];
    d.sections = {};
    for (k in DEFAULTS.sections) d.sections[k] = raw.sections && typeof raw.sections[k] === 'boolean' ? raw.sections[k] : DEFAULTS.sections[k];
    var tl = Array.isArray(raw.timeline) ? raw.timeline : DEFAULTS.timeline;
    d.timeline = tl.map(function (t) { t = t || {}; return { time: String(t.time || ''), title: String(t.title || ''), sub: String(t.sub || ''), icon: String(t.icon || 'heart') }; });
    return d;
  }
  function readCache() {
    if (ADMIN) return {};
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch (e) { return {}; }
  }
  var data = normalise(readCache());
  var original = JSON.stringify(data);
  var state = { opened: false, opening: false, instant: false };
  var dirty = false;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) { var n = document.createElementNS(NS, name); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }

  function startDate(d) { return new Date(d.date + 'T' + (d.time || '16:00') + ':00+05:00'); }
  function endDate(d) { var e = new Date(d.date + 'T' + (d.endTime || '21:00') + ':00+05:00'); return e > startDate(d) ? e : new Date(startDate(d).getTime() + 4 * 36e5); }
  function fmt(date, o) {
    try { return new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: 'Indian/Maldives' }, o)).format(date); }
    catch (e) { return date.toDateString(); }
  }
  function validDate(x) { return x instanceof Date && !isNaN(x.getTime()); }
  function time12(hhmm) {
    var m = /^(\d{1,2}):(\d{2})/.exec(hhmm || ''); if (!m) return hhmm || '';
    var h = +m[1], ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + m[2] + ' ' + ap;
  }
  function monoOf(d) {
    if (d.monogram && d.monogram.trim()) return d.monogram.trim();
    return (d.groomShort || 'A').charAt(0).toUpperCase() + '&' + (d.brideShort || 'D').charAt(0).toUpperCase();
  }

  /* ---------- timeline icons ---------- */
  var ICONS = {
    arrive: '<g filter="url(#puff)"><path d="M9 43 V21 A15 15 0 0 1 39 21 V43Z" fill="#f4dde5" stroke="#b08d57" stroke-width="1.8"/><path d="M16 43 V23 A8 8 0 0 1 32 23 V43Z" fill="#8d6c85" opacity=".88"/><circle cx="24" cy="8" r="2.4" fill="#f1cf80"/></g>',
    rings: '<g filter="url(#puff)" fill="none" stroke="#b08d57" stroke-width="3.6"><circle cx="18" cy="29" r="10.5"/><circle cx="30" cy="29" r="10.5" stroke="#c79b78"/></g><path d="M24 11 l4 5 l-4 5 l-4 -5Z" fill="#f4dde5" stroke="#b08d57" stroke-width="1.4"/>',
    dinner: '<g filter="url(#puff)"><path d="M7 33 A17 17 0 0 1 41 33Z" fill="#f4dde5" stroke="#b08d57" stroke-width="1.8"/><rect x="4" y="33" width="40" height="5" rx="2.5" fill="#d9b8a4"/><circle cx="24" cy="12" r="3" fill="#f1cf80"/></g>',
    cake: '<g filter="url(#puff)"><rect x="8" y="31" width="32" height="11" rx="2" fill="#e9b3c3"/><rect x="13" y="21" width="22" height="10" rx="2" fill="#f4dde5" stroke="#d3a0b3" stroke-width="1"/><path d="M24 21 V13" stroke="#b08d57" stroke-width="2" stroke-linecap="round"/><path d="M24 7 q3.5 3.5 0 6.5 q-3.5 -3 0 -6.5Z" fill="#f1b45c"/></g>',
    moon: '<g filter="url(#puff)"><path d="M30 6 A18 18 0 1 0 42 33 A14.5 14.5 0 1 1 30 6Z" fill="#f1cf80" stroke="#b08d57" stroke-width="1.4"/><path d="M36 10 l1.8 4.2 l4.4 .4 l-3.3 3 l1 4.4 l-3.9 -2.4 l-3.9 2.4 l1 -4.4 l-3.3 -3 l4.4 -.4Z" fill="#f4dde5" stroke="#b08d57" stroke-width="1"/></g>',
    heart: '<g filter="url(#puff)"><path d="M24 41 C8 29 6 18 13 13 C18 9 23 12 24 16 C25 12 30 9 35 13 C42 18 40 29 24 41Z" fill="#e9a9bd" stroke="#c47c95" stroke-width="1.4"/></g>',
    music: '<g filter="url(#puff)"><path d="M18 36 V12 L38 8 V32" fill="none" stroke="#b08d57" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="14" cy="36" rx="6" ry="4.6" fill="#e9b3c3" stroke="#c47c95" stroke-width="1.2"/><ellipse cx="34" cy="32" rx="6" ry="4.6" fill="#e9b3c3" stroke="#c47c95" stroke-width="1.2"/></g>'
  };
  var ICON_LABELS = { arrive: 'Doorway (arrival)', rings: 'Rings (ceremony)', dinner: 'Dish (dinner)', cake: 'Cake', moon: 'Moon (farewell)', heart: 'Heart', music: 'Music' };

  /* ---------- page ---------- */
  function sectionsHtml(d) {
    var s = d.sections, h = '';
    var start = startDate(d);
    var okDate = validDate(start);
    var longDate = okDate ? fmt(start, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
    var nikahTime = okDate ? time12(d.time) : '';

    h += '<section class="sec rv"><img class="divider" src="img/divider.webp" alt="">';
    if (d.bismillah) h += '<span class="bismillah" lang="ar">بسم الله الرحمن الرحيم</span>';
    h += '<h2>' + esc(d.welcomeTitle) + '</h2><p>' + esc(d.welcomeText) + '</p></section>';

    if (s.countdown) {
      h += '<section class="sec rv" style="padding-top:64px"><img class="fullbleed" src="img/vines.webp" alt="">' +
        '<h2 style="margin-top:6px">' + esc(d.countdownTitle) + '</h2>' +
        '<div class="count" role="timer" aria-live="off">' +
        '<div class="cd-item"><div class="disc"><b id="cdD">0</b></div><span class="cd-label">Days</span></div>' +
        '<div class="cd-item"><div class="disc"><b id="cdH">0</b></div><span class="cd-label">Hours</span></div>' +
        '<div class="cd-item"><div class="disc"><b id="cdM">0</b></div><span class="cd-label">Minutes</span></div></div>' +
        '<p class="cd-note" id="cdNote">' + esc(d.countdownNote) + '</p></section>';
    }

    if (s.details) {
      var corner = function (c) { return '<img class="corner ' + c + '" src="img/corner.webp" alt="">'; };
      h += '<section class="sec rv"><div class="frame">' + corner('tl') + corner('tr') + corner('br') + corner('bl') +
        '<div class="inner"><span class="eyebrow">You are invited</span>' +
        '<div class="hosts">' + esc(d.groomFull) + ' <i>and</i> ' + esc(d.brideFull) + '</div>' +
        '<p style="margin-top:12px;font-size:18px">' + esc(d.hostsIntro) + '</p><hr class="rule">' +
        '<h3>Nikah &amp; Reception</h3>' +
        '<span class="place" style="margin-top:14px">Where we celebrate</span>' +
        '<div class="venue">' + esc(d.venue) + '</div><span class="place">' + esc(d.place) + '</span>' +
        '<div class="dt">' + esc(longDate) + '<small>Nikah ' + esc(nikahTime) + (d.receptionTime ? ' &nbsp;&middot;&nbsp; Reception ' + esc(d.receptionTime) : '') + '</small></div>' +
        '<div class="btns"><a class="btn solid" id="mapLink" target="_blank" rel="noopener" href="#">Open in Maps</a>' +
        '<a class="btn" id="calLink" target="_blank" rel="noopener" href="#">Add to calendar</a></div></div></div></section>';
    }

    if (s.dress) {
      h += '<section class="sec dress rv" style="padding-top:64px"><img class="fullbleed" src="img/vines.webp" alt="" style="transform:scaleX(-1)">' +
        '<h2 style="margin-top:6px">' + esc(d.dressTitle) + '</h2>' +
        (d.dressLabel ? '<span class="eyebrow" style="margin-top:12px">' + esc(d.dressLabel) + '</span>' : '') +
        '<p>' + esc(d.dressText) + '</p><img class="figs" src="img/guests.webp" alt="Illustration of guests in formal wear"></section>';
    }

    if (s.story) {
      h += '<section class="sec rv"><div class="arch"><img src="img/arch.webp" alt="">' +
        '<div class="txt"><h2>' + esc(d.storyTitle) + '</h2><p>' + esc(d.storyText) + '</p></div></div></section>';
    }

    if (s.timeline && d.timeline.length) {
      h += '<section class="sec rv"><h2>' + esc(d.timelineTitle) + '</h2><ol class="tl">';
      d.timeline.forEach(function (t) {
        h += '<li><svg class="ic" viewBox="0 0 48 48" aria-hidden="true">' + (ICONS[t.icon] || ICONS.heart) + '</svg><span class="dot"></span>' +
          '<div><time>' + esc(t.time) + '</time><span class="what">' + esc(t.title) + '</span>' + (t.sub ? '<span class="sub">' + esc(t.sub) + '</span>' : '') + '</div></li>';
      });
      h += '</ol></section>';
    }

    if (s.gifts) {
      h += '<section class="sec rv"><div class="gift">' +
        '<svg class="bow" viewBox="0 0 100 60" aria-hidden="true"><g filter="url(#puff)"><path d="M50 30 C34 6 8 4 6 20 C6 38 32 40 50 30Z" fill="#e9b3c3" stroke="#d58fa6" stroke-width="1.2"/><path d="M50 30 C66 6 92 4 94 20 C94 38 68 40 50 30Z" fill="#e9b3c3" stroke="#d58fa6" stroke-width="1.2"/><path d="M46 34 L34 56 L44 52 L48 58Z" fill="#d98ca5"/><path d="M54 34 L66 56 L56 52 L52 58Z" fill="#d98ca5"/><ellipse cx="50" cy="30" rx="8" ry="7" fill="#d58fa6"/></g></svg>' +
        '<h2 style="font-size:36px">' + esc(d.giftsTitle) + '</h2><p style="font-size:18px">' + esc(d.giftsText) + '</p></div></section>';
    }

    if (s.rsvp) {
      var by = new Date(d.rsvpBy + 'T12:00:00+05:00');
      h += '<section class="sec rsvp rv"><span class="eyebrow">' + (validDate(by) ? 'Kindly reply by ' + esc(fmt(by, { day: 'numeric', month: 'long', year: 'numeric' })) : 'Kindly reply') + '</span>' +
        '<h2>' + esc(d.rsvpTitle) + '</h2><p>' + esc(d.rsvpText) + '</p>' +
        '<div class="btns"><a class="btn solid" id="waLink" target="_blank" rel="noopener" href="#">Reply on WhatsApp</a></div></section>';
    }

    h += '<footer class="closing rv"><svg class="seal" viewBox="0 0 120 120" aria-hidden="true"><use href="#seal" width="120" height="120"/></svg>' +
      '<span class="with">' + esc(d.closingLabel) + '</span><div class="sign">' + esc(d.groomShort) + ' &amp; ' + esc(d.brideShort) + '</div></footer>';
    return h;
  }

  function pageHtml(d) {
    var start = startDate(d);
    var shortDate = validDate(start) ? fmt(start, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
      '<filter id="puff" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="b"/><feSpecularLighting in="b" surfaceScale="3" specularConstant=".7" specularExponent="20" lighting-color="#ffffff" result="s"><feDistantLight azimuth="235" elevation="58"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="s2"/></feMerge></filter>' +
      '<symbol id="seal" viewBox="0 0 120 120"></symbol></defs></svg>' +
      '<div id="cover"' + (state.opened ? ' class="gone"' : '') + '><span class="kicker">The wedding of</span>' +
      '<button id="openBtn" type="button" aria-label="Open the invitation"><svg class="seal" viewBox="0 0 120 120" role="img" aria-label="Wedding seal"><use href="#seal" width="120" height="120"/></svg></button>' +
      '<span class="hint">Tap to open</span></div>' +
      '<header class="stage"><img class="bg" src="img/scene.webp" alt="" decoding="async">' +
      '<div class="drape l"></div><div class="drape r"></div><div class="tie l"></div><div class="tie r"></div>' +
      '<img class="valance" src="img/valance.webp" alt="">' +
      '<div class="names" aria-label="' + esc(d.groomShort + ' and ' + d.brideShort + ', ' + shortDate) + '"><span class="nm">' + esc(d.groomShort) + '</span><span class="amp">&amp;</span><span class="nm">' + esc(d.brideShort) + '</span>' +
      '<span class="when">' + esc(shortDate) + '</span></div></header>' +
      '<main>' + sectionsHtml(d) + '</main>';
  }

  /* ---------- seal ---------- */
  function buildSeal(d) {
    var s = $('#seal'); if (!s) return;
    while (s.firstChild) s.removeChild(s.firstChild);
    var i, a;
    el('circle', { cx: 60, cy: 60, r: 49, fill: '#b08d57' }, s);
    for (i = 0; i < 18; i++) { a = i / 18 * Math.PI * 2; el('circle', { cx: 60 + Math.cos(a) * 48, cy: 60 + Math.sin(a) * 48, r: 10, fill: '#b08d57' }, s); }
    el('circle', { cx: 60, cy: 60, r: 47.4, fill: '#f2d9e1' }, s);
    for (i = 0; i < 18; i++) { a = i / 18 * Math.PI * 2; el('circle', { cx: 60 + Math.cos(a) * 48, cy: 60 + Math.sin(a) * 48, r: 8.6, fill: '#f2d9e1' }, s); }
    el('circle', { cx: 60, cy: 60, r: 36, fill: 'none', stroke: '#b08d57', 'stroke-width': 1.3 }, s);
    el('circle', { cx: 60, cy: 60, r: 33, fill: 'none', stroke: '#b08d57', 'stroke-width': .7, 'stroke-dasharray': '1.5 2.2' }, s);
    for (i = 0; i < 36; i++) { a = i / 36 * Math.PI * 2; el('circle', { cx: 60 + Math.cos(a) * 41.5, cy: 60 + Math.sin(a) * 41.5, r: 1.25, fill: '#fffaf7' }, s); }
    var m = monoOf(d), size = m.length > 4 ? 22 : (m.length > 3 ? 28 : 34);
    var t = el('text', { x: 60, y: 60 + size * .32, 'text-anchor': 'middle', 'font-family': "'Cormorant Garamond',Georgia,serif", 'font-size': size, 'font-style': 'italic', 'font-weight': 500, fill: '#a37f48' }, s);
    t.textContent = m;
  }

  /* ---------- links + countdown ---------- */
  var timer = null;
  function wireLinks(d) {
    var start = startDate(d), end = endDate(d), okDate = validDate(start);
    var q = (d.mapQuery && d.mapQuery.trim()) || (d.venue + ', ' + d.place);
    var map = $('#mapLink'); if (map) map.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
    var cal = $('#calLink');
    if (cal && okDate) {
      var z = function (x) { return x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
      cal.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Wedding of ' + d.groomFull + ' & ' + d.brideFull) +
        '&dates=' + z(start) + '/' + z(end) + '&location=' + encodeURIComponent(d.venue + ', ' + d.place) +
        '&details=' + encodeURIComponent('Nikah and reception. We look forward to celebrating with you.');
    }
    var wa = $('#waLink');
    if (wa) {
      var msg = 'Assalaamu alaikum! I would like to RSVP to the wedding of ' + d.groomShort + ' & ' + d.brideShort + (okDate ? ' on ' + fmt(start, { day: 'numeric', month: 'long', year: 'numeric' }) : '') + '.';
      wa.href = 'https://wa.me/' + String(d.whatsapp || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);
    }
  }
  function tick() {
    var start = startDate(data), D = $('#cdD'); if (!D) return;
    var diff = start - new Date(), d = 0, h = 0, m = 0;
    if (diff > 0) { d = Math.floor(diff / 864e5); h = Math.floor(diff / 36e5) % 24; m = Math.floor(diff / 6e4) % 60; }
    else if (validDate(start)) { var n = $('#cdNote'); if (n) n.textContent = 'Today we celebrate. Thank you for being here.'; }
    D.textContent = d; $('#cdH').textContent = h; $('#cdM').textContent = m;
  }


  /* ---------- render ---------- */
  var root = document.getElementById('root');
  var htmlEl = document.documentElement;
  var io = null;
  function render() {
    root.innerHTML = '<div id="page" class="' + (state.opened ? 'opened ' : '') + (state.instant ? 'instant' : '') + '">' + pageHtml(data) + '</div>';
    document.title = data.pageTitle || document.title;
    buildSeal(data);
    wireLinks(data);
    tick();
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 20000);
    var ob = $('#openBtn');
    if (ob) ob.addEventListener('click', open);
    var cv = $('#cover');
    if (cv && !state.opened) {
      cv.addEventListener('wheel', open, { passive: true });
      cv.addEventListener('touchmove', open, { passive: true });
    }
    if (!ADMIN) setupReveal();
  }
  function open() {
    if (state.opened || state.opening) return;
    state.opening = true;
    var cv = $('#cover'); if (cv) cv.classList.add('gone');
    /* wait (briefly) for the latest details so the curtains open on the right words */
    loaded.then(function () {
      state.opened = true;
      var cv2 = $('#cover'); if (cv2) cv2.classList.add('gone');
      setTimeout(function () { var p = $('#page'); if (p) p.classList.add('opened'); }, 350);
      setTimeout(function () { htmlEl.classList.remove('locked'); }, 1400);
      window.scrollTo(0, 0);
    });
  }
  function setupReveal() {
    if (io) { io.disconnect(); io = null; }
    if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } }); }, { threshold: .12 });
    $$('.rv').forEach(function (n) { var r = n.getBoundingClientRect(); if (r.top > window.innerHeight * .9) { n.classList.add('pre'); io.observe(n); } });
  }

  /* ---------- guests: read the details ---------- */
  var loaded = Promise.resolve();
  function loadForGuest() {
    if (!CFG.url || !CFG.key) return Promise.resolve();
    return new Promise(function (resolve) {
      var done = false;
      function fin() { if (!done) { done = true; resolve(); } }
      setTimeout(fin, 2500);
      fetch(CFG.url + '/rest/v1/invite_config?id=eq.1&select=data', { headers: { apikey: CFG.key, Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
        .then(function (rows) {
          if (rows && rows[0] && rows[0].data) {
            var fresh = normalise(rows[0].data);
            try { localStorage.setItem(CACHE_KEY, JSON.stringify(rows[0].data)); } catch (e) {}
            if (JSON.stringify(fresh) !== JSON.stringify(data)) {
              data = fresh;
              if (state.opened) state.instant = true;
              var y = window.scrollY; render(); if (state.opened) window.scrollTo(0, y);
            }
          }
        })
        .catch(function () {})
        .then(fin);
    });
  }

  function cleanData() {
    var d = JSON.parse(JSON.stringify(data)), k;
    for (k in d) if (typeof d[k] === 'string') d[k] = d[k].trim();
    d.whatsapp = String(d.whatsapp || '').replace(/\D/g, '');
    d.timeline = (d.timeline || []).filter(function (t) { return (t.time || t.title || '').trim(); })
      .map(function (t) { return { time: (t.time || '').trim(), title: (t.title || '').trim(), sub: (t.sub || '').trim(), icon: ICONS[t.icon] ? t.icon : 'heart' }; });
    return d;
  }

  /* ---------- editor ---------- */
  var GROUPS = [
    { title: 'Couple', open: true, items: [
      { k: 'groomShort', label: 'Groom: name shown on the cover' },
      { k: 'groomFull', label: 'Groom: full name (invitation card)' },
      { k: 'brideShort', label: 'Bride: name shown on the cover' },
      { k: 'brideFull', label: 'Bride: full name (invitation card)' },
      { k: 'monogram', label: 'Letters on the seal', hint: 'Leave empty to use the first letters of the two names.' }
    ] },
    { title: 'Date & time', open: true, items: [
      { k: 'date', label: 'Wedding date', type: 'date' },
      { k: 'time', label: 'Nikah starts', type: 'time' },
      { k: 'endTime', label: 'Event ends (for the calendar)', type: 'time' },
      { k: 'receptionTime', label: 'Reception time, as it should read', hint: 'For example 6:00 PM. Leave empty to hide.' }
    ] },
    { title: 'Venue', open: true, items: [
      { k: 'venue', label: 'Venue name' },
      { k: 'place', label: 'Island / city' },
      { k: 'mapQuery', label: 'Maps search (optional)', hint: 'What the Maps button searches for. Leave empty to use venue and island.' }
    ] },
    { title: 'RSVP', items: [
      { k: 'rsvpBy', label: 'Reply by', type: 'date' },
      { k: 'whatsapp', label: 'WhatsApp number', type: 'tel', hint: 'Country code and number, digits only, for example 9607771234.' },
      { k: 'rsvpTitle', label: 'Heading' },
      { k: 'rsvpText', label: 'Text', type: 'area' }
    ] },
    { title: 'Wording', items: [
      { k: 'bismillah', label: 'Show Bismillah above the welcome', type: 'check' },
      { k: 'welcomeTitle', label: 'Welcome heading' },
      { k: 'welcomeText', label: 'Welcome text', type: 'area' },
      { k: 'hostsIntro', label: 'Line under the names on the card', type: 'area' },
      { k: 'countdownTitle', label: 'Countdown heading' },
      { k: 'countdownNote', label: 'Countdown caption' },
      { k: 'dressTitle', label: 'Dress code heading' },
      { k: 'dressLabel', label: 'Dress code label' },
      { k: 'dressText', label: 'Dress code text', type: 'area' },
      { k: 'storyTitle', label: 'Story heading' },
      { k: 'storyText', label: 'Story text', type: 'area', hint: 'Keep it to about 30 words so it fits inside the arch.' },
      { k: 'timelineTitle', label: 'Timeline heading' },
      { k: 'giftsTitle', label: 'Gifts heading' },
      { k: 'giftsText', label: 'Gifts text', type: 'area' },
      { k: 'closingLabel', label: 'Closing line above the names' }
    ] },
    { title: 'Show or hide sections', items: [
      { k: 'sections.countdown', label: 'Countdown', type: 'check' },
      { k: 'sections.details', label: 'Venue and invitation card', type: 'check' },
      { k: 'sections.dress', label: 'Dress code', type: 'check' },
      { k: 'sections.story', label: 'Our story', type: 'check' },
      { k: 'sections.timeline', label: 'Timeline', type: 'check' },
      { k: 'sections.gifts', label: 'Gifts', type: 'check' },
      { k: 'sections.rsvp', label: 'RSVP', type: 'check' }
    ] },
    { title: 'Timeline', timeline: true }
  ];
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, p, v) { var ks = p.split('.'), last = ks.pop(), t = ks.reduce(function (a, k) { return a[k]; }, o); t[last] = v; }

  var editor = null, dirty = false, debounce = null;
  function fieldHtml(f) {
    var id = 'f_' + f.k.replace(/\./g, '_'), v = getPath(data, f.k), h;
    if (f.type === 'check') return '<div class="ed-field ed-check"><input id="' + id + '" type="checkbox" data-k="' + f.k + '"' + (v ? ' checked' : '') + '><label for="' + id + '">' + esc(f.label) + '</label></div>';
    h = '<div class="ed-field"><label for="' + id + '">' + esc(f.label) + '</label>';
    if (f.type === 'area') h += '<textarea id="' + id + '" data-k="' + f.k + '" rows="3">' + esc(v) + '</textarea>';
    else h += '<input id="' + id + '" type="' + (f.type || 'text') + '" data-k="' + f.k + '" value="' + esc(v) + '"' + (f.type === 'tel' ? ' inputmode="numeric" autocomplete="off"' : '') + '>';
    if (f.hint) h += '<span class="hint">' + esc(f.hint) + '</span>';
    return h + '</div>';
  }
  function timelineHtml() {
    var h = '<div class="ed-fields">';
    data.timeline.forEach(function (t, i) {
      h += '<div class="ed-row"><input type="text" data-ti="' + i + '" data-tf="time" value="' + esc(t.time) + '" aria-label="Time" placeholder="4:30 PM">' +
        '<input type="text" data-ti="' + i + '" data-tf="title" value="' + esc(t.title) + '" aria-label="Title" placeholder="What happens">' +
        '<input class="full" type="text" data-ti="' + i + '" data-tf="sub" value="' + esc(t.sub) + '" aria-label="Short note" placeholder="Short note (optional)">' +
        '<select data-ti="' + i + '" data-tf="icon" aria-label="Icon">' + Object.keys(ICONS).map(function (k) { return '<option value="' + k + '"' + (t.icon === k ? ' selected' : '') + '>' + ICON_LABELS[k] + '</option>'; }).join('') + '</select>' +
        '<button type="button" class="rm" data-rm="' + i + '">Remove</button></div>';
    });
    return h + '<button type="button" class="ed-btn" data-add="1">Add a moment</button></div>';
  }
  function editorBody() {
    return GROUPS.map(function (g) {
      return '<details class="ed-group"' + (g.open ? ' open' : '') + '><summary>' + esc(g.title) + '</summary>' +
        (g.timeline ? timelineHtml() : '<div class="ed-fields">' + g.items.map(fieldHtml).join('') + '</div>') + '</details>';
    }).join('');
  }
  function status(msg, cls) { var s = $('.ed-status', editor); s.textContent = msg; s.className = 'ed-status' + (cls ? ' ' + cls : ''); }
  function rerenderSoon() {
    dirty = true; status('Unsaved changes. Press Save to publish them.');
    clearTimeout(debounce);
    debounce = setTimeout(function () { var y = window.scrollY; state.instant = true; render(); window.scrollTo(0, y); }, 280);
  }

  var sb = null, pill = null, gate = null;
  function buildEditor() {
    if (editor) { editor.remove(); editor = null; }
    editor = document.createElement('div'); editor.id = 'editor';
    editor.setAttribute('role', 'region'); editor.setAttribute('aria-label', 'Edit invitation details');
    editor.innerHTML = '<div class="ed-panel"><div class="ed-head"><h2>Edit invitation</h2><div class="acts"><button type="button" class="ed-btn primary" id="edSave">Save</button></div></div>' +
      '<div class="ed-tools"><a href="./" target="_blank" rel="noopener">View invitation</a><button type="button" id="edUndo">Undo changes</button><button type="button" id="edOut">Sign out</button></div>' +
      '<div class="ed-status">Change anything below. The preview updates as you type. Press Save to publish for your guests.</div><div class="ed-body"></div></div>';
    document.body.appendChild(editor);
    var body = $('.ed-body', editor);
    body.innerHTML = editorBody();
    var onInput = function (e) {
      var t = e.target;
      if (t.dataset.k) { setPath(data, t.dataset.k, t.type === 'checkbox' ? t.checked : t.value); rerenderSoon(); }
      else if (t.dataset.tf) { data.timeline[+t.dataset.ti][t.dataset.tf] = t.value; rerenderSoon(); }
    };
    body.addEventListener('input', onInput);
    body.addEventListener('change', onInput);
    body.addEventListener('click', function (e) {
      var rm = e.target.getAttribute && e.target.getAttribute('data-rm'), add = e.target.getAttribute && e.target.getAttribute('data-add');
      if (rm != null) { data.timeline.splice(+rm, 1); }
      else if (add) { data.timeline.push({ time: '', title: '', sub: '', icon: 'heart' }); }
      else return;
      body.innerHTML = editorBody(); var nd = $('details:last-child', body); if (nd) nd.open = true;
      rerenderSoon();
    });
    $('#edSave', editor).addEventListener('click', save);
    $('#edUndo', editor).addEventListener('click', function () {
      data = normalise(JSON.parse(original)); dirty = false;
      $('.ed-body', editor).innerHTML = editorBody();
      var y = window.scrollY; render(); window.scrollTo(0, y);
      status('Changes undone. Showing what is currently published.');
    });
    $('#edOut', editor).addEventListener('click', function () {
      if (dirty && !window.confirm('You have unsaved changes. Sign out and lose them?')) return;
      sb.auth.signOut().then(function () { showLogin(); });
    });
    if (!pill) {
      pill = document.createElement('button'); pill.id = 'editPill'; pill.type = 'button'; pill.textContent = 'Preview';
      pill.addEventListener('click', function () { editor.hidden = !editor.hidden; pill.textContent = editor.hidden ? 'Edit' : 'Preview'; });
      document.body.appendChild(pill);
    }
    pill.textContent = 'Preview';
    document.body.appendChild(pill);
  }

  function friendly(e) {
    var m = String((e && (e.message || e.error_description)) || e || '');
    if (/invalid login/i.test(m)) return 'That email or password is not right.';
    if (/not confirmed/i.test(m)) return 'This email address has not been confirmed yet.';
    if (/rate|too many/i.test(m)) return 'Too many tries. Please wait a minute and try again.';
    if (/jwt|expired|refresh/i.test(m)) return 'Your sign-in ended. Please sign in again.';
    if (/fetch|network|load failed/i.test(m)) return 'Could not reach the server. Check your connection and try again.';
    return 'Something went wrong. Please try again.';
  }

  function save() {
    var btn = $('#edSave', editor), d = cleanData();
    if (!validDate(startDate(d))) { status('Choose a wedding date and a start time first.', 'err'); return; }
    btn.disabled = true; status('Saving…');
    sb.from('invite_config').upsert({ id: 1, data: d }).select('id').then(function (r) {
      btn.disabled = false;
      if (r.error) { status('Not saved. ' + friendly(r.error), 'err'); return; }
      if (!r.data || !r.data.length) { status('Not saved. This account is not allowed to change the invitation.', 'err'); return; }
      data = normalise(d); original = JSON.stringify(data); dirty = false;
      status('Saved. Your guests will see the new details straight away.', 'ok');
    }, function (e) { btn.disabled = false; status('Not saved. ' + friendly(e), 'err'); });
  }

  /* ---------- admin: sign in ---------- */
  function clearGate() { if (gate) { gate.remove(); gate = null; } }
  function showGate(inner) {
    clearGate();
    if (editor) { editor.remove(); editor = null; }
    if (pill) { pill.remove(); pill = null; }
    root.innerHTML = '';
    gate = document.createElement('div'); gate.id = 'gate';
    gate.innerHTML = '<div class="gate-card">' + inner + '</div>';
    document.body.appendChild(gate);
    return gate;
  }
  function showLogin(msg) {
    var g = showGate('<span class="eyebrow">Ayaz &amp; Dhunya</span><h1>Edit the invitation</h1><p>Sign in to change the details your guests see.</p>' +
      '<form id="lgForm" novalidate><div class="ed-field"><label for="lgEmail">Email</label><input id="lgEmail" type="email" autocomplete="username" inputmode="email" required></div>' +
      '<div class="ed-field"><label for="lgPass">Password</label><input id="lgPass" type="password" autocomplete="current-password" required></div>' +
      '<div class="ed-status lg-msg' + (msg ? ' err' : '') + '" role="alert">' + esc(msg || '') + '</div>' +
      '<button class="ed-btn primary lg-btn" type="submit">Sign in</button></form>');
    var f = $('#lgForm', g);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#lgEmail', g).value.trim(), pass = $('#lgPass', g).value, m = $('.lg-msg', g), b = $('.lg-btn', g);
      if (!email || !pass) { m.textContent = 'Enter your email and password.'; m.className = 'ed-status lg-msg err'; return; }
      b.disabled = true; m.textContent = 'Signing in…'; m.className = 'ed-status lg-msg';
      sb.auth.signInWithPassword({ email: email, password: pass }).then(function (r) {
        if (r.error) { b.disabled = false; m.textContent = friendly(r.error); m.className = 'ed-status lg-msg err'; return; }
        enter(r.data.user);
      }, function (er) { b.disabled = false; m.textContent = friendly(er); m.className = 'ed-status lg-msg err'; });
    });
    var em = $('#lgEmail', g); if (em) em.focus();
  }
  function enter(user) {
    showGate('<p>Opening the editor…</p>');
    sb.from('invite_admin').select('user_id').eq('user_id', user.id).maybeSingle().then(function (r) {
      if (r.error) throw r.error;
      if (!r.data) {
        var g = showGate('<h1>Not allowed</h1><p>This account is not set up to edit the invitation.</p><button class="ed-btn" id="lgOut" type="button">Sign out</button>');
        $('#lgOut', g).addEventListener('click', function () { sb.auth.signOut().then(function () { showLogin(); }); });
        return;
      }
      return sb.from('invite_config').select('data').eq('id', 1).maybeSingle().then(function (c) {
        if (c.error) throw c.error;
        data = normalise(c.data && c.data.data); original = JSON.stringify(data); dirty = false;
        clearGate();
        state.opened = true; state.instant = true;
        render();
        buildEditor();
      });
    }).catch(function (e) { showLogin(friendly(e)); });
  }
  function adminBoot() {
    if (!window.supabase || !CFG.url || !CFG.key) { showGate('<h1>Not set up</h1><p>config.js is missing the Supabase address or key.</p>'); return; }
    sb = window.supabase.createClient(CFG.url, CFG.key);
    window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (s) enter(s.user); else showLogin();
    }, function () { showLogin(); });
  }

  /* ---------- go ---------- */
  if (ADMIN) {
    document.body.classList.add('admin');
    adminBoot();
  } else {
    htmlEl.classList.add('locked');
    loaded = loadForGuest();
    render();
  }
})();
