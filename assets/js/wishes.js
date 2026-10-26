/* ==========================================================================
   wishes.js — 共同愿望清单（FR-08）
   打卡持久化只存差异（wish_state / wish_custom），更新 data.js 不丢她的进度
   ========================================================================== */
(function (window, document) {
  'use strict';

  var U = window.Utils;
  var D = U.data;
  var app = document.getElementById('app');

  var KEY_STATE = 'wish_state';
  var KEY_CUSTOM = 'wish_custom';
  var doneGroupOpen = false;

  document.body.classList.add('js');

  /* ---------- 数据 ---------- */
  function state() { return U.store.get(KEY_STATE, {}) || {}; }
  function custom() { return U.arr(U.store.get(KEY_CUSTOM, [])); }

  /* 合并：data.js 的基础愿望 + 她/我新增的 */
  function allItems() {
    var st = state();
    var out = U.arr(D.wishes).map(function (w) {
      return { id: w.id || w.text, text: w.text, custom: false };
    });
    custom().forEach(function (c) { out.push({ id: c.id, text: c.text, custom: true }); });
    out.forEach(function (it) {
      var s = st[it.id];
      it.done = !!(s && s.done);
      it.doneAt = (s && s.doneAt) || '';
    });
    return out;
  }

  function counts() {
    var list = allItems();
    var done = list.filter(function (i) { return i.done; }).length;
    return { done: done, total: list.length, list: list };
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var c = counts();
    var pending = c.list.filter(function (i) { return !i.done; });
    var done = c.list.filter(function (i) { return i.done; });
    var pct = c.total ? Math.round(c.done / c.total * 100) : 0;

    var html =
      '<section class="ws-head" data-reveal>' +
      '<div class="ws-ring" role="img" aria-label="已实现 ' + pct + '%">' +
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle class="ws-ring__bg" cx="60" cy="60" r="52"/>' +
      '<circle class="ws-ring__fg" cx="60" cy="60" r="52" ' +
      'stroke-dasharray="' + (2 * Math.PI * 52).toFixed(1) + '" ' +
      'stroke-dashoffset="' + (2 * Math.PI * 52 * (1 - pct / 100)).toFixed(1) + '"/>' +
      '</svg>' +
      '<span class="ws-ring__num">' + pct + '<i>%</i></span>' +
      '</div>' +
      '<p class="ws-head__text hand">已实现 ' + c.done + ' / ' + c.total + ' 个愿望</p>' +
      '<p class="t-muted">点一下，就算我们一起做过了</p>' +
      '</section>';

    if (!c.total) {
      html += '<div class="empty-state" data-reveal><div class="empty-state__art">' + U.icon('list') + '</div>' +
        '<p class="empty-state__text">还没有愿望，<br>先写一个最小的</p></div>';
    } else {
      html += '<ul class="ws-list">';
      pending.forEach(function (it) { html += row(it); });
      html += '</ul>';

      if (done.length) {
        html += '<section class="ws-done">' +
          '<button class="ws-done__toggle" type="button" aria-expanded="' + doneGroupOpen + '">' +
          '已经实现的 ✦ (' + done.length + ') ' + (doneGroupOpen ? '▴' : '▾') + '</button>' +
          '<ul class="ws-list' + (doneGroupOpen ? '' : ' hidden') + '" id="wsDone">';
        done.forEach(function (it) { html += row(it); });
        html += '</ul></section>';
      }
    }

    html +=
      '<form class="ws-add" id="wsAdd">' +
      '<input class="ws-add__input" id="wsInput" type="text" maxlength="40" ' +
      'placeholder="＋ 添加一个新愿望" aria-label="添加一个新愿望" autocomplete="off">' +
      '<button class="icon-btn ws-add__btn" type="submit" aria-label="添加">' + U.icon('plus') + '</button>' +
      '</form>' +
      '<p class="ws-tip t-muted" id="wsTip"></p>' +
      '<div class="ws-tools"><button class="btn btn--sm btn--ghost" type="button" id="wsExport">' +
      U.icon('download') + ' 导出清单</button></div>';

    app.innerHTML = html;
    bind();
    revealHead();
  }

  function row(it) {
    return '<li class="ws-item' + (it.done ? ' is-done' : '') + '" data-id="' + U.escapeHtml(it.id) + '" ' +
      'data-custom="' + (it.custom ? '1' : '0') + '">' +
      '<button class="ws-item__main" type="button" aria-pressed="' + it.done + '">' +
      '<span class="ws-item__box" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24"><path class="ws-item__tick" d="M5 12.5l4.4 4.4L19 7.4"/></svg>' +
      '</span>' +
      '<span class="ws-item__text">' + U.escapeHtml(it.text) + '</span>' +
      (it.done && it.doneAt ? '<span class="ws-item__when">✓ ' + U.escapeHtml(it.doneAt) + '</span>' : '') +
      '</button>' +
      '</li>';
  }

  /* ---------- 交互 ---------- */
  function bind() {
    /* 打卡 / 取消 */
    Array.prototype.forEach.call(app.querySelectorAll('.ws-item__main'), function (btn) {
      btn.addEventListener('click', function (e) {
        var li = btn.closest('.ws-item');
        var id = li.getAttribute('data-id');
        var wasDone = li.classList.contains('is-done');
        toggle(id, !wasDone, e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2);
      });
    });

    /* 长按 / 右键 → 编辑、删除 */
    Array.prototype.forEach.call(app.querySelectorAll('.ws-item'), function (li) {
      var timer = null;
      function menu() { openMenu(li); }
      li.addEventListener('contextmenu', function (e) { e.preventDefault(); menu(); });
      li.addEventListener('touchstart', function () { timer = window.setTimeout(menu, 500); }, { passive: true });
      li.addEventListener('touchend', function () { window.clearTimeout(timer); }, { passive: true });
      li.addEventListener('touchmove', function () { window.clearTimeout(timer); }, { passive: true });
    });

    /* 已实现分组展开 */
    var tog = app.querySelector('.ws-done__toggle');
    if (tog) {
      tog.addEventListener('click', function () {
        doneGroupOpen = !doneGroupOpen;
        var box = document.getElementById('wsDone');
        if (box) box.classList.toggle('hidden', !doneGroupOpen);
        tog.setAttribute('aria-expanded', doneGroupOpen);
        tog.innerHTML = '已经实现的 ✦ (' + box.querySelectorAll('.ws-item').length + ') ' + (doneGroupOpen ? '▴' : '▾');
      });
    }

    /* 新增 */
    var form = document.getElementById('wsAdd');
    var input = document.getElementById('wsInput');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) {
        input.classList.add('shake');
        tip('写点什么吧');
        window.setTimeout(function () { input.classList.remove('shake'); }, 240);
        return;
      }
      var list = custom();
      list.push({ id: 'c' + Date.now(), text: v, createdAt: new Date().toISOString().slice(0, 10), done: false, doneAt: '' });
      if (!U.store.set(KEY_CUSTOM, list)) U.toast('这次没能保存，但愿望依然算数 ♥');
      input.value = '';
      tip('');
      render();
      /* 高亮新加的那条 */
      var last = app.querySelector('.ws-list .ws-item:last-child');
      if (last) { last.classList.add('is-flash'); window.setTimeout(function () { last.classList.remove('is-flash'); }, 900); }
    });

    /* 导出 */
    document.getElementById('wsExport').addEventListener('click', function () {
      var c = counts();
      var lines = ['给 ' + (D.meta && D.meta.herName || '你') + ' 的愿望清单',
        '导出时间：' + U.formatDate(new Date(), 'YYYY-MM-DD HH:mm'), ''];
      c.list.filter(function (i) { return i.done; })
        .forEach(function (i) { lines.push('✓ ' + i.text + (i.doneAt ? '  (' + i.doneAt + ')' : '')); });
      lines.push('', '还没实现的：');
      c.list.filter(function (i) { return !i.done; })
        .forEach(function (i) { lines.push('· ' + i.text); });
      U.downloadText('愿望清单.txt', lines.join('\n'))
        ? U.toast('已导出 ♥')
        : U.toast('导出失败，截图也行');
    });
  }

  function tip(msg) {
    var el = document.getElementById('wsTip');
    if (el) el.textContent = msg || '';
  }

  function toggle(id, toDone, x, y) {
    var st = state();
    st[id] = { done: toDone, doneAt: toDone ? new Date().toISOString().slice(0, 10) : '' };
    var ok = U.store.set(KEY_STATE, st);
    if (!ok) U.toast('这次没能保存，但愿望依然算数 ♥');
    if (toDone) U.heartPop(x, y, 3);
    render();
  }

  function openMenu(li) {
    var id = li.getAttribute('data-id');
    var isCustom = li.getAttribute('data-custom') === '1';
    var text = li.querySelector('.ws-item__text').textContent;

    U.sheet(
      '<p class="sheet__title hand">' + U.escapeHtml(text) + '</p>' +
      '<div class="sheet__menu">' +
      '<button class="sheet__menu-item" type="button" data-m="edit">' + U.icon('note') + ' 编辑</button>' +
      '<button class="sheet__menu-item sheet__menu-item--danger" type="button" data-m="del">' + U.icon('close') + ' 删除</button>' +
      '</div>',
      function (root, close) {
        root.querySelector('[data-m="edit"]').addEventListener('click', function () {
          close();
          U.promptSheet('改一下这个愿望', text, function (v) {
            if (isCustom) {
              var list = custom();
              list.forEach(function (c) { if (c.id === id) c.text = v; });
              U.store.set(KEY_CUSTOM, list);
            } else {
              U.toast('这条在 data.js 里，改那里更稳妥');
            }
            render();
          });
        });
        root.querySelector('[data-m="del"]').addEventListener('click', function () {
          close();
          U.confirmSheet('确定要删掉这个愿望吗？', function () {
            if (isCustom) {
              var list = custom().filter(function (c) { return c.id !== id; });
              U.store.set(KEY_CUSTOM, list);
            } else {
              U.toast('这条在 data.js 里，改那里更稳妥');
            }
            render();
          }, '删掉');
        });
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
      title: '愿望清单',
      backText: '回到首页',
      showBgm: true,
      prev: { href: './letters.html', label: '信件抽屉' },
      next: { href: './quiz.html', label: '小测验' }
    });
    U.initBgm();
    U.buildSideDecor();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
