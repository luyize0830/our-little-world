/* ==========================================================================
   board.js — 留言板（FR-10）
   无后端：localStorage['board_notes']；支持回信引用、编辑、删除、导出、清空
   ========================================================================== */
(function (window, document) {
  'use strict';

  var U = window.Utils;
  var D = U.data;
  var meta = D.meta || {};
  var app = document.getElementById('app');

  var KEY = 'board_notes';
  var MAX_LEN = 300;
  var MAX_NOTES = 200;
  var MOODS = ['😊', '🥰', '😢', '😤', '✨', '🎂'];
  var COLORS = ['bd-note--sun', 'bd-note--blush', 'bd-note--sage'];

  var replyTo = null;
  var mood = MOODS[1];

  document.body.classList.add('js');

  function notes() { return U.arr(U.store.get(KEY, [])); }
  function save(list) { return U.store.set(KEY, list); }

  function letterTitle(id) {
    var l = U.arr(D.letters).filter(function (x) { return x.id === id; })[0];
    return l ? l.title : '';
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var params = new URLSearchParams(window.location.search);
    var rid = params.get('reply_to');
    replyTo = rid && letterTitle(rid) ? rid : null;

    var list = notes();

    var html =
      '<section class="bd-head" data-reveal>' +
      '<div class="bd-head__art" aria-hidden="true">' + U.icon('note') + '</div>' +
      '<h1 class="t-h1">想说的话，贴在这里</h1>' +
      (replyTo
        ? '<p class="bd-reply pill pill--blush">正在回复：' + U.escapeHtml(letterTitle(replyTo)) +
          '<button class="bd-reply__x" type="button" id="bdCancelReply" aria-label="取消回复">' + U.icon('close') + '</button></p>'
        : '') +
      (!U.store.available ? '<p class="bd-warn">当前浏览器不保存数据，记得导出留存哦</p>' : '') +
      '</section>';

    /* 输入区 */
    html +=
      '<section class="bd-form card card--hand" data-reveal>' +
      '<div class="bd-form__top">' +
      '<textarea class="bd-form__input" id="bdInput" rows="4" maxlength="' + MAX_LEN + '" ' +
      'placeholder="今天想对' + U.escapeHtml(meta.herNickname || meta.herName || '你') + '说什么？" ' +
      'aria-label="留言内容"></textarea>' +
      '<span class="bd-form__count" id="bdCount">0/' + MAX_LEN + '</span>' +
      '</div>' +
      '<div class="bd-moods" role="radiogroup" aria-label="选一个心情">' +
      MOODS.map(function (m) {
        return '<button class="bd-mood' + (m === mood ? ' is-on' : '') + '" type="button" role="radio" ' +
          'aria-checked="' + (m === mood) + '" data-m="' + m + '">' + m + '</button>';
      }).join('') +
      '</div>' +
      '<div class="bd-form__foot">' +
      '<button class="btn btn--primary" type="button" id="bdSend">贴上留言</button>' +
      '<span class="t-muted">留言保存在这台设备上，只有你能看到</span>' +
      '</div>' +
      '</section>';

    /* 工具条 */
    html +=
      '<div class="bd-tools" data-reveal>' +
      '<span class="pill pill--num" id="bdTotal">共 ' + list.length + ' 条留言</span>' +
      '<button class="btn btn--sm btn--ghost" type="button" id="bdExport">' + U.icon('download') + ' 导出</button>' +
      '<button class="btn btn--sm btn--ghost" type="button" id="bdClear">' + U.icon('close') + ' 清空</button>' +
      '</div>';

    /* 列表（倒序） */
    html += '<ul class="bd-list" id="bdList">';
    if (!list.length) {
      html += '<li class="empty-state"><div class="empty-state__art">' + U.icon('note') + '</div>' +
        '<p class="empty-state__text">还没有便利贴，<br>第一张留给你</p></li>';
    } else {
      list.slice().reverse().forEach(function (n, i) { html += note(n, list.length - 1 - i); });
    }
    html += '</ul>';

    app.innerHTML = html;
    bind(list);
    revealHead();
  }

  function note(n, idx) {
    var tilt = (U.hashIndex(n.id, 7) - 3) * 0.8;
    var title = n.replyTo ? letterTitle(n.replyTo) : '';
    return '<li class="bd-note ' + COLORS[idx % COLORS.length] + '" data-id="' + U.escapeHtml(n.id) + '" ' +
      'style="--tilt:' + tilt.toFixed(2) + 'deg">' +
      '<p class="bd-note__text">' + U.escapeHtml(n.text).replace(/\n/g, '<br>') + '</p>' +
      '<div class="bd-note__foot">' +
      '<span class="bd-note__mood" aria-hidden="true">' + U.escapeHtml(n.mood || '') + '</span>' +
      '<span class="bd-note__time">' + U.escapeHtml(n.createdAt || '') + '</span>' +
      (title ? '<span class="bd-note__reply">↳ 回复《' + U.escapeHtml(title) + '》</span>' : '') +
      '<span class="bd-note__ops">' +
      '<button class="bd-note__op" type="button" data-op="edit" aria-label="编辑">' + U.icon('note') + '</button>' +
      '<button class="bd-note__op" type="button" data-op="del" aria-label="删除">' + U.icon('close') + '</button>' +
      '</span>' +
      '</div>' +
      '</li>';
  }

  /* ---------- 交互 ---------- */
  function bind(list) {
    var input = document.getElementById('bdInput');
    var count = document.getElementById('bdCount');
    var send = document.getElementById('bdSend');

    input.addEventListener('input', function () {
      var n = input.value.length;
      count.textContent = n + '/' + MAX_LEN;
      count.classList.toggle('is-over', n >= MAX_LEN);
      send.disabled = n >= MAX_LEN;
    });

    /* 心情单选 */
    Array.prototype.forEach.call(app.querySelectorAll('.bd-mood'), function (b) {
      b.addEventListener('click', function () {
        mood = b.getAttribute('data-m');
        Array.prototype.forEach.call(app.querySelectorAll('.bd-mood'), function (x) {
          var on = x === b;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-checked', on);
        });
      });
    });

    /* 取消回信 */
    var cancel = document.getElementById('bdCancelReply');
    if (cancel) {
      cancel.addEventListener('click', function () {
        window.history.replaceState(null, '', window.location.pathname);
        replyTo = null;
        render();
      });
    }

    /* 提交 */
    send.addEventListener('click', function () {
      var v = input.value.trim();
      if (!v) {
        input.classList.add('shake');
        U.toast('还没写内容呢');
        window.setTimeout(function () { input.classList.remove('shake'); }, 240);
        return;
      }
      var cur = notes();
      if (cur.length >= MAX_NOTES) { U.toast('便利贴用完啦，导出后可以清空再来'); return; }
      cur.push({
        id: 'n' + Date.now() + Math.random().toString(36).slice(2, 6),
        text: v, mood: mood,
        createdAt: U.formatDate(new Date(), 'YYYY-MM-DD HH:mm'),
        replyTo: replyTo || ''
      });
      var ok = save(cur);
      input.value = '';
      count.textContent = '0/' + MAX_LEN;
      count.classList.remove('is-over');
      send.disabled = false;
      U.toast(ok ? '已贴好 ♥' : '贴好了，但没能保存');
      U.heartPop(window.innerWidth / 2, window.innerHeight / 2, 3);
      render();
      var first = app.querySelector('.bd-note');
      if (first) first.classList.add('is-drop');
    });

    /* 每条：编辑 / 删除 */
    Array.prototype.forEach.call(app.querySelectorAll('.bd-note__op'), function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var li = b.closest('.bd-note');
        var id = li.getAttribute('data-id');
        var item = notes().filter(function (x) { return x.id === id; })[0];
        if (!item) return;

        if (b.getAttribute('data-op') === 'del') {
          U.confirmSheet('撕掉这张便利贴？', function () {
            save(notes().filter(function (x) { return x.id !== id; }));
            render();
            U.toast('撕掉了');
          }, '撕掉');
        } else {
          U.promptSheet('改一改', item.text, function (v) {
            var cur = notes();
            cur.forEach(function (x) { if (x.id === id) x.text = v; });
            save(cur);
            render();
            U.toast('改好了');
          });
        }
      });
    });

    /* 导出 */
    document.getElementById('bdExport').addEventListener('click', function () {
      var cur = notes();
      if (!cur.length) { U.toast('还没有留言可以导出'); return; }
      var lines = ['给 ' + (meta.herName || '你') + ' 的留言板',
        '导出时间：' + U.formatDate(new Date(), 'YYYY-MM-DD HH:mm'), ''];
      cur.forEach(function (n) {
        lines.push('[' + (n.mood || '') + '] ' + (n.createdAt || ''));
        if (n.replyTo) lines.push('↳ 回复《' + letterTitle(n.replyTo) + '》');
        lines.push(n.text, '──────────────');
      });
      U.downloadText('留言板.txt', lines.join('\n')) ? U.toast('已导出 ♥') : U.toast('导出失败');
    });

    /* 清空 */
    document.getElementById('bdClear').addEventListener('click', function () {
      if (!notes().length) { U.toast('本来就是空的'); return; }
      U.confirmSheet('确定要撕掉所有便利贴吗？此操作无法撤销', function () {
        save([]);
        render();
        U.toast('清空了');
      }, '全部撕掉');
    });
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
      title: '留言板',
      backText: '回到首页',
      showBgm: true,
      prev: { href: './quiz.html', label: '小测验' },
      next: { href: './index.html', label: '首页' }
    });
    U.initBgm();
    U.buildSideDecor();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
