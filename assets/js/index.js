/* ==========================================================================
   index.js — 首页（FR-02 恋爱计时器 / FR-03 首页 / FR-04 每日情话）
   开场动画由 intro.js 负责，本文件在动画结束后才播放入场动效
   ========================================================================== */
(function (window, document) {
  'use strict';

  var U = window.Utils;
  var D = U.data;
  var meta = D.meta || {};
  var dates = D.dates || {};
  var navDesc = D.navDesc || {};

  var app = document.getElementById('app');
  var ready = false;
  var clockTimer = null;
  var currentQuote = '';
  var lastDays = null;

  document.body.classList.add('js');

  /* ---------- 宫格配置 ---------- */
  var NAV = [
    { key: 'album',    href: './album.html',    title: '照片墙',   icon: 'camera' },
    { key: 'timeline', href: './timeline.html', title: '时光轴',   icon: 'leaf' },
    { key: 'letters',  href: './letters.html',  title: '信件抽屉', icon: 'envelope' },
    { key: 'wishes',   href: './wishes.html',   title: '愿望清单', icon: 'list' },
    { key: 'quiz',     href: './quiz.html',     title: '小测验',   icon: 'question' },
    { key: 'board',    href: './board.html',    title: '留言板',   icon: 'note' },
    { key: 'period',   href: './period.html',   title: '小日历',   icon: 'calendar', wide: true }
  ];

  var MILESTONES = [100, 520, 1000, 1314, 2000, 3000];

  /* ---------- 角标数字 ---------- */
  function badgeFor(key) {
    var n;
    switch (key) {
      case 'album':
        n = U.arr(D.photos).length;
        return n ? '共 ' + n + ' 张' : '待填充';
      case 'timeline':
        n = U.arr(D.timeline).length;
        return n + ' 个瞬间';
      case 'letters':
        n = U.arr(D.letters).length;
        return n + ' 封信';
      case 'wishes':
        return wishProgress();
      case 'quiz':
        n = U.arr(D.quiz).length;
        return n + ' 道题';
      case 'board':
        n = U.arr(U.store.get('board_notes', [])).length;
        return n ? n + ' 条留言' : '等你来写';
      case 'period': {
        var ps = U.periodStatus();
        if (ps.phase === 'empty') return '点开记一下';
        if (ps.phase === 'period') return '经期第 ' + ps.day + ' 天';
        if (ps.phase === 'late') return '预计过了 ' + ps.days + ' 天';
        if (ps.phase === 'today') return '预计就是今天';
        return '还有 ' + ps.days + ' 天';
      }
      default:
        return '';
    }
  }

  /* 愿望完成进度（读取 wishes.html 写入的 localStorage，只读不改） */
  function wishProgress() {
    var base = U.arr(D.wishes);
    var state = U.store.get('wish_state', {}) || {};
    var custom = U.arr(U.store.get('wish_custom', []));
    var done = 0, total = base.length + custom.length, i, id;
    for (i = 0; i < base.length; i++) {
      id = base[i] && (base[i].id || base[i].text);
      if (id && state[id] && state[id].done) done++;
    }
    for (i = 0; i < custom.length; i++) { if (custom[i] && custom[i].done) done++; }
    return done + ' / ' + total;
  }

  /* ---------- 里程碑判定 ---------- */
  function isMilestone(days) {
    return days != null && (days % 100 === 0 || MILESTONES.indexOf(days) >= 0);
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var special = U.isSpecialDay();
    var days = U.daysTogether(dates.loveStart);
    var bday = U.nextBirthdayCountdown();

    var html = '';

    /* 特殊日期祝福横幅 */
    if (special) {
      var ribbons = '';
      for (var r = 0; r < 9; r++) {
        ribbons += '<i style="left:' + (6 + r * 11) + '%;animation-delay:' + (r * 0.42).toFixed(2) + 's"></i>';
      }
      html += '<div class="special-banner" data-reveal role="status">' +
        '<span class="special-banner__ribbon" aria-hidden="true">' + ribbons + '</span>' +
        '<span class="special-banner__text">' + U.escapeHtml(special.text) + '</span>' +
        '</div>';
    }

    /* 问候区 */
    html += '<section class="greet" data-reveal>' +
      '<h1 class="greet__text"><span id="greetText"></span><span class="greet__caret" id="greetCaret"></span></h1>' +
      '<p class="greet__sub">' + U.escapeHtml(meta.slogan || '') + '</p>' +
      '</section>';

    /* 恋爱计时器 */
    if (days === null) {
      html += '<section class="counter" data-reveal><p class="counter__label">等你告诉我，我们从哪天开始算</p></section>';
    } else if (days <= 0) {
      html += '<section class="counter" data-reveal>' +
        '<p class="counter__label">还有</p>' +
        '<div class="counter__days"><span class="counter__num">' + Math.abs(days - 1) + '</span><span class="counter__unit">天</span></div>' +
        '<p class="counter__since">我们就要在一起啦</p>' +
        '</section>';
    } else {
      var milestone = isMilestone(days);
      html += '<section class="counter" data-reveal>' +
        '<p class="counter__label">我 们 已 经 一 起 走 过</p>' +
        '<div class="counter__days">' +
        '<span class="counter__num' + (milestone ? ' is-milestone' : '') + '" id="daysNum">' + days + '</span>' +
        '<span class="counter__unit">天</span>' +
        '</div>' +
        '<div class="counter__clock" id="clock"></div>' +
        '<p class="counter__since">从 ' + U.formatDate(dates.loveStart, 'YYYY 年 MM 月 DD 日') + ' 开始</p>' +
        (milestone ? '<p class="counter__milestone">今天是第 ' + days + ' 天，值得纪念 ✦</p>' : '') +
        (bday && bday.days <= 30
          ? '<p class="t-muted" style="margin-top:8px">距离宝宝的生日还有 ' + bday.days + ' 天</p>'
          : '') +
        '</section>';
    }

    /* 今日情话 */
    currentQuote = U.pickDaily();
    html += '<section class="quote-card" data-reveal>' +
      '<span class="quote-card__label">今 日 一 句</span>' +
      '<p class="quote-card__text" id="quoteText">' + U.escapeHtml(currentQuote) + '</p>' +
      '<div class="quote-card__actions">' +
      '<button class="btn btn--sm btn--ghost" type="button" id="quoteNext">换一句 ↻</button>' +
      '<button class="btn btn--sm btn--ghost" type="button" id="quoteCopy">复制 ♥</button>' +
      '</div>' +
      '</section>';

    /* 功能宫格 */
    html += '<nav class="nav-grid" aria-label="站内导航">';
    for (var i = 0; i < NAV.length; i++) {
      var item = NAV[i];
      var tilt = i % 2 === 0 ? ' tilt-l' : ' tilt-r';
      html += '<a class="nav-card' + tilt + (item.wide ? ' nav-card--wide' : '') + '" href="' + item.href + '" data-reveal>' +
        '<span class="nav-card__icon">' + U.icon(item.icon) + '</span>' +
        '<span class="nav-card__title">' + item.title + '</span>' +
        '<span class="nav-card__desc">' + U.escapeHtml(navDesc[item.key] || '') + '</span>' +
        '<span class="nav-card__badge">' + U.escapeHtml(badgeFor(item.key)) + '</span>' +
        '</a>';
    }
    html += '</nav>';

    /* 页脚 */
    html += '<footer class="site-footer" data-reveal>' +
      '<p class="site-footer__made">Made with <span class="heart">♥</span> by ' +
      U.escapeHtml(meta.myName || '我') + ' for ' + U.escapeHtml(meta.herName || '你') + '</p>' +
      (days && days > 0 ? '<p class="site-footer__days">第 ' + days + ' 天</p>' : '') +
      '</footer>';

    app.innerHTML = html;

    bindQuote();
    renderClock();
  }

  /* ---------- 秒表 ---------- */
  function renderClock() {
    var box = document.getElementById('clock');
    if (!box) return;
    var p = U.todayParts();
    box.innerHTML =
      '<span class="pill pill--num">今天 ' + p.label + '</span>' +
      '<span class="pill pill--num">' + p.h + ' 时</span>' +
      '<span class="pill pill--num">' + p.m + ' 分</span>' +
      '<span class="pill pill--num">' + p.s + ' 秒</span>';
  }

  function startClock() {
    if (clockTimer) window.clearInterval(clockTimer);
    renderClock();
    clockTimer = window.setInterval(function () {
      renderClock();
      /* 跨天时刷新天数与今日情话 */
      var days = U.daysTogether(dates.loveStart);
      if (days !== null && lastDays !== null && days !== lastDays) window.location.reload();
      lastDays = days;
    }, 1000);
  }

  /* ---------- 问候语打字机 ---------- */
  function typeGreeting() {
    var el = document.getElementById('greetText');
    var caret = document.getElementById('greetCaret');
    if (!el) return;
    var text = U.greeting();
    if (U.prefersReducedMotion()) {
      el.textContent = text;
      if (caret) caret.style.display = 'none';
      return;
    }
    var i = 0;
    el.textContent = '';
    (function step() {
      if (i >= text.length) {
        if (caret) caret.style.display = 'none';
        return;
      }
      el.textContent += text.charAt(i++);
      window.setTimeout(step, 110);
    })();
  }

  /* ---------- 情话卡交互 ---------- */
  function bindQuote() {
    var textEl = document.getElementById('quoteText');
    var btnNext = document.getElementById('quoteNext');
    var btnCopy = document.getElementById('quoteCopy');

    function show(text) {
      currentQuote = text;
      if (!textEl) return;
      if (U.prefersReducedMotion()) { textEl.textContent = text; return; }
      textEl.classList.remove('is-flipping');
      void textEl.offsetWidth;
      textEl.classList.add('is-flipping');
      window.setTimeout(function () { textEl.textContent = text; }, 230);
    }

    if (btnNext) {
      btnNext.addEventListener('click', function () {
        show(U.pickAnother(currentQuote));
      });
    }

    if (btnCopy) {
      btnCopy.addEventListener('click', function () {
        copyText(currentQuote, function (ok) {
          U.toast(ok ? '已复制 ♥' : '复制失败，长按文字手动复制吧');
        });
      });
    }
  }

  function copyText(text, cb) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { cb(true); }, function () { legacyCopy(text, cb); });
      return;
    }
    legacyCopy(text, cb);
  }

  function legacyCopy(text, cb) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      cb(!!ok);
    } catch (e) { cb(false); }
  }

  /* ---------- 入场动效 ---------- */
  function revealAll() {
    var nodes = app.querySelectorAll('[data-reveal]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.setProperty('--i', i);
      nodes[i].classList.add('reveal');
    }
    document.body.classList.add('is-ready');
  }

  function onReady() {
    if (ready) return;
    ready = true;
    revealAll();
    typeGreeting();
  }

  /* ---------- 口令页（FR-12，前端弱校验，仅仪式感与防误入） ---------- */
  function passcodeGate(done) {
    if (!(meta.enablePasscode && meta.passcode)) { done(); return; }
    if (U.store.get('pass', false) === true) { done(); return; }

    var tries = 0;
    var root = document.createElement('div');
    root.className = 'pc';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.innerHTML =
      '<div class="pc__card">' +
      '<span class="pc__icon" aria-hidden="true">' + U.icon('envelope') + '</span>' +
      '<p class="pc__q">' + U.escapeHtml(meta.passcodeQuestion || '请输入暗号') + '</p>' +
      '<input class="pc__input" id="pcInput" inputmode="numeric" maxlength="8" autocomplete="off" aria-label="暗号">' +
      '<p class="pc__oops" id="pcOops" role="status"></p>' +
      '<button class="btn btn--primary" type="button" id="pcGo">开门 ♥</button>' +
      '</div>';
    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';

    var input = root.querySelector('#pcInput');
    var oops = root.querySelector('#pcOops');
    input.focus();

    function check() {
      if (input.value.trim() === String(meta.passcode)) {
        U.store.set('pass', true);
        document.body.style.overflow = '';
        if (root.parentNode) root.parentNode.removeChild(root);
        done();
        return;
      }
      tries++;
      oops.textContent = tries >= 3 ? '再猜一次嘛。提示：我们第一次见面的日子' : '不对哦，再想想';
      input.value = '';
      input.classList.add('shake');
      window.setTimeout(function () { input.classList.remove('shake'); }, 240);
      input.focus();
    }

    root.querySelector('#pcGo').addEventListener('click', check);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    U.initPage({ title: meta.siteTitle || '', home: true, showBgm: true });
    U.initBgm();
    U.buildHeartField(10);
    U.buildSideDecor();

    lastDays = U.daysTogether(dates.loveStart);
    render();
    startClock();

    passcodeGate(startIntro);
  }

  function startIntro() {
    var played = false;
    if (window.Intro) {
      document.addEventListener('intro:done', onReady);
      played = window.Intro.play();
    }
    if (!played) onReady();

    /* 保险：任何异常下 6 秒后强制显示内容 */
    window.setTimeout(function () {
      var overlay = document.querySelector('.intro');
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
        document.body.style.overflow = '';
      }
      onReady();
    }, 6000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window, document);
