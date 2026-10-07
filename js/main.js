/* Hotel Norling — shared behaviour */
(function () {
  'use strict';
  var PHONE = '9779861992777';
  var doc = document.documentElement;
  doc.classList.add('js');

  /* ---------- WhatsApp booking ---------- */
  function message(o) {
    o = o || {};
    return 'Namaste Hotel Norling! I would like to book a stay.\n' +
      '- Check-in Date: ' + (o.checkin || '') + '\n' +
      '- Check-out Date: ' + (o.checkout || '') + '\n' +
      '- Number of Guests: ' + (o.guests || '') + '\n' +
      '- Room Type: ' + (o.room || '(Standard Shared / Deluxe Attached)') + '\n' +
      '- Any Dietary Preferences: ' + (o.notes || '');
  }
  function waUrl(o) { return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(message(o)); }

  document.querySelectorAll('[data-book]').forEach(function (a) {
    a.href = waUrl({ room: a.getAttribute('data-book') });
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });

  function iso(d) { return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'); }
  var today = new Date();

  document.querySelectorAll('form.book-form').forEach(function (form) {
    var cin = form.querySelector('[name=checkin]');
    var cout = form.querySelector('[name=checkout]');
    var err = form.querySelector('.form-error');
    if (cin) cin.min = iso(today);
    if (cout) cout.min = iso(today);
    function validate() {
      if (cin && cout && cin.value) {
        var d = new Date(cin.value + 'T12:00:00'); d.setDate(d.getDate() + 1);
        cout.min = iso(d);
      }
      if (cin && cout && cin.value && cout.value && cout.value <= cin.value) {
        err.textContent = 'Please choose a check-out date after your check-in date.';
        return false;
      }
      err.textContent = '';
      return true;
    }
    form.addEventListener('change', validate);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) { cout.focus(); return; }
      var v = function (n) { var el = form.querySelector('[name=' + n + ']'); return el ? el.value.trim() : ''; };
      var url = waUrl({ checkin: v('checkin'), checkout: v('checkout'), guests: v('guests'), room: v('room'), notes: v('notes') });
      var w = window.open(url, '_blank', 'noopener,noreferrer');
      if (!w) window.location.href = url;
    });
  });

  /* ---------- header + mobile nav ---------- */
  var header = document.querySelector('.site-header');
  var onScroll = function () { header && header.classList.toggle('scrolled', window.scrollY > 10); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var toggle = document.querySelector('.menu-toggle');
  var mnav = document.getElementById('mobile-nav');
  function setNav(open) {
    if (!toggle) return;
    if (open && header) doc.style.setProperty('--mnav-top', header.getBoundingClientRect().bottom + 'px');
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (mnav) mnav.inert = !open;
  }
  if (mnav) mnav.inert = true;
  toggle && toggle.addEventListener('click', function () { setNav(!document.body.classList.contains('nav-open')); });
  mnav && mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
  window.addEventListener('resize', function () { if (window.innerWidth > 980) setNav(false); });

  /* ---------- gallery filters ---------- */
  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var f = b.getAttribute('data-filter');
      filterBar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      document.querySelectorAll('.gallery-grid .tile').forEach(function (t) {
        t.hidden = !(f === 'all' || (t.getAttribute('data-cat') || '').split(' ').indexOf(f) > -1);
      });
    });
  }

  /* ---------- lightbox ---------- */
  var lb, lbImg, lbCap, lbCount, items = [], idx = 0, lastFocus;
  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<span class="count"></span><button class="lb-btn lb-close" aria-label="Close">×</button>' +
      '<button class="lb-btn lb-prev" aria-label="Previous photo">‹</button><figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lb-btn lb-next" aria-label="Next photo">›</button>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('img'); lbCap = lb.querySelector('figcaption'); lbCount = lb.querySelector('.count');
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') close(); });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); x0 = null;
    });
  }
  function show(i) {
    idx = (i + items.length) % items.length;
    var t = items[idx], im = t.querySelector('img');
    lbImg.src = t.getAttribute('data-full') || im.currentSrc || im.src;
    lbImg.alt = im.alt;
    lbCap.textContent = t.getAttribute('data-caption') || im.alt;
    lbCount.textContent = (idx + 1) + ' / ' + items.length;
    var multi = items.length > 1;
    lb.querySelector('.lb-prev').hidden = !multi; lb.querySelector('.lb-next').hidden = !multi;
  }
  function open(tile) {
    if (!lb) buildLightbox();
    var group = tile.getAttribute('data-lightbox');
    items = Array.prototype.filter.call(document.querySelectorAll('[data-lightbox="' + group + '"]'), function (t) { return !t.hidden; });
    lastFocus = document.activeElement;
    lb.classList.add('open'); document.body.style.overflow = 'hidden';
    show(items.indexOf(tile));
    lb.querySelector('.lb-close').focus();
  }
  function close() { lb.classList.remove('open'); document.body.style.overflow = ''; lbImg.src = ''; lastFocus && lastFocus.focus(); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-lightbox]'); if (t) { e.preventDefault(); open(t); }
  });
  document.addEventListener('keydown', function (e) {
    if (lb && lb.classList.contains('open')) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'Tab') { // keep focus inside
        var f = Array.prototype.filter.call(lb.querySelectorAll('button'), function (b) { return !b.hidden; });
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    } else if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setNav(false); toggle.focus(); }
  });

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('in'); }); }

  var y = document.getElementById('year'); if (y) y.textContent = today.getFullYear();
})();
