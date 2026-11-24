/* =========================================================
   에스앤이경영컨설팅 — 공통 동작
   1) 등장 애니메이션  2) 헤더·모바일 메뉴  3) 메인 히어로 항로 그림
   4) 서비스: 사례 필터·자가진단  5) 상담: 신청 폼·FAQ
   ========================================================= */
(function () {
  'use strict';

  var NARROW = '(max-width: 899.98px)';
  function isNarrow() { return window.matchMedia(NARROW).matches; }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- 1. 등장 애니메이션 (스크롤하면 아래에서 떠오름) ---------- */
  (function motion() {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('se-motion');

    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function runCount(el, wait) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      setTimeout(function () {
        var t0 = performance.now(), dur = 1600;
        (function step(now) {
          var p = Math.min(1, (now - t0) / dur);
          el.textContent = String(Math.round(target * ease(p)));
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      }, wait);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.setAttribute('data-in', '');
        io.unobserve(el);
        var d = parseInt(el.style.transitionDelay) || 0;
        el.querySelectorAll('[data-count]').forEach(function (c) { runCount(c, d + 250); });
        setTimeout(function () { el.style.transitionDelay = ''; }, d + 1200);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    function tag(el, delay) {
      if (el.__se) return;
      el.__se = 1;
      if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
      var d = el.getAttribute('data-delay');
      el.style.transitionDelay = (d != null ? d : delay) + 'ms';
      el.querySelectorAll('[data-count]').forEach(function (c) { c.textContent = '0'; });
      io.observe(el);
    }

    function scan() {
      document.querySelectorAll('section:not(#top)').forEach(function (sec) {
        var box = sec.querySelector(':scope > div:last-of-type');
        if (!box) return;
        Array.prototype.forEach.call(box.children, function (c, i) { tag(c, Math.min(i, 4) * 90); });
      });
      document.querySelectorAll('[data-reveal]').forEach(function (el) { tag(el, 0); });
    }

    if (document.readyState !== 'loading') scan();
    else document.addEventListener('DOMContentLoaded', scan);
  })();

  /* ---------- 2. 헤더 · 모바일 메뉴 ---------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var toggle = header.querySelector('[data-menu-toggle]');
    var menu = header.querySelector('.mobile-menu');
    var open = false, wasNarrow = isNarrow();

    function paint() {
      header.classList.toggle('is-solid', window.scrollY > 40 || open);
      if (menu) menu.hidden = !open;
      if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function setOpen(v) { open = v; paint(); }

    if (toggle) toggle.addEventListener('click', function () { setOpen(!open); });
    $all('[data-menu-close]', header).forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    window.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', function () {
      var n = isNarrow();
      if (n !== wasNarrow) { wasNarrow = n; open = false; }
      paint();
    });
    paint();
  }

  /* ---------- 3. 메인 히어로: 한국에서 뻗어 나가는 항로 그림 ---------- */
  function initHeroRoutes() {
    var host = document.querySelector('[data-hero-routes]');
    if (!host) return;
    var SVG = 'http://www.w3.org/2000/svg';
    var FONT = "font-family:'A2z', sans-serif; font-weight:700; font-size:12px; letter-spacing:0.18em;";
    var mode = null, labels = [];

    function el(name, attrs, style, text) {
      var n = document.createElementNS(SVG, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (style) n.setAttribute('style', style);
      if (text) n.textContent = text;
      return n;
    }

    function config(narrow) {
      return narrow ? {
        vb: '0 0 400 860', K: [300, 200], aspect: 'xMidYMid slice', opacity: 0.6,
        routes: [
          { to: [440, 110], c: [390, 80] },
          { to: [-40, 330], c: [140, 160] },
          { to: [-40, 640], c: [110, 330] },
          { to: [440, 480], c: [420, 300] }
        ]
      } : {
        vb: '0 0 1440 900', K: [1180, 290], aspect: 'xMidYMin slice', opacity: 1,
        routes: [
          { to: [1400, 170], c: [1310, 100], label: 'USA', ly: -16 },
          { to: [90, 150], c: [640, 20], label: 'EUROPE', ly: -16 },
          { to: [940, 600], c: [1140, 500], label: 'SE ASIA', ly: 30 },
          { to: [1350, 470], c: [1310, 370], label: 'ASIA', ly: 30 }
        ]
      };
    }

    // 넓은 화면: 화면 밖으로 잘리는 지역 이름은 숨기고, 가장자리에 붙지 않게 위치를 조정
    function placeLabels() {
      var vw = window.innerWidth || 1440, H = Math.max(window.innerHeight || 900, 640);
      var sc = Math.max(vw / 1440, H / 900), x0 = (1440 - vw / sc) / 2, yMax = H / sc, yMin = 84 / sc;
      var pad = 16 / sc + 40;
      labels.forEach(function (l) {
        var r = l.route;
        l.node.setAttribute('x', Math.min(Math.max(r.to[0], x0 + pad), 1440 - x0 - pad));
        var ly = r.to[1] + r.ly;
        l.node.style.display = (ly + 6 > yMax || ly - 12 < yMin) ? 'none' : '';
      });
    }

    function build(narrow) {
      var c = config(narrow), K = c.K;
      labels = [];
      var svg = el('svg', { viewBox: c.vb, preserveAspectRatio: c.aspect },
        'width:100%; height:100%; display:block; opacity:' + c.opacity + ';');
      c.routes.forEach(function (r, i) {
        var d = 'M ' + K[0] + ' ' + K[1] + ' Q ' + r.c[0] + ' ' + r.c[1] + ' ' + r.to[0] + ' ' + r.to[1];
        var start = 0.5 + i * 0.35, end = start + 2.2;
        var g = el('g', {});
        g.appendChild(el('path', { d: d, fill: 'none', stroke: 'rgba(255,106,19,0.3)', 'stroke-width': 1, 'stroke-dasharray': '2 8' },
          'animation:se-fade 1s ease ' + start + 's both;'));
        g.appendChild(el('path', { d: d, fill: 'none', stroke: '#FF6A13', 'stroke-width': 1.6, 'stroke-linecap': 'round', pathLength: 1000, 'stroke-dasharray': '1000' },
          'animation:se-draw 2.2s cubic-bezier(.5,0,.2,1) ' + start + 's both;'));
        g.appendChild(el('path', { d: d, fill: 'none', stroke: '#FFB27F', 'stroke-width': 2.4, 'stroke-linecap': 'round', pathLength: 1000, 'stroke-dasharray': '50 950' },
          'animation:se-fade .4s ease ' + end + 's both, se-travel 4.8s linear ' + end + 's infinite;'));
        g.appendChild(el('circle', { cx: r.to[0], cy: r.to[1], r: 3.5, fill: '#FF6A13' },
          'animation:se-fade .5s ease ' + (end - 0.2) + 's both;'));
        if (r.label) {
          var t = el('text', { x: r.to[0], y: r.to[1] + r.ly, fill: '#FFFFFF', 'text-anchor': 'middle' },
            FONT + ' animation:se-fade .6s ease ' + end + 's both;', r.label);
          g.appendChild(t);
          labels.push({ node: t, route: r });
        }
        svg.appendChild(g);
      });
      svg.appendChild(el('circle', { cx: K[0], cy: K[1], r: 5, fill: 'none', stroke: '#FF6A13', 'stroke-width': 1.5 },
        'transform-box:fill-box; transform-origin:center; animation:se-ring 2.6s ease-out 0.3s infinite;'));
      svg.appendChild(el('circle', { cx: K[0], cy: K[1], r: 5, fill: '#FF6A13' }));
      svg.appendChild(el('text', { x: K[0] + 14, y: K[1] - 12, fill: '#FF6A13' }, FONT, 'KOREA'));
      host.innerHTML = '';
      host.appendChild(svg);
    }

    function render() {
      var n = isNarrow();
      if (n !== mode) { mode = n; build(n); }
      placeLabels();
    }
    window.addEventListener('resize', render);
    render();
  }

  /* ---------- 4. 서비스: 사례 필터 · 수출 준비도 자가진단 ---------- */
  function initServices() {
    var tabs = $all('[data-case-filter]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-case-filter');
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        $all('article[data-cat]').forEach(function (a) {
          a.hidden = !(key === 'all' || a.getAttribute('data-cat') === key);
        });
      });
    });

    var checks = $all('[data-check]');
    if (!checks.length) return;
    var STAGES = [
      ['준비 단계', '수출의 기본 정보부터 차근차근 정리하면 됩니다. 목표 국가를 정하는 일부터 함께 시작하십시오.'],
      ['실행 가능 단계', '기본은 갖춰져 있습니다. 비어 있는 항목만 채우면 바로 수출을 시작할 수 있습니다.'],
      ['확장 단계', '수출 준비가 잘 되어 있습니다. 이제 판로와 진출 국가를 넓힐 때입니다.']
    ];
    var countEl = document.querySelector('[data-check-count]');
    var stageEl = document.querySelector('[data-check-stage]');
    var descEl = document.querySelector('[data-check-desc]');
    function update() {
      var count = checks.filter(function (c) { return c.classList.contains('is-checked'); }).length;
      var s = count <= 1 ? STAGES[0] : count <= 3 ? STAGES[1] : STAGES[2];
      countEl.textContent = String(count);
      stageEl.textContent = s[0];
      descEl.textContent = s[1];
    }
    checks.forEach(function (c) {
      c.addEventListener('click', function () {
        var on = !c.classList.contains('is-checked');
        c.classList.toggle('is-checked', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
        c.querySelector('.check-box').textContent = on ? '✓' : '';
        update();
      });
    });
  }

  /* ---------- 5. 상담: 신청 폼(메일 앱으로 보내기) · 자주 묻는 질문 ---------- */
  function initContact() {
    var EMAIL = 'roejaewon@gmail.com';
    var sendBtn = document.querySelector('[data-send]');
    if (sendBtn) {
      var field = function (n) { return document.querySelector('[name="' + n + '"]'); };
      var note = document.querySelector('[data-note]');
      $all('[data-interest]').forEach(function (b) {
        b.addEventListener('click', function () {
          var on = !b.classList.contains('is-active');
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
      var DEFAULT_NOTE = note.textContent, tried = false;
      // 필수 항목(이름·회사명) 확인 — 한 번 보내기를 누른 뒤에는 입력할 때마다 다시 확인
      function validate() {
        var name = field('name').value.trim(), company = field('company').value.trim();
        field('name').classList.toggle('is-missing', tried && !name);
        field('company').classList.toggle('is-missing', tried && !company);
        var missing = tried && (!name || !company);
        if (missing) note.textContent = '이름과 회사명을 입력해 주세요.';
        else if (note.classList.contains('is-error')) note.textContent = DEFAULT_NOTE;
        note.classList.toggle('is-error', missing);
        return !missing;
      }
      ['name', 'company'].forEach(function (n) { field(n).addEventListener('input', validate); });
      sendBtn.addEventListener('click', function () {
        tried = true;
        if (!validate()) return;
        tried = false;
        var name = field('name').value.trim(), company = field('company').value.trim();
        var picked = $all('[data-interest].is-active').map(function (b) { return b.getAttribute('data-interest'); });
        var subject = '[무료 진단 신청] ' + company;
        var body = [
          '이름: ' + name,
          '회사명: ' + company,
          '업종: ' + field('industry').value.trim(),
          '관심 분야: ' + picked.join(', '),
          '',
          '문의 내용:',
          field('message').value.trim()
        ].join('\n');
        window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        note.textContent = '메일 앱이 열립니다. 열리지 않으면 ' + EMAIL + '으로 보내 주세요.';
        note.classList.remove('is-error');
      });
    }

    var faqs = $all('[data-faq]');
    faqs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var willOpen = btn.getAttribute('aria-expanded') !== 'true';
        faqs.forEach(function (b) {
          var on = b === btn && willOpen;
          b.setAttribute('aria-expanded', on ? 'true' : 'false');
          b.querySelector('[data-faq-sign]').textContent = on ? '−' : '+';
          b.parentNode.querySelector('[data-faq-answer]').hidden = !on;
        });
      });
    });
  }

  function init() {
    initHeader();
    initHeroRoutes();
    initServices();
    initContact();
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
