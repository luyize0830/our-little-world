/* ==========================================================================
   timeline.js — 时光轴（FR-06）
   按年份分组、滚动入场、loveStart / firstMeet 特殊标记、配图点击进灯箱
   ========================================================================== */
(function (window, document) {
  'use strict';

  var U = window.Utils;
  var D = U.data;
  var app = document.getElementById('app');

  document.body.classList.add('js');

  /* ---------- 数据准备 ---------- */

  /* 正序（从相识到现在）；没有日期的排到最后 */
  function sorted() {
    return U.arr(D.timeline).slice().sort(function (a, b) {
      var da = dateOf(a), db = dateOf(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return String(da).localeCompare(String(db));
    });
  }

  /* photo 字段存的是 photos 数组里的 id，解析成完整对象 */
  function resolvePhoto(item) {
    if (!item) return null;
    if (typeof item === 'object') return item;
    var list = U.arr(D.photos);
    for (var i = 0; i < list.length; i++) { if (list[i].id === item) return list[i]; }
    return null;
  }

  /* 节点日期：优先用自己的 date，没写就跟随配图的拍摄日期 */
  function dateOf(it) {
    if (it.date) return it.date;
    var p = resolvePhoto(it.photo) || resolvePhoto(it.img);
    return (p && p.date) || '';
  }

  function isSpecial(date) {
    if (!date || !D.dates) return null;
    if (D.dates.loveStart && date === String(D.dates.loveStart).slice(0, 10)) return 'loveStart';
    if (D.dates.firstMeet && date === String(D.dates.firstMeet).slice(0, 10)) return 'firstMeet';
    return null;
  }

  function groupByYear(list) {
    var groups = [], index = {};
    list.forEach(function (it) {
      var d = dateOf(it);
      var y = d ? String(d).slice(0, 4) : '未知';
      if (!index[y]) { index[y] = { year: y, items: [] }; groups.push(index[y]); }
      index[y].items.push(it);
    });
    return groups;
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var list = sorted();

    if (!list.length) {
      app.innerHTML =
        '<section class="tl-head"><h1 class="t-h1">时光轴</h1></section>' +
        '<div class="empty-state" data-reveal><div class="empty-state__art">' + U.icon('leaf') + '</div>' +
        '<p class="empty-state__text">还没有写下我们的故事，<br>但已经开始了</p></div>';
      return;
    }

    var groups = groupByYear(list);
    var first = dateOf(list[0]), last = dateOf(list[list.length - 1]);
    var span = (first && last)
      ? U.formatDate(first, 'YYYY 年 MM 月') + ' — ' + U.formatDate(last, 'YYYY 年 MM 月')
      : '';

    var html =
      '<section class="tl-head" data-reveal>' +
      '<h1 class="t-h1">时光轴</h1>' +
      '<p class="t-muted">' + list.length + ' 个节点' + (span ? ' · ' + span : '') + '</p>' +
      '<p class="tl-head__hint">往下滑，就是我们往前走的样子</p>' +
      '</section>' +
      '<div class="tl">';

    groups.forEach(function (g) {
      html += '<section class="tl-year">' +
        '<h2 class="tl-year__title reveal-on-scroll">' +
        '<span class="tl-year__flag" aria-hidden="true">' + U.icon('flag') + '</span>' +
        (g.year === '未知' ? '忘记日子的日子' : g.year) +
        '</h2>';

      g.items.forEach(function (it) { html += node(it); });
      html += '</section>';
    });

    html += '</div>';
    app.innerHTML = html;

    bindMedia();
    U.revealOnScroll(app.querySelectorAll('.reveal-on-scroll'));
  }

  function node(it) {
    var photo = resolvePhoto(it.photo) || resolvePhoto(it.img);
    var date = dateOf(it);
    var sp = isSpecial(date);
    var cls = 'tl-item reveal-on-scroll' + (sp ? ' tl-item--special' : '');

    var media = '';
    if (photo) {
      var isVideo = photo.type === 'video';
      var src = isVideo ? (photo.poster || '') : (photo.thumb || photo.src);
      media =
        '<div class="tl-item__media" data-media="' + U.escapeHtml(photo.id || '') + '" ' +
        'style="aspect-ratio:' + (photo.w || 3) + ' / ' + (photo.h || 4) + '" ' +
        'role="button" tabindex="0" aria-label="' + (isVideo ? '播放视频' : '查看大图') + '">' +
        '<img src="' + U.escapeHtml(src) + '" alt="' + U.escapeHtml(it.title || '配图') + '" loading="lazy" decoding="async">' +
        (isVideo ? '<span class="tl-item__play" aria-hidden="true">' + U.icon('play') + '</span>' : '') +
        '</div>';
    }

    return '<article class="' + cls + '">' +
      '<span class="tl-item__dot" aria-hidden="true"></span>' +
      '<div class="tl-item__card">' +
      '<p class="tl-item__date">' +
      (date ? U.formatDate(date, 'YYYY 年 MM 月 DD 日') : '某个忘记日子的日子') +
      (sp ? '<span class="tl-item__crown" aria-hidden="true">' + U.icon(sp === 'loveStart' ? 'heartFill' : 'crown') + '</span>' : '') +
      '</p>' +
      '<h3 class="tl-item__title">' + U.escapeHtml(it.title || '') + '</h3>' +
      (it.desc ? '<p class="tl-item__desc">' + U.escapeHtml(it.desc) + '</p>' : '') +
      media +
      '</div>' +
      '</article>';
  }

  /* ---------- 配图点击进灯箱 ---------- */
  function bindMedia() {
    var boxes = app.querySelectorAll('[data-media]');
    if (!boxes.length) return;

    /* 时光轴里出现的所有配图，按时间顺序组成一个灯箱列表 */
    var items = [];
    var map = {};
    Array.prototype.forEach.call(boxes, function (box) {
      var p = resolvePhoto(box.getAttribute('data-media'));
      if (!p) return;
      map[p.id] = items.length;
      items.push({
        type: p.type, src: p.src, poster: p.poster,
        caption: p.caption || '', date: p.date
      });
    });

    function open(box) {
      var id = box.getAttribute('data-media');
      U.openLightbox(items, map[id] || 0);
    }

    Array.prototype.forEach.call(boxes, function (box) {
      box.addEventListener('click', function () { open(box); });
      box.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(box); }
      });
    });

    /* 加载失败 → 手绘占位图 */
    Array.prototype.forEach.call(app.querySelectorAll('.tl-item__media img'), function (img) {
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
      title: '时光轴',
      backText: '回到首页',
      showBgm: true,
      prev: { href: './album.html', label: '照片墙' },
      next: { href: './letters.html', label: '信件抽屉' }
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
