/* Midfield Ventures — investor assistant
   ---------------------------------------------------------------------------
   Answers questions using ONLY the site's published FAQ copy (assets/js/kb.js,
   generated at build time). It is not a language model and does not generate
   prose, which is deliberate: on a securities site a model that free-forms
   answers about returns, fees or risk can invent a figure or produce something
   that reads as investment advice. Every reply here is copy that is already on
   the site and has been through the same review.

   When it cannot match a question with confidence it says so and routes the
   person to a human, which is the correct behaviour rather than a limitation.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var KB = window.MIDFIELD_KB || [];
  if (!KB.length) return;

  var STOP = ('a an and are as at be but by can do does for from have how i if in is it its me my '
    + 'of on or our so than that the their there these they this to was what when where which who '
    + 'will with would you your do i can you tell about get').split(' ');

  function tokens(s) {
    return s.toLowerCase().replace(/[^a-z0-9\s%$-]/g, ' ').split(/\s+/)
      .filter(function (w) { return w.length > 2 && STOP.indexOf(w) === -1; });
  }

  // Pre-tokenise once. Question terms are weighted over answer terms so a
  // question about "fees" beats an answer that merely mentions fees.
  var decode = function (s) {
    var d = document.createElement('textarea');
    d.innerHTML = s;
    return d.value;
  };
  KB.forEach(function (e) {
    e.q = decode(e.q);
    e.a = decode(e.a);
    e._q = tokens(e.q);
    e._a = tokens(e.a);
  });

  function byPhrase(fragment) {
    for (var i = 0; i < KB.length; i++) {
      if (KB[i].q.toLowerCase().indexOf(fragment) !== -1) return KB[i];
    }
    return null;
  }

  function search(query) {
    // If an alias fires we KNOW the topic. Either the published answer exists,
    // or it does not and we stop — falling through to fuzzy scoring here would
    // hand back a confidently wrong answer about fees or tax, which is worse
    // than admitting we cannot answer.
    for (var i = 0; i < ALIAS.length; i++) {
      if (ALIAS[i][0].test(query)) {
        return byPhrase(ALIAS[i][1]);
      }
    }
    var qt = tokens(query);
    if (!qt.length) return null;
    var best = null;
    KB.forEach(function (e) {
      var score = 0;
      qt.forEach(function (w) {
        if (e._q.indexOf(w) !== -1) score += 3;
        else if (e._q.some(function (t) { return t.indexOf(w) === 0 || w.indexOf(t) === 0; })) score += 2;
        else if (e._a.indexOf(w) !== -1) score += 1;
      });
      score = score / Math.sqrt(qt.length);          // normalise for query length
      if (!best || score > best.score) best = { entry: e, score: score };
    });
    return best && best.score >= 2.0 ? best.entry : null;
  }

  /* Common phrasings that share no words with the published question.
     Routing only — each still resolves to a published answer, never a new one. */
  var ALIAS = [
    [/(fee|charge|commission|make money|get paid|compensat|promote|split)/i, 'get paid'],
    [/(k-?1|tax form|schedule k)/i, 'k-1'],
    [/(minimum|how much do i need|smallest|least i can)/i, 'minimum investment'],
    [/(lock|tied up|liquid|get out|redeem|withdraw|early)/i, 'money committed'],
    [/(accredit|qualify|eligible)/i, 'accredited'],
    [/(ira|401|retirement|self-directed)/i, 'ira'],
    [/(scam|legit|trust you|due diligence|verify)/i, 'not a scam'],
    [/(lose|risk|downside|worst case)/i, 'lose my entire'],
    [/(who runs|who are you|founders|team|principals)/i, 'actually running'],
    [/(report|update|statement|how will i know)/i, 'reporting will i receive'],
    [/(depreciat|write off|tax benefit|shelter)/i, 'depreciation'],
    [/(wire|send the money|fund|payment)/i, 'send the money'],
    [/(sell|exit|when do you sell)/i, 'decide when to sell'],
    [/(capital call)/i, 'capital call']
  ];

  var GREETING = /^(hi|hey|hello|good (morning|afternoon|evening))\b/i;

  var FALLBACK =
    'I can only answer from what is published on this site, and I could not find that one. '
    + 'Tim or Kim can answer it properly — you can <a href="schedule.html">book a call</a> or '
    + '<a href="contact.html">send them the question</a>. You might also find it in the '
    + '<a href="faq.html">full FAQ</a>.';

  // Built from the bank itself — a hardcoded chip can point at an answer that
  // was excluded for still holding a [placeholder].
  var SUGGESTED = ['minimum investment', 'money committed', 'accredited',
                   'lose my entire', 'actually running']
    .map(function (frag) {
      for (var i = 0; i < KB.length; i++) {
        if (KB[i].q.toLowerCase().indexOf(frag) !== -1) return KB[i].q;
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 4);

  /* ---- build the widget ------------------------------------------------- */
  var launch = document.createElement('button');
  launch.className = 'bot-launch';
  launch.type = 'button';
  launch.setAttribute('aria-expanded', 'false');
  launch.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 01-8 8H7l-4 3v-5.5A8 8 0 1121 12z"/></svg>Ask a question';

  var panel = document.createElement('div');
  panel.className = 'bot-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-label', 'Investor questions');
  panel.hidden = true;
  panel.innerHTML =
    '<div class="bot-head">'
    + '<img src="assets/img/emblem-white-96.png" alt="" aria-hidden="true">'
    + '<span class="t"><b>Ask about investing</b><span>Answers from our FAQ</span></span>'
    + '<button type="button" class="bot-close" aria-label="Close">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'
    + '</div>'
    + '<div class="bot-log" role="log" aria-live="polite"></div>'
    + '<div class="bot-chips"></div>'
    + '<form class="bot-form">'
    + '<label class="sr-only" for="bot-input">Your question</label>'
    + '<input id="bot-input" type="text" autocomplete="off" placeholder="Ask about fees, minimums, taxes…">'
    + '<button class="bot-send" type="submit" aria-label="Send">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button>'
    + '</form>'
    + '<p class="bot-legal">Answers come from this site&rsquo;s FAQ. Nothing here is investment, '
    + 'tax or legal advice, or an offer to sell a security.</p>';

  document.body.appendChild(launch);
  document.body.appendChild(panel);

  var log = panel.querySelector('.bot-log');
  var chips = panel.querySelector('.bot-chips');
  var form = panel.querySelector('.bot-form');
  var input = panel.querySelector('#bot-input');

  function say(html, who) {
    var m = document.createElement('div');
    m.className = 'bot-msg ' + (who || 'them');
    m.innerHTML = html;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
  }

  function renderChips() {
    chips.innerHTML = '';
    SUGGESTED.forEach(function (q) {
      var c = document.createElement('button');
      c.type = 'button';
      c.className = 'bot-chip';
      c.textContent = q;
      c.addEventListener('click', function () { ask(q); });
      chips.appendChild(c);
    });
  }

  function ask(text) {
    say(text.replace(/</g, '&lt;'), 'you');
    chips.innerHTML = '';
    input.value = '';

    window.setTimeout(function () {
      if (GREETING.test(text.trim())) {
        say('Hello. Ask me anything about how investing with Midfield works — '
          + 'minimums, fees, taxes, timelines or risk.');
        renderChips();
        return;
      }
      var hit = search(text);
      say(hit ? hit.a : FALLBACK);
      if (!hit) renderChips();
    }, 260);
  }

  var lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    panel.hidden = false;
    window.requestAnimationFrame(function () { panel.classList.add('open'); });
    launch.hidden = true;
    launch.setAttribute('aria-expanded', 'true');
    if (!log.children.length) {
      say('Hi — I can answer questions about Midfield and how these investments work, '
        + 'using the answers published on this site. What would you like to know?');
      renderChips();
    }
    input.focus();
  }

  function close() {
    panel.classList.remove('open');
    launch.hidden = false;
    launch.setAttribute('aria-expanded', 'false');
    window.setTimeout(function () { panel.hidden = true; }, 220);
    if (lastFocus) lastFocus.focus();
  }

  launch.addEventListener('click', open);
  panel.querySelector('.bot-close').addEventListener('click', close);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value.trim();
    if (v) ask(v);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });
})();
