/* ==========================================================================
   quiz.js — 问答互动 + 彩蛋告白页（FR-09）
   单题单屏、无对错、进度本地可续答、答完进 finale（#finale 可直达）
   ========================================================================== */
(function (window, document) {
  'use strict';

  var U = window.Utils;
  var D = U.data;
  var meta = D.meta || {};
  var app = document.getElementById('app');

  var KEY = 'quiz_progress';
  var quiz = U.arr(D.quiz);
  var answers = U.store.get(KEY, {}) || {};
  var idx = 0;

  document.body.classList.add('js');

  /* ---------- 题目页 ---------- */
  function renderQuestion() {
    var q = quiz[idx];
    var picked = answers[q.id];

    var dots = quiz.map(function (it, i) {
      var state = answers[it.id] != null ? ' is-done' : (i === idx ? ' is-now' : '');
      return '<button class="qz-dot' + state + '" type="button" data-i="' + i + '" ' +
        'aria-label="第 ' + (i + 1) + ' 题' + (answers[it.id] != null ? '（已答）' : '') + '"></button>';
    }).join('');

    var opts = q.options.map(function (o, i) {
      var on = picked === i;
      return '<button class="qz-opt' + (on ? ' is-picked' : '') + '" type="button" data-o="' + i + '">' +
        '<span class="qz-opt__mark" aria-hidden="true">' + U.icon('heart') + '</span>' +
        '<span>' + U.escapeHtml(o.text) + '</span>' +
        '</button>';
    }).join('');

    app.innerHTML =
      '<section class="qz" data-reveal>' +
      '<div class="qz-dots" role="tablist" aria-label="题目进度">' + dots + '</div>' +
      '<p class="qz-step">第 ' + (idx + 1) + ' / ' + quiz.length + ' 题</p>' +
      '<h1 class="qz-q hand">' + U.escapeHtml(q.question) + '</h1>' +
      '<div class="qz-opts">' + opts + '</div>' +
      '<p class="qz-feedback hand' + (picked != null ? '' : ' hidden') + '" id="qzFb">' +
      (picked != null ? U.escapeHtml(q.options[picked].feedback) : '') + '</p>' +
      '<div class="qz-next' + (picked != null ? '' : ' hidden') + '" id="qzNextWrap">' +
      (idx < quiz.length - 1
        ? '<button class="btn btn--primary" type="button" id="qzNext">下一题 →</button>'
        : '<button class="btn btn--primary" type="button" id="qzNext">打开给你的惊喜 ✦</button>') +
      '</div>' +
      '</section>';

    bindQuestion();
    revealHead();
  }

  function bindQuestion() {
    var q = quiz[idx];

    /* 点进度圆点：只能跳回已答的题 */
    Array.prototype.forEach.call(app.querySelectorAll('.qz-dot'), function (d) {
      d.addEventListener('click', function () {
        var i = parseInt(d.getAttribute('data-i'), 10);
        if (i === idx) return;
        if (answers[quiz[i].id] == null && i !== idx) { U.toast('先答完手上的这题嘛'); return; }
        idx = i;
        renderQuestion();
      });
    });

    Array.prototype.forEach.call(app.querySelectorAll('.qz-opt'), function (b) {
      b.addEventListener('click', function () {
        var o = parseInt(b.getAttribute('data-o'), 10);
        answers[q.id] = o;
        U.store.set(KEY, answers);

        Array.prototype.forEach.call(app.querySelectorAll('.qz-opt'), function (x) { x.classList.remove('is-picked'); });
        b.classList.add('is-picked');

        var fb = document.getElementById('qzFb');
        fb.textContent = q.options[o].feedback;
        fb.classList.remove('hidden');
        fb.classList.add('is-in');
        document.getElementById('qzNextWrap').classList.remove('hidden');

        var dot = app.querySelectorAll('.qz-dot')[idx];
        if (dot) dot.classList.add('is-done');
      });
    });

    var next = document.getElementById('qzNext');
    if (next) {
      next.addEventListener('click', function () {
        if (idx < quiz.length - 1) { idx++; renderQuestion(); }
        else renderFinale(true);
      });
    }
  }

  /* ---------- 彩蛋告白页 ---------- */
  function renderFinale(withConfetti) {
    var days = U.daysTogether();
    var paras = String(D.finale || '').split(/\n{2,}/).filter(function (p) { return p.trim(); });

    app.innerHTML =
      '<section class="fina">' +
      '<div class="fina__rain" id="finaRain" aria-hidden="true"></div>' +
      '<div class="fina__box">' +
      paras.map(function (p, i) {
        return '<p class="fina__p" style="--i:' + i + '">' + U.escapeHtml(p).replace(/\n/g, '<br>') + '</p>';
      }).join('') +
      '<p class="fina__sign">—— ' + U.escapeHtml(meta.myName || '我') + '，写于第 ' + (days || 0) + ' 天</p>' +
      '<div class="fina__actions">' +
      '<button class="btn btn--sm btn--ghost" type="button" id="finaReplay">再看一遍 ↻</button>' +
      '<a class="btn btn--sm" href="./index.html">回到首页 ⌂</a>' +
      '</div>' +
      '</div>' +
      '</section>';

    document.getElementById('finaReplay').addEventListener('click', function () { renderFinale(true); });

    if (withConfetti) rain();
  }

  function rain() {
    var box = document.getElementById('finaRain');
    if (!box || U.prefersReducedMotion()) return;
    var html = '';
    for (var i = 0; i < 20; i++) {
      var icon = U.hashIndex('c' + i, 3) === 0 ? U.icons.star : U.icons.heartFill;
      html += '<i style="left:' + (U.hashIndex('x' + i, 96) + 2) + '%;' +
        'animation-duration:' + (2.6 + U.hashIndex('d' + i, 24) / 10) + 's;' +
        'animation-delay:' + (U.hashIndex('y' + i, 30) / 10) + 's;' +
        'width:' + (10 + U.hashIndex('s' + i, 10)) + 'px;height:' + (10 + U.hashIndex('s' + i, 10)) + 'px;' +
        'color:' + (U.hashIndex('k' + i, 2) ? 'var(--blush)' : 'var(--sun)') + '">' + icon + '</i>';
    }
    box.innerHTML = html;
    /* 30 秒后清掉 DOM，避免常驻 */
    window.setTimeout(function () { box.innerHTML = ''; }, 30000);
  }

  function revealHead() {
    document.body.classList.add('is-ready');
    var nodes = app.querySelectorAll('[data-reveal]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.setProperty('--i', i);
      nodes[i].classList.add('reveal');
    }
  }

  /* ---------- 启动 ---------- */
  function boot() {
    U.initPage({
      title: '小测验',
      backText: '回到首页',
      showBgm: true,
      prev: { href: './wishes.html', label: '愿望清单' },
      next: { href: './board.html', label: '留言板' }
    });
    U.initBgm();
    U.buildSideDecor();

    if (!quiz.length || window.location.hash === '#finale') {
      renderFinale(window.location.hash !== '#finale');
      document.body.classList.add('is-ready');
      return;
    }
    renderQuestion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
