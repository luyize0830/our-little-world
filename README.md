# 小赵de小世界

只属于我们两个人的小网站。

## 日常维护：只改一个文件

打开 `assets/js/data.js`，所有文案、日期、照片清单都在里面。

| 想改什么 | 改哪里 |
|---|---|
| 称呼、纪念日、生日 | `meta` / `dates` |
| 每日一句情话 | `quotes` 数组 |
| 信 | `letters` 数组 |
| 时光轴 | `timeline` 数组 |
| 愿望清单 | `wishes` 数组 |
| 小测验 | `quiz` 数组 |
| 通关告白 | `finale` |

**重要：已经存在的 `id` 字段永远不要改**，否则会丢失她的打卡和已读状态。

## 添加照片

1. 把照片放进 `assets/img/photos/`，命名 `p001.jpg`，同时生成缩略图 `p001_thumb.jpg`
   - 原图：长边 ≤ 1600px，单张 ≤ 300KB
   - 缩略图：长边 600px，≤ 80KB
   - 压缩工具：https://squoosh.app
2. 在 `data.js` 的 `photos` 数组里加一条：

```js
{ id: 'p001', src: './assets/img/photos/p001.jpg', thumb: './assets/img/photos/p001_thumb.jpg',
  date: '2023-08-17', caption: '第一次见面那天', album: '2023', w: 3, h: 4 }
```

## 农历生日

她的生日按农历过，静态站点不做农历推算，用查表方式：
`data.js` → `dates.lunarBirthdayMap`，每年补一条 `'YYYY': 'MM-DD'` 即可。

已核对：2026-09-07、2027-08-27、2028-09-14、2029-09-04、2030-08-24。

## 本地预览

在本目录执行任意一种：

```powershell
python -m http.server 8080
npx serve .
```

然后浏览器打开 http://localhost:8080

想看开场动画重复播放：http://localhost:8080/?intro=1

## 部署

见需求文档第 9 章「部署步骤」。仓库根目录必须保留 `.nojekyll` 文件。
