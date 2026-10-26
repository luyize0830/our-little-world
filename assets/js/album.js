/* ==========================================================================
   album.js — 照片墙（FR-05）
   瀑布流 + 分组筛选 + 灯箱（图片/视频）+ 懒加载 + 空态
   ========================================================================== */
(function (window, document) {
  'use strict';

  var U = window.Utils;
  var D = U.data;
  var app = document.getElementById('app');

  var ALL = '全部';
  var current = ALL;
  var view = [];          // 当前筛选后的列表（灯箱按这个顺序翻页）

  document.body.classList.add('js');

  /* ---------- 上锁的照片（data.js 里带 lock 字段的） ---------- */
  var LOCK_KEY = 'photo_unlocked';   // 已解锁的照片 id 存在这里，刷新后仍然解锁
  var memUnlocked = {};              // 浏览器禁用存储时的兜底

  function unlockedMap() {
    var m = U.store.get(LOCK_KEY, null);
    return (m && typeof m === 'object') ? m : memUnlocked;
  }

  function isLocked(p) {
    return !!(p && p.lock && !unlockedMap()[p.id]);
  }

  function markUnlocked(p) {
    memUnlocked[p.id] = 1;
    var m = unlockedMap();
    m[p.id] = 1;
    U.store.set(LOCK_KEY, m);
  }

  /* ---------- 数据准备：按日期倒序（最新在前） ---------- */
  function sorted() {
    return U.arr(D.photos).slice().sort(function (a, b) {
      return String(b.date || '').localeCompare(String(a.date || ''));
    });
  }

  /* 只保留有内容的分组，顺序沿用 data.js 里 albums 的定义 */
  function usedAlbums(list) {
    var defined = U.arr(D.albums);
    var present = {};
    list.forEach(function (p) { if (p.album) present[p.album] = 1; });
    var out = defined.filter(function (a) { return present[a]; });
    /* data.js 里没预定义但照片里出现的分组，追加在后面 */
    Object.keys(present).forEach(function (a) { if (out.indexOf(a) < 0) out.push(a); });
    return out;
  }

  function fmtDur(s) {
    if (!s) return '';
    s = Math.round(s);
    return Math.floor(s / 60) + ':' + U.pad2(s % 60);
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var list = sorted();
    var albums = usedAlbums(list);

    if (!list.length) {
      app.innerHTML = emptyState();
      return;
    }

    var range = list[0].date && list[list.length - 1].date
      ? U.formatDate(list[list.length - 1].date, 'YYYY 年 MM 月') + ' — ' + U.formatDate(list[0].date, 'YYYY 年 MM 月')
      : '';

    var html =
      '<section class="wall-head" data-reveal>' +
      '<h1 class="t-h1">照片墙</h1>' +
      '<p class="t-muted">' + list.length + ' 个瞬间' + (range ? ' · ' + range : '') + '</p>' +
      '</section>';

    /* 筛选标签（≥2 个分组才显示） */
    if (albums.length >= 2) {
      html += '<div class="chips" role="tablist" aria-label="按分组筛选" data-reveal>';
      html += chip(ALL, list.length);
      albums.forEach(function (a) {
        html += chip(a, list.filter(function (p) { return p.album === a; }).length);
      });
      html += '</div>';
    }

    html += '<div class="wall" id="wall"></div>';
    app.innerHTML = html;

    bindChips();
    paint();
  }

  function chip(label, count) {
    var on = label === current;
    return '<button class="chip' + (on ? ' is-active' : '') + '" type="button" ' +
      'role="tab" aria-selected="' + on + '" data-album="' + U.escapeHtml(label) + '">' +
      U.escapeHtml(label) + '<span>' + count + '</span></button>';
  }

  /* 按当前分组绘制瀑布流 */
  function paint() {
    var wall = document.getElementById('wall');
    if (!wall) return;
    var list = sorted();
    view = current === ALL ? list : list.filter(function (p) { return p.album === current; });

    if (!view.length) {
      wall.innerHTML = '<div class="empty-state"><div class="empty-state__art">' + U.icon('emptyPhoto') +
        '</div><p class="empty-state__text">这个分组还是空的</p></div>';
      return;
    }

    var html = '';
    for (var i = 0; i < view.length; i++) html += card(view[i], i);
    wall.innerHTML = html;

    bindCards(wall);
    U.revealOnScroll(wall.querySelectorAll('.polaroid'));
  }

  function card(p, i) {
    var isVideo = p.type === 'video';
    var locked = isLocked(p);
    var w = p.w || 3, h = p.h || 4;
    /* 倾斜角度由 id 稳定 hash 决定，每次渲染一致 */
    var tilt = (U.hashIndex(p.id || String(i), 9) - 4) * 0.5;   // -2deg ~ +2deg
    var src = isVideo ? (p.poster || '') : (p.thumb || p.src);
    var cap = p.caption || '';

    return '<figure class="polaroid reveal-on-scroll' + (locked ? ' polaroid--locked' : '') + '" data-idx="' + i + '" ' +
      'style="--tilt:' + tilt.toFixed(2) + 'deg" tabindex="0" role="button" ' +
      'aria-label="' + U.escapeHtml(locked ? '上锁的照片，需要暗号打开' : (cap || (isVideo ? '播放视频' : '查看大图'))) + '">' +
      '<div class="polaroid__frame" style="aspect-ratio:' + w + ' / ' + h + '">' +
      '<img class="polaroid__img" src="' + U.escapeHtml(src) + '" alt="' + U.escapeHtml(locked ? '上锁的照片' : (cap || '照片')) + '" ' +
      'loading="lazy" decoding="async" width="' + w + '" height="' + h + '">' +
      (isVideo
        ? '<span class="polaroid__play" aria-hidden="true">' + U.icon('play') + '</span>' +
          '<span class="polaroid__dur">' + fmtDur(p.dur) + '</span>'
        : '') +
      (locked
        ? '<span class="polaroid__lock" aria-hidden="true">' +
            '<span class="polaroid__lockico">' + U.icon('lock') + '</span>' +
            '<span class="polaroid__lockcap">上锁了 · 需要暗号</span>' +
          '</span>'
        : '') +
      (p.date ? '<span class="polaroid__date">' + U.escapeHtml(p.date) + '</span>' : '') +
      '</div>' +
      (cap ? '<figcaption class="polaroid__cap">' + U.escapeHtml(cap) + '</figcaption>' : '') +
      '</figure>';
  }

  function emptyState() {
    return '<section class="wall-head"><h1 class="t-h1">照片墙</h1></section>' +
      '<div class="empty-state" data-reveal>' +
      '<div class="empty-state__art">' + U.icon('camera') + '</div>' +
      '<p class="empty-state__text">这里还空着，等我们一起去拍</p>' +
      '</div>';
  }

  /* ---------- 交互 ---------- */
  function bindChips() {
    var box = document.querySelector('.chips');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.chip') : null;
      if (!btn) return;
      var label = btn.getAttribute('data-album');
      if (label === current) return;
      current = label;

      Array.prototype.forEach.call(box.querySelectorAll('.chip'), function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });

      var wall = document.getElementById('wall');
      if (U.prefersReducedMotion()) { paint(); return; }
      wall.classList.add('is-fading');
      window.setTimeout(function () {
        paint();
        wall.classList.remove('is-fading');
      }, 200);
    });
  }

  /* 灯箱只收录已解锁的照片，避免左右翻页绕过暗号 */
  function openPhoto(p) {
    var list = view.filter(function (q) { return !isLocked(q); });
    var idx = 0;
    for (var k = 0; k < list.length; k++) { if (list[k].id === p.id) idx = k; }
    U.openLightbox(list.map(function (q) {
      return { type: q.type, src: q.src, poster: q.poster, caption: q.caption, date: q.date };
    }), idx);
  }

  /* 输入暗号 → 正确后去掉模糊，并直接打开这张照片 */
  function askPass(p, el) {
    var tries = 0;

    U.sheet(
      '<p class="sheet__title hand">这封信上锁了</p>' +
      '<p class="sheet__text">' + U.escapeHtml(p.lockHint || '输入暗号才能打开') + '</p>' +
      '<input class="sheet__input sheet__input--code" type="password" inputmode="numeric" ' +
      'autocomplete="off" maxlength="8" placeholder="···" aria-label="暗号">' +
      '<div class="sheet__actions">' +
      '<button class="btn btn--sm btn--ghost" type="button" data-x="no">先不看</button>' +
      '<button class="btn btn--sm btn--primary" type="button" data-x="yes">打开</button>' +
      '</div>',
      function (root, close) {
        var input = root.querySelector('.sheet__input');

        function submit() {
          var v = (input.value || '').replace(/\s/g, '');
          if (v && v === String(p.lock)) {
            markUnlocked(p);
            close();
            /* 原地揭开：保留元素，模糊过渡回清晰 */
            if (el) {
              el.classList.remove('polaroid--locked');
              el.setAttribute('aria-label', p.caption || '查看大图');
              var ov = el.querySelector('.polaroid__lock');
              if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
            }
            U.toast('打开了，慢慢看');
            /* 等弹层收起、页面滚动锁释放后再开灯箱 */
            window.setTimeout(function () { openPhoto(p); }, 260);
            return;
          }
          tries++;
          input.value = '';
          input.classList.add('shake');
          window.setTimeout(function () { input.classList.remove('shake'); }, 260);
          U.toast(tries >= 3 ? '想不起来也没关系，问我就好' : '暗号不对，再想想');
          input.focus();
        }

        root.querySelector('[data-x="no"]').addEventListener('click', close);
        root.querySelector('[data-x="yes"]').addEventListener('click', submit);
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); submit(); }
        });
        window.setTimeout(function () { input.focus(); }, 220);
      });
  }

  function bindCards(wall) {
    function open(el) {
      var i = parseInt(el.getAttribute('data-idx'), 10);
      var p = view[i];
      if (!p) return;
      if (isLocked(p)) { askPass(p, el); return; }
      openPhoto(p);
    }

    wall.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('.polaroid') : null;
      if (card) open(card);
    });

    /* 键盘回车 / 空格打开 */
    wall.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest ? e.target.closest('.polaroid') : null;
      if (!card) return;
      e.preventDefault();
      open(card);
    });

    /* 图片加载失败 → 手绘占位图 */
    Array.prototype.forEach.call(wall.querySelectorAll('.polaroid__img'), function (img) {
      img.addEventListener('error', function () {
        if (img.dataset.fallback) return;
        img.dataset.fallback = '1';
        img.src = './assets/img/placeholder.svg';
      });
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    U.initPage({
      title: '照片墙',
      backText: '回到首页',
      showBgm: true,
      prev: { href: './index.html', label: '首页' },
      next: { href: './timeline.html', label: '时光轴' }
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
