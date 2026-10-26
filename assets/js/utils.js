/* ==========================================================================
   utils.js — 全站共享工具函数
   依赖：assets/js/data.js（window.SITE_DATA）
   各页面禁止重复实现以下能力
   ========================================================================== */
(function (window, document) {
  'use strict';

  var DATA = window.SITE_DATA || {};

  /* ======================================================================
     0. 基础安全工具
     ====================================================================== */

  function arr(v) { return Array.isArray(v) ? v : []; }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* 字符串稳定 hash 取模 —— 用于随机旋转角度等，保证每次渲染一致 */
  function hashIndex(str, len) {
    if (!len || len <= 0) return 0;
    var s = String(str == null ? '' : str), h = 0, i;
    for (i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    return h % len;
  }

  /* ======================================================================
     1. 日期
     ====================================================================== */

  /* 统一解析日期字符串为「本地时间」Date，避免 new Date('2021-08-06') 被当 UTC */
  function parseDate(v) {
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v !== 'string' || !v) return null;
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{1,2}))?/.exec(v.trim());
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), 0, 0);
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* formatDate('2021-08-06', 'YYYY年MM月DD日') */
  function formatDate(v, fmt) {
    var d = parseDate(v);
    if (!d) return '';
    var f = fmt || 'YYYY-MM-DD';
    return f
      .replace('YYYY', d.getFullYear())
      .replace('MM', pad2(d.getMonth() + 1))
      .replace('DD', pad2(d.getDate()))
      .replace('HH', pad2(d.getHours()))
      .replace('mm', pad2(d.getMinutes()));
  }

  /* 在一起的天数（含首日为第 1 天）；起始日在未来则返回负数 */
  function daysTogether(from) {
    var start = parseDate(from || (DATA.dates && DATA.dates.loveStart));
    if (!start) return null;
    var now = new Date();
    var a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    var b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((b - a) / 86400000) + 1;
  }

  /* 今天已经过去的时间 + 今日日期胶囊 */
  function todayParts() {
    var now = new Date();
    var ms = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;
    return {
      label: (now.getMonth() + 1) + '月' + now.getDate() + '日',
      h: pad2(Math.floor(ms / 3600000)),
      m: pad2(Math.floor(ms % 3600000 / 60000)),
      s: pad2(Math.floor(ms % 60000 / 1000))
    };
  }

  /* 距某个未来日期还有多少天 */
  function daysUntil(v) {
    var t = parseDate(v);
    if (!t) return null;
    var now = new Date();
    var a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    var b = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
    return Math.round((b - a) / 86400000);
  }

  /* ---------- 日期字符串小工具（YYYY-MM-DD） ---------- */
  function dayKey(v) {
    var d = parseDate(v);
    return d ? formatDate(d, 'YYYY-MM-DD') : '';
  }

  function dayShift(v, n) {
    var d = parseDate(v);
    if (!d) return '';
    d.setDate(d.getDate() + n);
    return formatDate(d, 'YYYY-MM-DD');
  }

  /* b - a，单位天 */
  function dayGap(a, b) {
    var x = parseDate(a), y = parseDate(b);
    if (!x || !y) return 0;
    return Math.round((y - x) / 86400000);
  }

  /* ---------- 小日历：经期状态（首页角标与 period.html 共用） ----------
     记录存在 localStorage.period_starts，是升序的 YYYY-MM-DD 数组。
     平均周期取最近 6 次间隔（只认 18~60 天之间），不够就用默认 28 天。 */
  function periodStatus() {
    var cfg = DATA.period || {};
    var cycle = cfg.defaultCycle || 28;
    var length = cfg.defaultPeriod || 5;
    var list = arr(store.get('period_starts', [])).slice().sort();
    var today = dayKey(new Date());
    var i, gap, gaps = [];

    for (i = 1; i < list.length; i++) {
      gap = dayGap(list[i - 1], list[i]);
      if (gap >= 18 && gap <= 60) gaps.push(gap);
    }
    if (gaps.length) {
      var recent = gaps.slice(-6), sum = 0;
      for (i = 0; i < recent.length; i++) sum += recent[i];
      cycle = Math.round(sum / recent.length);
    }

    var out = {
      phase: 'empty', cycle: cycle, length: length,
      starts: list, today: today
    };
    if (!list.length) return out;

    var last = list[list.length - 1];
    out.last = last;

    /* 还在这次经期里 */
    var end = dayShift(last, length - 1);
    if (today >= last && today <= end) {
      out.phase = 'period';
      out.day = dayGap(last, today) + 1;
      return out;
    }

    /* 预计下一次 */
    var next = dayShift(last, cycle);
    var left = dayGap(today, next);      // 正数=还有几天，负数=已经过了几天
    if (left < 0 && Math.abs(left) <= 10) {
      out.phase = 'late';
      out.days = Math.abs(left);
      out.next = next;
      return out;
    }
    var guard = 0;
    while (left < 0 && guard < 40) {
      next = dayShift(next, cycle);
      left = dayGap(today, next);
      guard++;
    }
    out.phase = left === 0 ? 'today' : 'waiting';
    out.days = left;
    out.next = next;
    return out;
  }

  /* 按当前小时返回问候语 */
  function greeting() {
    var h = new Date().getHours();
    var nick = (DATA.meta && DATA.meta.herNickname) || (DATA.meta && DATA.meta.herName) || '';
    var suffix = nick ? '，' + nick : '';
    if (h >= 5 && h < 11) return '早安' + suffix;
    if (h >= 11 && h < 14) return '午安' + suffix;
    if (h >= 14 && h < 18) return '下午好' + suffix;
    if (h >= 18 && h < 23) return '晚上好' + suffix;
    return '这么晚了还不睡呀' + suffix;
  }

  /* ======================================================================
     2. 特殊日期（含农历生日查表）
     ====================================================================== */

  function lunarBirthdayMD(year) {
    var map = (DATA.dates && DATA.dates.lunarBirthdayMap) || {};
    return map[String(year)] || null;
  }

  /* 返回今天命中的特殊日期 { text, kind } 或 null */
  function isSpecialDay(now) {
    var d = now || new Date();
    var mmdd = pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    var ymd = d.getFullYear() + '-' + mmdd;
    var list = arr(DATA.dates && DATA.dates.specialDays);
    var lunarMD = lunarBirthdayMD(d.getFullYear());
    var i, item;
    for (i = 0; i < list.length; i++) {
      item = list[i];
      if (!item || !item.date) continue;
      if (item.date === 'LUNAR_BIRTHDAY') {
        if (lunarMD && lunarMD === mmdd) return { text: item.text, kind: item.kind || 'birthday' };
        continue;
      }
      if (item.date === mmdd || item.date === ymd) return { text: item.text, kind: item.kind || 'custom' };
    }
    return null;
  }

  /* 下一个生日（农历）距今天数，用于首页小提示 */
  function nextBirthdayCountdown(now) {
    var d = now || new Date();
    var years = [d.getFullYear(), d.getFullYear() + 1];
    for (var i = 0; i < years.length; i++) {
      var md = lunarBirthdayMD(years[i]);
      if (!md) continue;
      var left = daysUntil(years[i] + '-' + md);
      if (left != null && left > 0) return { days: left, date: years[i] + '-' + md };
    }
    return null;
  }

  /* ======================================================================
     3. 本地存储（隐私模式下静默降级）
     ====================================================================== */

  var storageOK = (function () {
    try {
      var k = '__t' + Date.now();
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  })();

  var store = {
    available: storageOK,
    get: function (key, fallback) {
      if (!storageOK) return fallback;
      try {
        var raw = window.localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      if (!storageOK) return false;
      try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    remove: function (key) {
      if (!storageOK) return false;
      try { window.localStorage.removeItem(key); return true; } catch (e) { return false; }
    }
  };

  /* ======================================================================
     4. 每日一句
     ====================================================================== */

  var FALLBACK_QUOTE = '今天还没想好说什么，但我在想你。';

  function dailyIndex(len) {
    var d = new Date();
    var n = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return len > 0 ? n % len : 0;
  }

  /* 取当日情话：不传参数则用 DATA.quotes；传空数组走兜底文案 */
  function pickDaily(list) {
    var a = arr(list == null ? DATA.quotes : list);
    if (!a.length) return FALLBACK_QUOTE;
    return a[dailyIndex(a.length)];
  }

  /* 换一句：排除当前句后随机 */
  function pickAnother(current) {
    var a = arr(DATA.quotes);
    if (a.length <= 1) return a[0] || FALLBACK_QUOTE;
    var pool = a.filter(function (q) { return q !== current; });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ======================================================================
     5. toast
     ====================================================================== */

  function toast(msg, ms) {
    var wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);

    var el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = msg;
    wrap.appendChild(el);

    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    }, ms || 2000);
  }

  /* ======================================================================
     6. 手绘 SVG 图标库
        统一风格：viewBox 24、线宽 2、圆头端点、当前色
     ====================================================================== */

  var S = function (inner) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  };

  var ICONS = {
    heart: S('<path d="M12 20.3s-7.2-4.4-8.7-9A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8.7 3.7c-1.5 4.6-8.7 9-8.7 9z"/>'),
    heartFill: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.6C10.3 19.5 4.2 15.6 3 11.2A5 5 0 0 1 12 7.3a5 5 0 0 1 9 3.9c-1.2 4.4-7.3 8.3-9 9.4z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.2 6.2l9.2 5.8-9.2 5.8z"/></svg>',
    star: S('<path d="M12 4.2l2.2 4.9 5.3.6-3.9 3.6 1 5.2-4.6-2.6-4.6 2.6 1-5.2L4.5 9.7l5.3-.6z"/>'),
    cloud: S('<path d="M7.4 18.2h9a3.6 3.6 0 0 0 .3-7.2A5 5 0 0 0 7.2 11a3.6 3.6 0 0 0 .2 7.2z"/>'),
    flower: S('<circle cx="12" cy="9" r="2.1"/><path d="M12 6.9c0-2 1-3.3 2.4-3.3S16.6 5 15.4 6.6M12 6.9c0-2-1-3.3-2.4-3.3S7.4 5 8.6 6.6M9.9 9c-2 0-3.3-1-3.3-2.4S8 4.4 9.6 5.6M14.1 9c2 0 3.3-1 3.3-2.4S16 4.4 14.4 5.6M12 11.1v9.2M12 15.4c-1.6 0-3-1-3-2.3M12 17.8c1.6 0 3-1 3-2.3"/>'),
    leaf: S('<path d="M5 19c0-7 5-13 14-14 1 9-4 14-11 14H5zM5 19c3-3.4 6-5.6 9.5-7"/>'),
    plane: S('<path d="M21 3.6L2.8 10.4l6.5 2.6 2.6 6.5L21 3.6zM9.3 13l3.4-3.4"/>'),
    camera: S('<path d="M3.6 8.6h3l1.5-2.4h7l1.5 2.4h2.8a1 1 0 0 1 1 1v8.2a1 1 0 0 1-1 1H3.6a1 1 0 0 1-1-1V9.6a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.6" r="3.2"/>'),
    envelope: S('<path d="M3.4 6.6h17.2v10.8H3.4z"/><path d="M3.4 7.2l8.6 6 8.6-6"/>'),
    book: S('<path d="M4.6 5.4h5.2a2.2 2.2 0 0 1 2.2 2.2v11a2 2 0 0 0-2-2H4.6z"/><path d="M19.4 5.4h-5.2a2.2 2.2 0 0 0-2.2 2.2v11a2 2 0 0 1 2-2h5.4z"/>'),
    list: S('<path d="M8.4 6.6h11M8.4 12h11M8.4 17.4h11"/><path d="M4.4 6.6l1.2 1.2 2-2.4M4.4 12l1.2 1.2 2-2.4M4.4 17.4l1.2 1.2 2-2.4"/>'),
    question: S('<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2.1-2.5 3.8"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/>'),
    note: S('<path d="M5.4 3.8h9.2L19 8.2v12H5.4z"/><path d="M14.4 3.8v4.6H19M8.4 12.6h7M8.4 16.2h4.6"/>'),
    music: S('<circle cx="7.4" cy="17.6" r="2.6"/><circle cx="18" cy="15.4" r="2.6"/><path d="M10 17.6V7.2l10.6-2.4v10.6"/>'),
    sun: S('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.4M12 19v2.4M2.6 12h2.4M19 12h2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7"/>'),
    home: S('<path d="M4 10.8L12 4l8 6.8V20a.8.8 0 0 1-.8.8H4.8A.8.8 0 0 1 4 20z"/><path d="M9.6 20.8v-6h4.8v6"/>'),
    check: S('<path d="M4.8 12.6l4.6 4.6L19.4 7"/>'),
    sparkle: S('<path d="M12 3.4l1.6 4.4 4.4 1.6-4.4 1.6L12 15.4l-1.6-4.4L6 9.4l4.4-1.6zM18.4 15.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>'),
    crown: S('<path d="M4 17.6h16M4.6 7.2l3.6 3.4L12 5.4l3.8 5.2 3.6-3.4-1.4 8.4H6z"/>'),
    flag: S('<path d="M6.4 20.6V4.2M6.4 5h11.2l-2.4 3.9 2.4 3.9H6.4"/>'),
    arrowLeft: S('<path d="M14.6 5.4L8 12l6.6 6.6"/>'),
    arrowRight: S('<path d="M9.4 5.4L16 12l-6.6 6.6"/>'),
    close: S('<path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6"/>'),
    plus: S('<path d="M12 5.4v13.2M5.4 12h13.2"/>'),
    copy: S('<rect x="8.6" y="8.6" width="11" height="11" rx="2"/><path d="M15.4 5.4H6.4a2 2 0 0 0-2 2v9"/>'),
    refresh: S('<path d="M19.4 12a7.4 7.4 0 1 1-2.2-5.3"/><path d="M19.6 4.4v4.2h-4.2"/>'),
    download: S('<path d="M12 4.4v10.4M7.8 11l4.2 4.2 4.2-4.2M4.6 19.4h14.8"/>'),
    emptyPhoto: S('<rect x="3.6" y="5.4" width="16.8" height="13.2" rx="2"/><path d="M3.6 15.4l4.4-4 3.4 3 3-2.6 5.6 4.6"/><circle cx="9" cy="9.6" r="1.3"/>'),
    lock: S('<rect x="4.4" y="10.2" width="15.2" height="9.6" rx="2.2"/><path d="M8.4 10.2V7.8a3.6 3.6 0 0 1 7.2 0v2.4"/><circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none"/>'),
    calendar: S('<rect x="3.8" y="6.2" width="16.4" height="14" rx="2.2"/><path d="M3.8 10.4h16.4M8.2 3.8v4M15.8 3.8v4"/><circle cx="8.6" cy="14.6" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="14.6" r="1" fill="currentColor" stroke="none"/>')
  };

  function icon(name, cls) {
    var svg = ICONS[name] || ICONS.sparkle;
    if (cls) svg = svg.replace('<svg ', '<svg class="' + cls + '" ');
    return svg;
  }

  /* ======================================================================
     7. 爱心粒子
     ====================================================================== */

  /* 背景漂浮爱心（数量上限 12） */
  function buildHeartField(count) {
    if (prefersReducedMotion()) return null;
    var old = document.querySelector('.heart-field');
    if (old) old.parentNode.removeChild(old);

    var n = Math.min(count || 10, 12);
    var field = document.createElement('div');
    field.className = 'heart-field';
    field.setAttribute('aria-hidden', 'true');

    var html = '', i, size, left, dur, delay, op, rot;
    for (i = 0; i < n; i++) {
      size = 12 + hashIndex('h' + i, 14);
      left = (i * 97 % 100);
      dur = 8 + hashIndex('d' + i, 9);
      delay = -(hashIndex('y' + i, dur * 10) / 10);
      op = (0.15 + (hashIndex('o' + i, 21) / 100)).toFixed(2);
      rot = (hashIndex('r' + i, 2) ? 1 : -1) * (12 + hashIndex('r2' + i, 24));
      html += '<i style="left:' + left + '%;width:' + size + 'px;height:' + size + 'px;' +
        'animation-duration:' + dur + 's;animation-delay:' + delay + 's;--o:' + op + ';--r:' + rot + 'deg">' +
        ICONS.heartFill + '</i>';
    }
    field.innerHTML = html;
    document.body.appendChild(field);
    return field;
  }

  /* 点击处飘散的小爱心（一次性） */
  function heartPop(x, y, count) {
    if (prefersReducedMotion()) return;
    var n = count || 3, i;
    for (i = 0; i < n; i++) {
      (function (i) {
        var el = document.createElement('span');
        el.className = 'heart-pop';
        el.setAttribute('aria-hidden', 'true');
        el.style.left = (x - 9) + 'px';
        el.style.top = (y - 9) + 'px';
        el.style.setProperty('--dx', ((i - (n - 1) / 2) * 26 + (Math.random() * 12 - 6)) + 'px');
        el.style.animationDelay = (i * 90) + 'ms';
        el.innerHTML = ICONS.heartFill;
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1400 + i * 90);
      })(i);
    }
  }

  /* ======================================================================
     8. 图片灯箱（照片墙 / 时光轴共用）
        items: [{ src, caption, date }]
     ====================================================================== */

  var lb = null;

  function closeLightbox() {
    if (!lb) return;
    var v = lb.root.querySelector('.lightbox__video');
    if (v) { try { v.pause(); } catch (e) { /* 忽略 */ } v.removeAttribute('src'); v.load(); }
    document.removeEventListener('keydown', lb.onKey);
    if (lb.root.parentNode) lb.root.parentNode.removeChild(lb.root);
    document.body.style.overflow = lb.prevOverflow || '';
    lb = null;
  }

  /* items: [{ type:'image'|'video', src, thumb|poster, caption, date, dur }] */
  function openLightbox(items, startIndex) {
    var list = arr(items);
    if (!list.length) return;
    closeLightbox();

    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    var root = document.createElement('div');
    root.className = 'lightbox';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', '照片与视频查看');
    root.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="关闭">' + icon('close') + '</button>' +
      (list.length > 1 ? '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="上一个">' + icon('arrowLeft') + '</button>' +
        '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="下一个">' + icon('arrowRight') + '</button>' : '') +
      '<figure class="lightbox__fig">' +
      '<img class="lightbox__img" alt="">' +
      '<video class="lightbox__video hidden" controls playsinline preload="metadata"></video>' +
      '<figcaption class="lightbox__cap"></figcaption>' +
      '<div class="lightbox__count"></div>' +
      '</figure>';
    document.body.appendChild(root);

    var img = root.querySelector('.lightbox__img');
    var vid = root.querySelector('.lightbox__video');
    var cap = root.querySelector('.lightbox__cap');
    var cnt = root.querySelector('.lightbox__count');
    var idx = Math.max(0, Math.min(startIndex || 0, list.length - 1));

    function render(i) {
      idx = (i + list.length) % list.length;
      var it = list[idx] || {};
      var isVideo = it.type === 'video';

      /* 切走时先停掉上一个视频 */
      try { vid.pause(); } catch (e) { /* 忽略 */ }

      if (isVideo) {
        img.classList.add('hidden');
        vid.classList.remove('hidden');
        vid.poster = it.poster || '';
        vid.src = it.src || '';
        vid.load();
      } else {
        vid.classList.add('hidden');
        vid.removeAttribute('src');
        img.classList.remove('hidden', 'is-in');
        img.src = it.src || '';
        img.alt = it.caption || '照片';
        img.onerror = function () { img.src = './assets/img/placeholder.svg'; img.onerror = null; };
        void img.offsetWidth;
        img.classList.add('is-in');
      }

      var meta = [];
      if (it.caption) meta.push(escapeHtml(it.caption));
      if (it.date) meta.push('<span class="lightbox__date">' + escapeHtml(formatDate(it.date, 'YYYY-MM-DD')) + '</span>');
      cap.innerHTML = meta.join(' · ');
      cnt.textContent = (idx + 1) + ' / ' + list.length;
    }

    function next() { render(idx + 1); }
    function prev() { render(idx - 1); }

    lb = {
      root: root,
      prevOverflow: prevOverflow,
      onKey: function (e) {
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowRight') next();
        else if (e.key === 'ArrowLeft') prev();
      }
    };
    document.addEventListener('keydown', lb.onKey);

    var btnClose = root.querySelector('.lightbox__close');
    var btnPrev = root.querySelector('.lightbox__nav--prev');
    var btnNext = root.querySelector('.lightbox__nav--next');
    if (btnClose) btnClose.addEventListener('click', closeLightbox);
    if (btnPrev) btnPrev.addEventListener('click', function (e) { e.stopPropagation(); prev(); });
    if (btnNext) btnNext.addEventListener('click', function (e) { e.stopPropagation(); next(); });
    root.addEventListener('click', function (e) { if (e.target === root) closeLightbox(); });

    /* 移动端滑动 + 双击关闭 */
    var tx = 0, lastTap = 0;
    root.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); return; }
      var now = Date.now();
      if (now - lastTap < 300) closeLightbox();
      lastTap = now;
    }, { passive: true });

    render(idx);
  }

  /* ======================================================================
     9. 滚动入场动画
     ====================================================================== */

  function revealOnScroll(selector, opts) {
    /* 同时支持选择器字符串、NodeList、HTMLCollection 和数组 */
    var nodes = typeof selector === 'string'
      ? Array.prototype.slice.call(document.querySelectorAll(selector))
      : Array.prototype.slice.call(selector || []);
    if (!nodes.length) return;
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: (opts && opts.threshold) || 0.15, rootMargin: (opts && opts.rootMargin) || '0px 0px -8% 0px' });
    nodes.forEach(function (n) { io.observe(n); });
    return io;
  }

  /* ======================================================================
     10. 页面级公共设施
     ====================================================================== */

  /* 桌面端两侧的手绘边饰（<1024px 自动隐藏） */
  function buildSideDecor() {
    if (document.querySelector('.side-deco')) return;
    var days = daysTogether();
    var ls = String((DATA.dates && DATA.dates.loveStart) || '');
    var stamp = ls ? ls.slice(5, 7) + '·' + ls.slice(8, 10) : '';

    var left =
      '<aside class="side-deco side-deco--left" aria-hidden="true">' +
      '<span class="side-deco__doodle float">' + ICONS.plane + '</span>' +
      '<p class="side-deco__vtext">把日子过成我们喜欢的样子</p>' +
      '<span class="side-deco__doodle side-deco__doodle--alt float">' + ICONS.leaf + '</span>' +
      '</aside>';

    var right =
      '<aside class="side-deco side-deco--right" aria-hidden="true">' +
      '<span class="side-deco__doodle side-deco__doodle--alt float">' + ICONS.sun + '</span>' +
      '<p class="side-deco__vtext">第 ' + (days || 0) + ' 天，还在继续</p>' +
      (stamp ? '<span class="side-deco__stamp">' + stamp + '</span>' : '') +
      '<span class="side-deco__doodle float">' + ICONS.flower + '</span>' +
      '</aside>';

    document.body.insertAdjacentHTML('beforeend', left + right);
  }

  /* 设置标题、构建返回栏与翻页器 */
  function initPage(options) {
    var o = options || {};
    if (o.title) {
      var base = (DATA.meta && DATA.meta.siteTitle) || '';
      /* 首页直接用站点名，子页面用「页面名 · 站点名」 */
      document.title = (o.home || !base) ? (o.title || base) : o.title + ' · ' + base;
    }

    /* 返回栏 */
    var topbar = document.querySelector('.topbar');
    if (topbar) {
      var back = topbar.querySelector('.back');
      if (back && o.backText) back.innerHTML = icon('arrowLeft') + '<span>' + escapeHtml(o.backText) + '</span>';
      var name = topbar.querySelector('.page-name');
      if (name && o.title) name.textContent = o.title;
      if (!o.showBgm) {
        var bgm = topbar.querySelector('.bgm-toggle');
        if (bgm) bgm.classList.add('hidden');
      }
    }

    /* 翻页器 */
    var pager = document.querySelector('.pager');
    if (pager) {
      if (o.prev) {
        pager.querySelector('[data-pager="prev"]').setAttribute('href', o.prev.href);
        pager.querySelector('[data-pager="prev"]').setAttribute('aria-label', '上一页：' + o.prev.label);
      }
      if (o.next) {
        pager.querySelector('[data-pager="next"]').setAttribute('href', o.next.href);
        pager.querySelector('[data-pager="next"]').setAttribute('aria-label', '下一页：' + o.next.label);
      }
    }

    var main = document.querySelector('.page');
    if (main) main.classList.add('page-enter');
  }

  /* 背景音乐：默认关闭，点击开启 */
  function initBgm() {
    var btn = document.querySelector('.bgm-toggle');
    var url = DATA.meta && DATA.meta.bgmUrl;
    if (!btn) return;
    if (!url) { btn.classList.add('hidden'); return; }
    btn.classList.remove('hidden');
    btn.innerHTML = icon('music');
    btn.setAttribute('aria-pressed', 'false');

    var audio = null;
    btn.addEventListener('click', function () {
      if (!audio) {
        audio = new Audio(url);
        audio.loop = true;
        audio.volume = 0.4;
        audio.addEventListener('error', function () { toast('音乐放不出来，稍后再试试'); });
      }
      if (audio.paused) {
        var p = audio.play();
        if (p && p.catch) p.catch(function () {
          btn.classList.add('shake');
          setTimeout(function () { btn.classList.remove('shake'); }, 240);
        });
        btn.classList.add('is-playing');
        btn.setAttribute('aria-pressed', 'true');
        try { window.sessionStorage.setItem('bgm', '1'); } catch (e) { /* 忽略 */ }
      } else {
        audio.pause();
        btn.classList.remove('is-playing');
        btn.setAttribute('aria-pressed', 'false');
        try { window.sessionStorage.removeItem('bgm'); } catch (e) { /* 忽略 */ }
      }
    });

    /* 同会话内跨页面延续播放（点击新页面的音符按钮时自动播放，不强制自动播） */
    try {
      if (window.sessionStorage.getItem('bgm') === '1') btn.classList.add('is-resume-hint');
    } catch (e) { /* 忽略 */ }
  }

  /* ---------- 底部弹层（确认 / 编辑共用） ---------- */
  function sheet(html, onMount) {
    var root = document.createElement('div');
    root.className = 'sheet-mask';
    root.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { root.classList.add('is-open'); });

    function close() {
      root.classList.remove('is-open');
      document.body.style.overflow = '';
      window.setTimeout(function () { if (root.parentNode) root.parentNode.removeChild(root); }, 220);
    }
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    if (onMount) onMount(root, close);
    return { root: root, close: close };
  }

  function confirmSheet(msg, onOk, okText) {
    return sheet(
      '<p class="sheet__text">' + escapeHtml(msg) + '</p>' +
      '<div class="sheet__actions">' +
      '<button class="btn btn--sm btn--ghost" type="button" data-x="no">再想想</button>' +
      '<button class="btn btn--sm btn--primary" type="button" data-x="yes">' + escapeHtml(okText || '确定') + '</button>' +
      '</div>',
      function (root, close) {
        root.querySelector('[data-x="no"]').addEventListener('click', close);
        root.querySelector('[data-x="yes"]').addEventListener('click', function () { close(); if (onOk) onOk(); });
      });
  }

  function promptSheet(title, initial, onSave) {
    return sheet(
      '<p class="sheet__title hand">' + escapeHtml(title) + '</p>' +
      '<textarea class="sheet__input" rows="3" maxlength="40">' + escapeHtml(initial || '') + '</textarea>' +
      '<div class="sheet__actions">' +
      '<button class="btn btn--sm btn--ghost" type="button" data-x="no">取消</button>' +
      '<button class="btn btn--sm btn--primary" type="button" data-x="yes">保存</button>' +
      '</div>',
      function (root, close) {
        var ta = root.querySelector('.sheet__input');
        ta.focus();
        root.querySelector('[data-x="no"]').addEventListener('click', close);
        root.querySelector('[data-x="yes"]').addEventListener('click', function () {
          var v = ta.value.trim();
          if (!v) {
            ta.classList.add('shake');
            window.setTimeout(function () { ta.classList.remove('shake'); }, 240);
            return;
          }
          close();
          if (onSave) onSave(v);
        });
      });
  }

  /* ---------- 导出文本文件（愿望清单 / 留言板共用） ---------- */
  function downloadText(filename, text) {
    try {
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return true;
    } catch (e) { return false; }
  }

  /* ======================================================================
     导出
     ====================================================================== */

  window.Utils = {
    data: DATA,
    arr: arr,
    escapeHtml: escapeHtml,
    prefersReducedMotion: prefersReducedMotion,
    hashIndex: hashIndex,
    parseDate: parseDate,
    pad2: pad2,
    formatDate: formatDate,
    daysTogether: daysTogether,
    daysUntil: daysUntil,
    todayParts: todayParts,
    greeting: greeting,
    isSpecialDay: isSpecialDay,
    nextBirthdayCountdown: nextBirthdayCountdown,
    dayKey: dayKey,
    dayShift: dayShift,
    dayGap: dayGap,
    periodStatus: periodStatus,
    store: store,
    pickDaily: pickDaily,
    pickAnother: pickAnother,
    dailyIndex: dailyIndex,
    toast: toast,
    icon: icon,
    icons: ICONS,
    buildHeartField: buildHeartField,
    heartPop: heartPop,
    openLightbox: openLightbox,
    closeLightbox: closeLightbox,
    revealOnScroll: revealOnScroll,
    initPage: initPage,
    initBgm: initBgm,
    buildSideDecor: buildSideDecor,
    downloadText: downloadText,
    sheet: sheet,
    confirmSheet: confirmSheet,
    promptSheet: promptSheet
  };

})(window, document);
