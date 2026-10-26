/* ==========================================================================
   letters.js — 信件抽屉（FR-07）
   信封列表 → 翻盖抽信动画 → 信纸阅读层；已读状态本地留存；可写回信
   ========================================================================== */
(function (window, document) {
  'use strict';

  var U = window.Utils;
  var D = U.data;
  var meta = D.meta || {};
  var app = document.getElementById('app');

  var KEY_READ = 'letters_read';
  var letters = U.arr(D.letters);
  var currentIdx = -1;

  document.body.classList.add('js');

  function readIds() { return U.store.get(KEY_READ, []); }
  function markRead(id) {
    var list = readIds();
    if (list.indexOf(id) < 0) { list.push(id); U.store.set(KEY_READ, list); }
  }

  /* ---------- 列表 ---------- */
  function render() {
    if (!letters.length) {
      app.innerHTML =
        '<section class="lt-head"><h1 class="t-h1">信件抽屉</h1></section>' +
        '<div class="empty-state" data-reveal><div class="empty-state__art">' + U.icon('envelope') + '</div>' +
        '<p class="empty-state__text">还没写第一封信，<br>但已经在打腹稿了</p></div>';
      return;
    }

    var read = readIds();
    var html =
      '<section class="lt-head" data-reveal>' +
      '<div class="lt-head__drawer" aria-hidden="true">' + U.icon('book') + '</div>' +
      '<h1 class="t-h1">' + U.escapeHtml(meta.myNickname || meta.myName || '我') +
      ' 写给 ' + U.escapeHtml(meta.herName || '你') + ' 的 ' + letters.length + ' 封信</h1>' +
      '<p class="t-muted">点一封，慢慢读</p>' +
      '</section>' +
      '<div class="lt-grid">';

    letters.forEach(function (l, i) {
      var isRead = read.indexOf(l.id) >= 0;
      html +=
        '<button class="env-card reveal-on-scroll' + (isRead ? ' is-read' : '') + '" type="button" ' +
        'data-idx="' + i + '" aria-label="打开信：' + U.escapeHtml(l.title) + '">' +
        '<span class="env-card__flap" aria-hidden="true"></span>' +
        '<span class="env-card__seal" aria-hidden="true">' + U.icon('heartFill') + '</span>' +
        '<span class="env-card__title">' + U.escapeHtml(l.title) + '</span>' +
        '<span class="env-card__date">' + U.escapeHtml(U.formatDate(l.date, 'YYYY 年 MM 月 DD 日')) + '</span>' +
        (isRead ? '<span class="env-card__tag">已读 ♥</span>' : '') +
        '</button>';
    });

    html += '</div>';
    app.innerHTML = html;

    app.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('.env-card') : null;
      if (!card) return;
      open(parseInt(card.getAttribute('data-idx'), 10), card);
    });

    U.revealOnScroll(app.querySelectorAll('.reveal-on-scroll'));
  }

  /* ---------- 阅读层 ---------- */
  function open(idx, cardEl) {
    if (idx < 0 || idx >= letters.length) return;
    currentIdx = idx;
    var l = letters[idx];

    /* 信封翻盖动画，然后展开信纸 */
    if (cardEl && !U.prefersReducedMotion()) {
      cardEl.classList.add('is-opening');
      window.setTimeout(show, 420);
    } else {
      show();
    }

    function show() {
      markRead(l.id);
      if (cardEl) {
        cardEl.classList.add('is-read');
        if (!cardEl.querySelector('.env-card__tag')) {
          var tag = document.createElement('span');
          tag.className = 'env-card__tag';
          tag.textContent = '已读 ♥';
          cardEl.appendChild(tag);
        }
      }

      var paras = String(l.body || '').split(/\n{2,}/).filter(function (p) { return p.trim(); });
      var bodyHtml = paras.map(function (p) {
        return '<p class="reader__p reveal-on-scroll">' + U.escapeHtml(p).replace(/\n/g, '<br>') + '</p>';
      }).join('');

      var root = document.createElement('div');
      root.className = 'reader';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', l.title);
      root.innerHTML =
        '<div class="reader__sheet">' +
        '<button class="reader__close icon-btn" type="button" aria-label="收起信">' + U.icon('close') + '</button>' +
        '<p class="reader__meta">' + U.escapeHtml(l.title) +
        '<span class="reader__date">' + U.escapeHtml(U.formatDate(l.date, 'YYYY 年 MM 月 DD 日')) + '</span></p>' +
        '<div class="reader__body">' + bodyHtml + '</div>' +
        '<div class="reader__actions">' +
        '<button class="btn btn--sm btn--ghost" type="button" data-nav="-1"' + (idx === 0 ? ' disabled' : '') + '>← 上一封</button>' +
        '<a class="btn btn--sm btn--primary" href="./board.html?reply_to=' + encodeURIComponent(l.id) + '">写回信</a>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-nav="1"' + (idx === letters.length - 1 ? ' disabled' : '') + '>下一封 →</button>' +
        '</div>' +
        '</div>';

      document.body.appendChild(root);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { root.classList.add('is-open'); });
      U.revealOnScroll(root.querySelectorAll('.reader__p'));

      function close() {
        root.classList.remove('is-open');
        document.body.style.overflow = '';
        window.setTimeout(function () { if (root.parentNode) root.parentNode.removeChild(root); }, 240);
        document.removeEventListener('keydown', onKey);
      }
      function onKey(e) {
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft' && idx > 0) { close(); window.setTimeout(function () { open(idx - 1, cardAt(idx - 1)); }, 260); }
        else if (e.key === 'ArrowRight' && idx < letters.length - 1) { close(); window.setTimeout(function () { open(idx + 1, cardAt(idx + 1)); }, 260); }
      }
      document.addEventListener('keydown', onKey);

      root.querySelector('.reader__close').addEventListener('click', close);
      root.addEventListener('click', function (e) { if (e.target === root) close(); });
      Array.prototype.forEach.call(root.querySelectorAll('[data-nav]'), function (b) {
        b.addEventListener('click', function () {
          var n = idx + parseInt(b.getAttribute('data-nav'), 10);
          close();
          window.setTimeout(function () { open(n, cardAt(n)); }, 260);
        });
      });
    }
  }

  function cardAt(i) { return app.querySelector('.env-card[data-idx="' + i + '"]'); }

  /* ---------- 启动 ---------- */
  function boot() {
    U.initPage({
      title: '信件抽屉',
      backText: '回到首页',
      showBgm: true,
      prev: { href: './timeline.html', label: '时光轴' },
      next: { href: './wishes.html', label: '愿望清单' }
    });
    U.initBgm();
    U.buildSideDecor();
    render();
    document.body.classList.add('is-ready');
    var nodes = app.querySelectorAll('[data-reveal]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.setProperty('--i', i);
      nodes[i].classList.add('reveal');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
