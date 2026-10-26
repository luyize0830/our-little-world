/* ==========================================================================
   intro.js — 首页开场动画（FR-01）
   分镜：信封飘落(0.6s) → 翻盖打开(0.6s) → 打字机称呼(0.8s) → 副标题+星星(0.8s) → 遮罩上滑(0.4s)
   规则：同会话只播一次；?intro=1 强制重播；可跳过；点击屏幕跳到结尾
   ========================================================================== */
(function (window, document) {
  'use strict';

  var U = window.Utils;
  var DATA = U ? U.data : (window.SITE_DATA || {});
  var KEY = 'intro_played';
  var FORCE = /[?&]intro=1/.test(window.location.search);

  var TIMELINE = { typeStart: 1180, typedAt: 1980, leaveAt: 2760, doneAt: 3200 };
  var timers = [];

  function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(window.clearTimeout); timers = []; }

  function shouldPlay() {
    if (FORCE) return true;
    if (U && U.prefersReducedMotion()) return false;
    try { return !window.sessionStorage.getItem(KEY); }
    catch (e) { return true; }   // 隐私模式下每次都播，不报错
  }

  function markPlayed() {
    try { window.sessionStorage.setItem(KEY, '1'); } catch (e) { /* 忽略 */ }
  }

  /* ---------- 信封 SVG（手绘风） ---------- */
  function envelopeSVG() {
    var stroke = 'stroke="#C8A27A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
    return {
      back: '<svg class="env-back" viewBox="0 0 300 200" fill="none" aria-hidden="true">' +
        '<rect x="12" y="50" width="276" height="140" rx="14" fill="#FFFDF8" ' + stroke + '/>' +
        '</svg>',
      front: '<svg class="env-front" viewBox="0 0 300 200" fill="none" aria-hidden="true">' +
        '<path d="M12 66 L150 152 L288 66 L288 176 A14 14 0 0 1 274 190 L26 190 A14 14 0 0 1 12 176 Z" ' +
        'fill="#FFF8F0" ' + stroke + '/>' +
        '<path d="M96 158 h108" stroke="#F6C6C9" stroke-width="3" stroke-linecap="round" opacity=".8"/>' +
        '</svg>',
      flap: '<svg class="intro__flap" viewBox="0 0 300 200" fill="none" aria-hidden="true">' +
        '<path d="M14 52 L150 142 L286 52 A14 14 0 0 0 274 46 L26 46 A14 14 0 0 0 14 52 Z" ' +
        'fill="#FBEFE2" ' + stroke + '/>' +
        '<circle cx="150" cy="118" r="13" fill="#E8909A" opacity=".85"/>' +
        '<path d="M150 124.5c-2.6-1.7-7-4.4-7-7.6a3.4 3.4 0 0 1 7-1.6 3.4 3.4 0 0 1 7 1.6c0 3.2-4.4 5.9-7 7.6z" fill="#FFF8F0"/>' +
        '</svg>'
    };
  }

  function starsSVG() {
    var star = U ? U.icons.star : '';
    return '<span>' + star + '</span><span>' + star + '</span><span>' + star + '</span>';
  }

  /* ---------- 构建遮罩 ---------- */
  function build() {
    var nick = (DATA.meta && (DATA.meta.herNickname || DATA.meta.herName)) || '你';
    var svg = envelopeSVG();

    var root = document.createElement('div');
    root.className = 'intro';
    root.setAttribute('role', 'presentation');
    root.innerHTML =
      '<div class="intro__stage">' +
      '<div class="intro__envelope">' +
      svg.back +
      '<div class="intro__paper">' +
      '<div class="intro__line1" data-typed="亲爱的 ' + U.escapeHtml(nick) + '："></div>' +
      '<div class="intro__line2">这是只属于我们的小星球</div>' +
      '<div class="intro__stars">' + starsSVG() + '</div>' +
      '</div>' +
      svg.front +
      svg.flap +
      '</div>' +
      '</div>' +
      '<button class="intro__skip" type="button">跳过 ›</button>';

    document.body.appendChild(root);
    return root;
  }

  /* ---------- 打字机 ---------- */
  function typeLine(el, speed) {
    var text = el.getAttribute('data-typed') || '';
    var i = 0;
    el.textContent = '';
    (function step() {
      if (i >= text.length) return;
      el.textContent += text.charAt(i++);
      later(step, speed || 95);
    })();
  }

  /* ---------- 跳到结尾 ---------- */
  function finish(root, immediate) {
    clearTimers();
    markPlayed();

    var line1 = root.querySelector('.intro__line1');
    if (line1) line1.textContent = line1.getAttribute('data-typed') || '';
    root.classList.add('is-open', 'is-typed');
    document.body.style.overflow = '';

    if (immediate || U.prefersReducedMotion()) {
      remove(root);
      return;
    }
    root.classList.add('is-leaving');
    later(function () { remove(root); }, 440);
  }

  function remove(root) {
    if (root && root.parentNode) root.parentNode.removeChild(root);
    document.dispatchEvent(new CustomEvent('intro:done'));
  }

  /* ---------- 入口 ---------- */
  function play() {
    if (!shouldPlay()) {
      document.dispatchEvent(new CustomEvent('intro:done'));
      return false;
    }

    document.body.style.overflow = 'hidden';
    var root = build();

    /* 跳过按钮 */
    root.querySelector('.intro__skip').addEventListener('click', function (e) {
      e.stopPropagation();
      finish(root, true);
    });
    /* 点击屏幕任意处 → 直接到结尾 */
    root.addEventListener('click', function () { finish(root, false); });

    /* 等字体就绪再开始（最多等 1.5s） */
    var ready = (document.fonts && document.fonts.ready)
      ? Promise.race([document.fonts.ready, new Promise(function (r) { later(r, 1500); })])
      : Promise.resolve();

    ready.then(function () {
      root.classList.add('is-open');
      later(function () { typeLine(root.querySelector('.intro__line1'), 95); }, TIMELINE.typeStart);
      later(function () { root.classList.add('is-typed'); }, TIMELINE.typedAt);
      later(function () { finish(root, false); }, TIMELINE.leaveAt);
    });

    return true;
  }

  window.Intro = { play: play, shouldPlay: shouldPlay };

})(window, document);
