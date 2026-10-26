/* ==========================================================================
   period.js — 小日历（她的那几天）
   记录、周期推算、排卵/易孕期标记、每天的症状与心情
   所有数据只存浏览器 localStorage：period_starts / period_days
   ========================================================================== */
(function (window, document) {
  'use strict';

  var U = window.Utils;
  var D = U.data;
  var app = document.getElementById('app');

  var CFG = D.period || {};
  var LUTEAL = CFG.luteal || 14;
  var FERT_BEFORE = CFG.fertilityBefore || 5;
  var FERT_AFTER = CFG.fertilityAfter || 1;

  var KEY_STARTS = 'period_starts';
  var KEY_DAYS = 'period_days';

  var now = new Date();
  var cursor = { y: now.getFullYear(), m: now.getMonth() };

  document.body.classList.add('js');

  /* ---------- 存储 ---------- */
  function starts() { return U.arr(U.store.get(KEY_STARTS, [])).slice().sort(); }
  function notes() {
    var o = U.store.get(KEY_DAYS, {});
    return (o && typeof o === 'object') ? o : {};
  }

  /* ---------- 日期显示 ---------- */
  function cnDay(k) {
    var d = U.parseDate(k);
    return (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
  }
  function weekdayWord(k) {
    return '周' + '日一二三四五六'.charAt(U.parseDate(k).getDay());
  }

  /* ---------- 把记录换算成日历上的标记 ---------- */
  function model() {
    var st = U.periodStatus();
    var list = st.starts;
    var map = {};
    var saved = notes();
    var RANK = { period: 4, predicted: 3, ovu: 2, fertile: 1 };

    function mark(k, kind) {
      if (!map[k] || (RANK[kind] || 0) > (RANK[map[k]] || 0)) map[k] = kind;
    }

    /* 已记录的经期 */
    list.forEach(function (s) {
      for (var i = 0; i < st.length; i++) mark(U.dayShift(s, i), 'period');
    });

    /* 往后推算：预计经期 + 排卵日 + 易孕期 */
    if (list.length) {
      var limit = U.dayShift(st.today, 400);
      var p = list[list.length - 1];
      var guard = 0;
      while (guard++ < 40) {
        p = U.dayShift(p, st.cycle);
        if (p > limit) break;
        for (var j = 0; j < st.length; j++) mark(U.dayShift(p, j), 'predicted');
        var ovu = U.dayShift(p, -LUTEAL);
        mark(ovu, 'ovu');
        for (var f = -FERT_BEFORE; f <= FERT_AFTER; f++) mark(U.dayShift(ovu, f), 'fertile');
      }
    }

    return { st: st, marks: map, notes: saved };
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var m = model();
    app.innerHTML =
      heroHtml(m.st) +
      factsHtml(m.st) +
      calHtml(m) +
      cyclesHtml(m.st) +
      '<p class="pd-note" data-reveal>这些记录只存在这台设备的浏览器里，换手机或清缓存就看不到了。</p>';
    bindPage();
    reveal();
  }

  function heroHtml(st) {
    var status = '', sub = '';
    if (st.phase === 'empty') {
      status = '还没开始记';
      sub = '点一下「今天来了」，下次的日子我来算';
    } else if (st.phase === 'period') {
      status = '经期第 ' + st.day + ' 天';
      sub = '这次从 ' + cnDay(st.last) + '开始，凉的先别碰';
    } else if (st.phase === 'late') {
      status = '预计的日子过了 ' + st.days + ' 天';
      sub = '要是已经来了，点「今天来了」重新记一次';
    } else if (st.phase === 'today') {
      status = '预计就是今天';
      sub = '来了就点一下「今天来了」';
    } else {
      status = '距离下次还有 ' + st.days + ' 天';
      sub = '预计 ' + cnDay(st.next) + ' · 按 ' + st.cycle + ' 天周期算';
    }

    return '<section class="pd-hero" data-reveal>' +
      '<p class="pd-eyebrow">OUR LITTLE CALENDAR</p>' +
      '<h1 class="pd-hero__title">她的那几天</h1>' +
      '<p class="pd-hero__status">' + U.escapeHtml(status) + '</p>' +
      '<p class="pd-hero__sub">' + U.escapeHtml(sub) + '</p>' +
      '<div class="pd-hero__actions">' +
      '<button class="btn btn--primary" type="button" id="pdToday">' + U.icon('heartFill') + '今天来了</button>' +
      (st.starts.length ? '<button class="btn btn--ghost" type="button" id="pdUndo">撤销上次</button>' : '') +
      '</div>' +
      '</section>';
  }

  function factsHtml(st) {
    return '<section class="pd-facts" data-reveal>' +
      '<div class="pd-fact"><span class="pd-fact__k">平均周期</span><b class="pd-fact__v">' + st.cycle + ' 天</b></div>' +
      '<div class="pd-fact"><span class="pd-fact__k">经期长度</span><b class="pd-fact__v">' + st.length + ' 天</b></div>' +
      '<div class="pd-fact"><span class="pd-fact__k">上次开始</span><b class="pd-fact__v">' + (st.last ? cnDay(st.last) : '—') + '</b></div>' +
      '</section>';
  }

  function calHtml(m) {
    var y = cursor.y, mo = cursor.m;
    var first = new Date(y, mo, 1);
    var offset = (first.getDay() + 6) % 7;   /* 周一排第一列 */
    var start = new Date(y, mo, 1 - offset);
    var todayK = U.dayKey(new Date());
    var cells = '';

    for (var i = 0; i < 42; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      var k = U.dayKey(d);
      var kind = m.marks[k] || '';
      var cls = 'pd-day';
      if (d.getMonth() !== mo) cls += ' is-out';
      if (kind) cls += ' is-' + kind;
      if (k === todayK) cls += ' is-today';
      if (m.notes[k]) cls += ' has-note';

      var label = (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日' +
        (kind === 'period' ? '，经期' : kind === 'predicted' ? '，预计经期' :
          kind === 'ovu' ? '，排卵日' : kind === 'fertile' ? '，易孕期' : '');

      cells += '<button class="' + cls + '" type="button" data-day="' + k + '" aria-label="' + U.escapeHtml(label) + '">' +
        '<span class="pd-day__num">' + d.getDate() + '</span>' +
        (kind === 'ovu' ? '<span class="pd-day__flower" aria-hidden="true">✦</span>' : '') +
        '</button>';
    }

    return '<section class="pd-cal" data-reveal>' +
      '<header class="pd-cal__head">' +
      '<button class="pd-cal__nav" type="button" id="pdPrev" aria-label="上个月">' + U.icon('arrowLeft') + '</button>' +
      '<p class="pd-cal__month">' + y + ' 年 ' + (mo + 1) + ' 月</p>' +
      '<button class="pd-cal__nav" type="button" id="pdNext" aria-label="下个月">' + U.icon('arrowRight') + '</button>' +
      '</header>' +
      '<div class="pd-week" aria-hidden="true"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>' +
      '<div class="pd-grid">' + cells + '</div>' +
      '<ul class="pd-legend">' +
      '<li><i class="is-period"></i>经期</li>' +
      '<li><i class="is-predicted"></i>预计</li>' +
      '<li><i class="is-ovu"></i>排卵</li>' +
      '<li><i class="is-fertile"></i>易孕</li>' +
      '</ul>' +
      '</section>';
  }

  function cyclesHtml(st) {
    var rows = [], i;
    for (i = 1; i < st.starts.length; i++) {
      rows.push({ a: st.starts[i - 1], b: st.starts[i], gap: U.dayGap(st.starts[i - 1], st.starts[i]) });
    }
    rows = rows.slice(-6).reverse();

    var lis = '';
    if (!rows.length) {
      lis = '<li class="pd-cycle pd-cycle--empty">记满两次，就能看出你自己的周期啦</li>';
    } else {
      rows.forEach(function (r) {
        var off = r.gap < 21 || r.gap > 35;
        lis += '<li class="pd-cycle">' +
          '<span class="pd-cycle__range">' + cnDay(r.a) + ' → ' + cnDay(r.b) + '</span>' +
          '<b class="pd-cycle__days' + (off ? ' is-off' : '') + '">' + r.gap + ' 天</b>' +
          '</li>';
      });
    }

    return '<section class="pd-cycles" data-reveal>' +
      '<h2 class="pd-h2">最近的周期</h2>' +
      '<ul class="pd-cycle-list">' + lis + '</ul>' +
      '</section>';
  }

  /* ---------- 交互 ---------- */
  function bindPage() {
    document.getElementById('pdToday').addEventListener('click', addToday);

    var undo = document.getElementById('pdUndo');
    if (undo) undo.addEventListener('click', undoLast);

    document.getElementById('pdPrev').addEventListener('click', function () { shiftMonth(-1); });
    document.getElementById('pdNext').addEventListener('click', function () { shiftMonth(1); });

    Array.prototype.forEach.call(app.querySelectorAll('.pd-day'), function (btn) {
      btn.addEventListener('click', function () { openDay(btn.getAttribute('data-day')); });
    });
  }

  function shiftMonth(n) {
    var d = new Date(cursor.y, cursor.m + n, 1);
    cursor.y = d.getFullYear();
    cursor.m = d.getMonth();
    render();
  }

  function addToday() {
    var st = U.periodStatus();
    if (st.phase === 'period') {
      U.toast('已经记过了，今天是第 ' + st.day + ' 天');
      return;
    }
    var k = U.dayKey(new Date());
    var list = starts();
    if (list.indexOf(k) >= 0) {
      U.toast('今天记过啦');
      return;
    }
    list.push(k);
    list.sort();
    if (U.store.set(KEY_STARTS, list)) {
      U.toast('记好了，下次我帮你算');
      render();
      U.heartPop(window.innerWidth / 2, 160, 6);
    } else {
      U.toast('没存上，可能是浏览器不让保存');
    }
  }

  function undoLast() {
    U.confirmSheet('撤销最近一次经期记录？', function () {
      var list = starts();
      if (!list.length) return;
      list.pop();
      U.store.set(KEY_STARTS, list);
      U.toast('已经撤掉了');
      render();
    }, '撤销');
  }

  /* 某一天：流量 / 心情 / 症状 / 备注，顺便可以手动标记经期开始 */
  function openDay(k) {
    var all = notes();
    var rec = all[k] || {};
    var isStart = starts().indexOf(k) >= 0;

    function chips(group, list, current) {
      var html = '<div class="pd-chips" data-g="' + group + '">';
      list.forEach(function (v) {
        var on = group === 'symptom' ? (current || []).indexOf(v) >= 0 : current === v;
        html += '<button class="pd-chip' + (on ? ' is-on' : '') + '" type="button" data-v="' + v + '" ' +
          'aria-pressed="' + (on ? 'true' : 'false') + '">' + v + '</button>';
      });
      return html + '</div>';
    }

    U.sheet(
      '<p class="sheet__title hand">' + cnDay(k) + ' · ' + weekdayWord(k) + '</p>' +
      '<p class="sheet__text">看到什么、感觉怎么样，随手记一点</p>' +
      '<p class="pd-label">流量</p>' + chips('flow', ['少', '中', '多'], rec.flow || '') +
      '<p class="pd-label">心情</p>' + chips('mood', ['开心', '平静', '烦躁', '低落', '累'], rec.mood || '') +
      '<p class="pd-label">身体（可多选）</p>' + chips('symptom', ['腹痛', '腰酸', '头痛', '胸胀', '犯困', '想吃甜'], rec.symptoms || []) +
      '<textarea class="sheet__input" id="pdNote" rows="2" maxlength="60" placeholder="想写一句就写…">' + U.escapeHtml(rec.note || '') + '</textarea>' +
      '<button class="pd-startlink' + (isStart ? ' is-danger' : '') + '" type="button" data-x="start">' +
      (isStart ? '取消这天的经期记录' : '把这一天记为经期开始') + '</button>' +
      '<div class="sheet__actions">' +
      '<button class="btn btn--sm btn--ghost" type="button" data-x="no">取消</button>' +
      '<button class="btn btn--sm btn--primary" type="button" data-x="yes">保存</button>' +
      '</div>',
      function (root, close) {
        Array.prototype.forEach.call(root.querySelectorAll('.pd-chip'), function (btn) {
          btn.addEventListener('click', function () {
            var group = btn.parentNode.getAttribute('data-g');
            if (group === 'symptom') {
              var on = btn.classList.toggle('is-on');
              btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            } else {
              Array.prototype.forEach.call(btn.parentNode.querySelectorAll('.pd-chip'), function (b) {
                b.classList.remove('is-on');
                b.setAttribute('aria-pressed', 'false');
              });
              btn.classList.add('is-on');
              btn.setAttribute('aria-pressed', 'true');
            }
          });
        });

        function picked(group) {
          var el = root.querySelector('.pd-chips[data-g="' + group + '"] .pd-chip.is-on');
          return el ? el.getAttribute('data-v') : '';
        }
        function pickedMany(group) {
          var out = [];
          Array.prototype.forEach.call(
            root.querySelectorAll('.pd-chips[data-g="' + group + '"] .pd-chip.is-on'),
            function (b) { out.push(b.getAttribute('data-v')); }
          );
          return out;
        }

        root.querySelector('[data-x="no"]').addEventListener('click', close);

        root.querySelector('[data-x="yes"]').addEventListener('click', function () {
          var note = (root.querySelector('#pdNote').value || '').trim().slice(0, 60);
          var next = {
            flow: picked('flow'),
            mood: picked('mood'),
            symptoms: pickedMany('symptom'),
            note: note
          };
          var map = notes();
          if (!next.flow && !next.mood && !next.symptoms.length && !next.note) delete map[k];
          else map[k] = next;
          if (!U.store.set(KEY_DAYS, map)) U.toast('这次没存上');
          close();
          U.toast('记好了');
          render();
        });

        root.querySelector('[data-x="start"]').addEventListener('click', function () {
          var list = starts();
          var at = list.indexOf(k);
          if (at >= 0) {
            list.splice(at, 1);
            U.toast('已取消这天的经期记录');
          } else {
            list.push(k);
            list.sort();
            U.toast('记下了，这天算经期开始');
          }
          U.store.set(KEY_STARTS, list);
          close();
          render();
        });
      }
    );
  }

  function reveal() {
    var nodes = app.querySelectorAll('[data-reveal]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.setProperty('--i', i);
      nodes[i].classList.add('reveal');
    }
    document.body.classList.add('is-ready');
  }

  /* ---------- 启动 ---------- */
  function boot() {
    U.initPage({ title: '小日历', backText: '回到首页', showBgm: true });
    U.initBgm();
    U.buildSideDecor();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
