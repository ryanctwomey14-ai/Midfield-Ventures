/* Midfield Ventures — site behaviour
   Everything here is progressive enhancement: with JS disabled the page is
   fully readable, every link works, and no content is hidden. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Mobile navigation ------------------------------------------------ */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
    });
    // Escape closes the menu and returns focus to the trigger.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        burger.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
        burger.focus();
      }
    });
  }

  /* ---- Header shadow on scroll ------------------------------------------ */
  var header = document.querySelector('.header');
  var sticky = document.querySelector('.sticky-cta');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-stuck', y > 8);
    // The mobile bar appears only after the hero, so it never competes with
    // the hero's own CTA for the same tap.
    if (sticky) sticky.classList.toggle('show', y > window.innerHeight * 0.8);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---- Scroll reveal ----------------------------------------------------
     Transitions rather than keyframes so a fast scroll retargets instead of
     restarting. Children of [data-stagger] enter 60ms apart.               */
  var revealables = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window) || reduce) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var group = el.closest('[data-stagger]');
        var delay = 0;
        if (group) {
          var kids = group.querySelectorAll('.rv');
          delay = Math.min(Array.prototype.indexOf.call(kids, el), 8) * 60;
        }
        el.style.transitionDelay = delay + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---- Hero background video -------------------------------------------
     Attached rather than hard-coded so it costs nothing when it should not
     play. It is skipped entirely under reduced-motion, on small screens
     (data), and when the device reports a metered or slow connection. The
     poster still is what shows in every one of those cases.               */
  var heroVideo = document.querySelector('.hero-video');
  var heroPoster = document.querySelector('.hero-poster');

  if (heroPoster) {
    // Marks the poster as present so the placeholder note can hide itself.
    var flagPoster = function () {
      if (heroPoster.naturalWidth > 0) heroPoster.setAttribute('data-loaded', '');
    };
    if (heroPoster.complete) flagPoster();
    else heroPoster.addEventListener('load', flagPoster);
  }

  if (heroVideo) {
    var conn = navigator.connection || {};
    var cheapData = conn.saveData === true || /2g/.test(conn.effectiveType || '');
    var bigScreen = window.matchMedia('(min-width: 760px)').matches;

    if (!reduce && bigScreen && !cheapData) {
      ['webm', 'mp4'].forEach(function (type) {
        var url = heroVideo.getAttribute('data-' + type);
        if (!url) return;
        var s = document.createElement('source');
        s.src = url;
        s.type = 'video/' + type;
        heroVideo.appendChild(s);
      });
      heroVideo.addEventListener('playing', function () {
        heroVideo.classList.add('is-playing');
      });
      heroVideo.load();
      var attempt = heroVideo.play();
      // Autoplay can still be refused; the poster is already the fallback.
      if (attempt && attempt.catch) attempt.catch(function () {});

      // Stop decoding while the hero is off screen — it is pure battery cost.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { heroVideo.play().catch(function () {}); }
            else { heroVideo.pause(); }
          });
        }, { threshold: 0.05 }).observe(heroVideo);
      }
    }
  }

  /* ---- Expanding cards ---------------------------------------------------
     Hover, focus or tap expands a panel and collapses the rest. The track is
     sized with inline grid-template so the CSS transition animates it; the
     axis flips to rows on narrow screens.                                  */
  Array.prototype.forEach.call(document.querySelectorAll('[data-expand]'), function (list) {
    var panels = Array.prototype.slice.call(list.children);
    if (!panels.length) return;
    var wide = window.matchMedia('(min-width: 861px)');

    function paint(active) {
      var track = panels.map(function (_, i) { return i === active ? '5fr' : '1fr'; }).join(' ');
      if (wide.matches) {
        list.style.gridTemplateColumns = track;
        list.style.gridTemplateRows = '1fr';
      } else {
        list.style.gridTemplateRows = track;
        list.style.gridTemplateColumns = '1fr';
      }
      panels.forEach(function (p, i) {
        p.setAttribute('data-active', String(i === active));
      });
    }

    panels.forEach(function (p, i) {
      // Pointer devices expand on hover; touch and keyboard use tap/focus.
      p.addEventListener('mouseenter', function () { paint(i); });
      p.addEventListener('focus', function () { paint(i); });
      p.addEventListener('click', function () { paint(i); });
      p.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); paint(i); }
      });
    });

    // Re-paint on axis change so the track is not left sized for the old one.
    if (wide.addEventListener) {
      wide.addEventListener('change', function () {
        paint(panels.findIndex(function (p) { return p.getAttribute('data-active') === 'true'; }));
      });
    }
    paint(0);
  });

  /* ---- Chart: crosshair, tooltip, legend toggle, table view --------------
     The SVG is rendered in the HTML, so the chart is fully readable with JS
     off. This only layers interaction on top.                              */
  var chart = document.getElementById('cashflow-chart');
  if (chart) {
    var svg = chart.querySelector('svg');
    var tip = chart.querySelector('.c-tip');
    var cross = chart.querySelector('.c-crosshair');
    var plot = chart.querySelector('.chart-plot');
    var dots = chart.querySelectorAll('.c-dot');
    var table = chart.querySelector('.chart-table');

    // series metadata read back off the rendered marks — no duplicated data
    var series = [];
    Array.prototype.forEach.call(chart.querySelectorAll('.c-key'), function (el) {
      series.push({
        key: el.getAttribute('data-s'),
        name: el.textContent.trim(),
        hex: el.querySelector('.c-ring').style.borderColor
      });
    });

    function show(i) {
      var pts = [];
      Array.prototype.forEach.call(dots, function (d) {
        var on = d.getAttribute('data-i') === String(i) && d.getAttribute('data-off') !== 'true';
        d.setAttribute('data-on', String(on));
        if (on) pts.push(d);
      });
      if (!pts.length) return hide();

      var x = parseFloat(pts[0].getAttribute('cx'));
      cross.setAttribute('x1', x); cross.setAttribute('x2', x);
      cross.hidden = false;

      var rows = pts.map(function (d) {
        var s = series.filter(function (s) { return s.key === d.getAttribute('data-s'); })[0];
        var v = table.rows[i + 1].cells[series.indexOf(s) + 1].textContent;
        return '<span class="r"><span class="lbl"><i style="border-color:' + s.hex + '"></i>' +
               s.name + '</span><span class="v">' + v + '</span></span>';
      }).join('');
      tip.innerHTML = '<b>Year ' + (i + 1) + '</b>' + rows;
      tip.hidden = false;

      // position in CSS pixels, clamped so it never leaves the card
      var box = svg.getBoundingClientRect();
      var vb = svg.viewBox.baseVal;
      var scale = box.width / vb.width;
      var topY = Math.min.apply(null, pts.map(function (d) { return parseFloat(d.getAttribute('cy')); }));
      tip.style.left = Math.max(60, Math.min(box.width - 60, x * scale)) + 'px';
      tip.style.top = (topY * scale - 12) + 'px';
    }

    function hide() {
      cross.hidden = true;
      tip.hidden = true;
      Array.prototype.forEach.call(dots, function (d) { d.setAttribute('data-on', 'false'); });
    }

    Array.prototype.forEach.call(chart.querySelectorAll('.c-hit'), function (h) {
      h.addEventListener('mouseenter', function () { show(+h.getAttribute('data-i')); });
    });
    plot.addEventListener('mouseleave', hide);

    // keyboard: arrow through the years
    svg.setAttribute('tabindex', '0');
    var cur = -1;
    svg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        cur = Math.max(0, Math.min(6, cur + (e.key === 'ArrowRight' ? 1 : -1)));
        show(cur);
      } else if (e.key === 'Escape') { hide(); cur = -1; }
    });
    svg.addEventListener('blur', hide);

    // legend toggles a series without repainting the survivors
    Array.prototype.forEach.call(chart.querySelectorAll('.c-key'), function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(on));
        var k = btn.getAttribute('data-s');
        Array.prototype.forEach.call(chart.querySelectorAll('[data-s="' + k + '"]'), function (el) {
          if (el === btn) return;
          el.setAttribute('data-off', String(!on));
        });
        hide();
      });
    });

    var toggle = chart.querySelector('.c-table-toggle');
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      table.hidden = open;
      toggle.textContent = open ? 'Show data' : 'Hide data';
    });
  }

  /* ---- Illustration calculator -------------------------------------------
     The exit payment is SOLVED from the target IRR rather than assumed, so the
     cash-on-cash and IRR assumptions stay internally consistent:

       exit = (P - d x annuityFactor) x (1+r)^n

     where d is the annual distribution and the annuity factor discounts those
     distributions. Everything is shown as a low-to-high range because both
     inputs are ranges.                                                      */
  var calc = document.getElementById('calc');
  if (calc) {
    var LOW = { coc: 0.07, irr: 0.15 };
    var HIGH = { coc: 0.10, irr: 0.20 };

    var amount = document.getElementById('calc-amount');
    var years = document.getElementById('calc-years');

    // Rounded to the nearest hundred: an illustration built on range
    // assumptions has no business showing a figure to the dollar.
    var money = function (n) {
      return '$' + (Math.round(n / 100) * 100).toLocaleString('en-US');
    };
    var range = function (lo, hi, fmt) {
      return fmt(lo) + ' – ' + fmt(hi);
    };

    function model(P, n, a) {
      var d = P * a.coc;
      var r = a.irr;
      var af = (1 - Math.pow(1 + r, -n)) / r;      // present value of the income stream
      var exit = (P - d * af) * Math.pow(1 + r, n);
      var income = d * n;
      return { annual: d, income: income, exit: exit, total: income + exit };
    }

    function paint() {
      var P = +amount.value;
      var n = +years.value;
      var lo = model(P, n, LOW);
      var hi = model(P, n, HIGH);

      document.getElementById('calc-amount-out').textContent = money(P);
      document.getElementById('calc-years-out').textContent = n + (n === 1 ? ' year' : ' years');

      var set = function (id, txt) { document.getElementById(id).innerHTML = txt; };
      set('r-total', range(lo.total, hi.total, money));
      set('r-profit', range(lo.total - P, hi.total - P, money));
      set('r-annual', range(lo.annual, hi.annual, money));
      set('r-income', range(lo.income, hi.income, money));
      set('r-exit', range(lo.exit, hi.exit, money));
      set('r-multiple', range(lo.total / P, hi.total / P, function (m) {
        return m.toFixed(2) + '×';
      }));
    }

    amount.addEventListener('input', paint);
    years.addEventListener('input', paint);
    paint();
  }

  /* ---- FAQ: one open at a time ------------------------------------------
     Keeps the list scannable; an accordion with six panels open is just a
     long page again.                                                       */
  var accs = document.querySelectorAll('.acc[data-single]');
  Array.prototype.forEach.call(accs, function (acc) {
    var items = acc.querySelectorAll('details');
    Array.prototype.forEach.call(items, function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        Array.prototype.forEach.call(items, function (other) {
          if (other !== d) other.open = false;
        });
      });
    });
  });

  /* ---- Investor-list form ----------------------------------------------
     Client-side only: qualification questions branch the confirmation copy
     so a non-accredited visitor is routed to education instead of a dead
     end, and nothing is promised that the back end has not delivered.      */
  var form = document.getElementById('investor-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = document.getElementById('form-status');
      var btn = form.querySelector('button[type="submit"]');
      // Homepage form asks for a call; the /invest form still qualifies on
      // accreditation. Branch on whichever field is actually present.
      var accredited = form.querySelector('[name="accredited"]');
      var wantsCall = !accredited;
      var isAccredited = accredited && accredited.value === 'yes';

      btn.disabled = true;
      btn.textContent = 'Sending…';

      // Replace with the real endpoint (see website/README.md).
      window.setTimeout(function () {
        form.hidden = true;
        status.hidden = false;
        status.querySelector('[data-branch]').textContent = wantsCall
          ? 'Tim or Kim will email you within one business day to find a time that works. If it is urgent, call us directly.'
          : isAccredited
            ? 'Watch for an email from Tim or Kim within one business day to set up a short introductory call.'
            : 'We have added you to the education list. We will send the primer and let you know when an offering opens that fits.';
        status.focus();
      }, 700);
    });
  }

  /* ---- Current year ------------------------------------------------------ */
  var yr = document.querySelectorAll('[data-year]');
  Array.prototype.forEach.call(yr, function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
