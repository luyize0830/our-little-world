/* ==========================================================================
   data.js — 全站唯一数据源
   --------------------------------------------------------------------------
   维护规则（重要）：
   1. 本文件只放数据，不放任何逻辑。
   2. 已存在的 id 字段永远不要修改或复用，否则会丢失她的打卡 / 已读状态。
   3. 标了 TODO 的内容是示例占位，请替换成你们真实的故事。
   4. 照片放到 assets/img/photos/，命名 p001.jpg / p001_thumb.jpg。
   ========================================================================== */

window.SITE_DATA = {

  /* ---------- 基础信息 ---------- */
  meta: {
    herName: '小赵',              // 她的称呼（全站显示）
    herNickname: '宝宝',          // 只在情话、信件里用的私密昵称
    myName: '小鹏',               // 我的署名
    myNickname: '宝宝',           // 她对我的称呼
    siteTitle: '小赵de小世界',     // 浏览器标签标题
    slogan: '我们俩的奇妙缘分',     // 首页副标题
    bgmUrl: '',                   // TODO: 背景音乐，如 './assets/audio/bgm.mp3'，留空则隐藏音符按钮
    enablePasscode: true,         // 口令页：打开首页先答一个问题（仪式感，非真实安全）
    passcode: '0817',             // 答案
    passcodeQuestion: '这是我们的秘密基地。第一次见面是几月几号？'
  },

  /* ---------- 日期 ---------- */
  dates: {
    loveStart: '2021-08-06',      // 在一起的日子（恋爱计时器基准）
    firstMeet: '2023-08-17',      // 第一次见面 —— 注意：此日期晚于 loveStart，
                                  // TODO: 请确认这里是「第一次线下见面」还是填错了年份
    herBirthday: '2006-07-26',    // 她的生日（农历七月廿六）
    herBirthdayIsLunar: true,     // true = 按农历过，需要查下面的对照表

    /* 农历七月廿六 → 公历对照表
       农历生日每年对应的公历日期都不同，静态站点不做农历推算，改用查表。
       已核对来源：万年历（并用星期推算二次校验）。
       TODO: 2031 年起请自行补充，格式 'YYYY': 'MM-DD' */
    lunarBirthdayMap: {
      '2026': '09-07',
      '2027': '08-27',
      '2028': '09-14',
      '2029': '09-04',
      '2030': '08-24'
    },

    /* 特殊日期：命中当天全站进入祝福模式
       date 支持 'MM-DD'（每年重复）或 'YYYY-MM-DD'（只生效一次）
       kind: 'birthday' | 'anniversary' | 'custom' */
    specialDays: [
      { date: '08-06', kind: 'anniversary', text: '今天是我们的纪念日，又一年，还是你。' },
      { date: 'LUNAR_BIRTHDAY', kind: 'birthday', text: '宝宝生日快乐，愿你年年都被偏爱。' }
      // TODO: 可以再加，例如：
      // { date: '05-20', kind: 'custom', text: '520 快乐，我这里的额度全都给你。' }
    ]
  },

  /* ---------- 每日一句情话 ----------
     规则：按当天日期取模，同一天固定不变，次日自动换。
     以下为原创文案，可自由增删改；建议保持 30 条以上。 */
  quotes: [
    '你今天有没有好好吃饭，我可是数着的。',
    '世界很吵，但你在的时候，我听得见安静。',
    '我喜欢你笑之前先低一下头的那个样子。',
    '所有的路我都想走两遍，一遍去见你，一遍送你回家。',
    '想把今天的风打包给你，它路过我的时候很温柔。',
    '我不是很会说话，但对你，我总想再多说一句。',
    '遇见你以后，我开始有点期待明天。',
    '你是我所有计划里，唯一没有备选项的那一个。',
    '就算什么都不做，只要和你待着，这一天就没白过。',
    '你随口说的小事，我记得比自己的密码还牢。',
    '今天的云很好看，我拍了，第一个想发给你。',
    '我承认我贪心，昨天想你，今天也想你。',
    '你在我这儿，永远有不用讲道理的特权。',
    '和你在一起之后，我连吵架都想吵得温柔一点。',
    '你要是累了就别撑着了，我这儿随时可以靠。',
    '我不羡慕别人的轰轰烈烈，我只要我们细水长流。',
    '你把日子过得很轻，我却把你放得很重。',
    '想到你的时候，我嘴角会自己往上跑，管不住。',
    '以后想吃什么都告诉我，我负责陪你去。',
    '我攒了好多话，一见到你就全忘了，只剩下笑。',
    '你今天也要开心，这是我今天唯一的愿望。',
    '别人看我长大，你陪我长大，这不一样。',
    '下雨天最适合想你，因为哪儿也去不了。',
    '我愿意做那个先低头的人，只要低头能看见你。',
    '你的名字很短，可我念的时候心里很长。',
    '我们的故事没什么大事，但每一件我都记得。',
    '你在我身边，我就觉得日子是有指望的。',
    '以后老了也要牵着你，走不动就慢慢走。',
    '我不太会说情话，所以我把日子过成了情话。',
    '你困了就去睡，剩下的事情明天我陪你做。',
    '喜欢你这件事，我一天比一天熟练。',
    '你笑起来的时候，我总觉得运气用不完。',
    '我没什么大本事，只想把你照顾好。',
    '如果重来一次，我还是会在人群里先找你。',
    '和你分享过的东西，都变得比原来好吃一点。',
    '我想和你一起，把平凡的日子过出一点点甜。',
    '你不说话的时候，我也能听懂你在想什么。',
    '谢谢你一直在我这边，从来没换过位置。',
    '今天的星星不多，但我有你，够亮了。',
    '我们慢慢来，反正剩下的时间都很长。',
    '你难过的时候，我情愿替你难过。',
    '我存的每一张照片，都是在偷你的时间。',
    '想和你去看很多地方的日落，一个一个打卡。',
    '你在的地方，就是我一定要回去的地方。',
    '宝宝，今天也很喜欢你，明天继续。'
  ],

  /* ---------- 信件 ----------
     TODO: 以下为示例，请替换成你真正想写的信。
     建议写 4 封：认识你之前 / 刚在一起时 / 现在 / 未来。
     body 用 \n\n 分段，前端会逐段淡入。 */
  letters: [
    {
      id: 'letter-001',
      title: '写在一起之前',
      date: '2021-07-30',
      body: '宝宝：\n\n那时候我还不知道，随手回的一句话，会把我们绑到现在。\n\n我记得那阵子我总在看手机，怕错过你。现在想想挺好笑的，可那种紧张我一点也不想否认。\n\n谢谢你后来选了我。\n\n—— 小鹏'
      // TODO: 替换为真实内容
    },
    {
      id: 'letter-002',
      title: '写在第 1 天',
      date: '2021-08-06',
      body: '宝宝：\n\n今天是我们在一起的第一天，我假装很淡定，其实心里放了一整天的烟花。\n\n我没什么经验，可能笨手笨脚，但我会认真。\n\n以后的日子，一起过。\n\n—— 小鹏'
      // TODO: 替换为真实内容
    },
    {
      id: 'letter-003',
      title: '写给现在',
      date: '2026-10-26',
      body: '宝宝：\n\n一转眼我们已经走了这么多年。日子没有电影里那么热闹，可我一点都不想换。\n\n我还是会在你说话的时候偷偷看你，还是会把好吃的第一口留给你。\n\n谢谢你一直在。\n\n—— 小鹏'
      // TODO: 替换为真实内容
    }
  ],

  /* ---------- 照片墙分组 ----------
     只有「至少有一张照片」的分组才会显示为筛选标签。
     TODO: 「第二次见面」「第三次见面」目前没有照片，标签不会出现；
           补照片时把 album 字段写成这两个名字即可自动生效。 */
  albums: ['第一次网恋奔现', '她的美术集训', '第二次见面', '第三次见面', '日常'],

  /* ---------- 照片 / 视频 ----------
     由 raw/ 目录自动处理生成：原图长边 ≤1600px、≤300KB，缩略图 600px，
     视频压到长边 ≤1280px（45.3MB → 7.5MB），并抽出封面帧。
     排序：按拍摄日期升序（EXIF → 文件名时间戳 → 修改时间）。
     字段：type image|video / src / thumb 或 poster / date / caption / album / w,h / dur(秒) */
  photos: [
    /* 日期来自微信保存时的 EXIF，可能不准，待确认 */
    { id: 'p001', type: 'image', src: './assets/img/photos/p001.jpg', thumb: './assets/img/photos/p001_thumb.jpg', date: '2022-02-15', caption: '她买的糖，上面画了我的名字', album: '日常', w: 960, h: 1280 },
    { id: 'p002', type: 'image', src: './assets/img/photos/p002.jpg', thumb: './assets/img/photos/p002_thumb.jpg', date: '2023-08-17', caption: '第一次见面，在她家外面的小路上，她说她不好出来，我当时好委屈', album: '第一次网恋奔现', w: 899, h: 1600 },
    /* 文件名写的是 08-18 中午，但照片是夜里拍的，按第一次见面当晚算 */
    { id: 'p003', type: 'image', src: './assets/img/photos/p003.jpg', thumb: './assets/img/photos/p003_thumb.jpg', date: '2023-08-17', caption: '第一次见面，两个人都很尴尬，只能这样拉手', album: '第一次网恋奔现', w: 830, h: 1465 },
    { id: 'p004', type: 'video', src: './assets/img/photos/p004.mp4', poster: './assets/img/photos/p004_poster.jpg', date: '2023-10-05', caption: '', album: '她的美术集训', w: 720, h: 1280, dur: 23 },
    { id: 'p005', type: 'video', src: './assets/img/photos/p005.mp4', poster: './assets/img/photos/p005_poster.jpg', date: '2024-02-23', caption: '', album: '她的美术集训', w: 720, h: 1280, dur: 12 },
    { id: 'p006', type: 'video', src: './assets/img/photos/p006.mp4', poster: './assets/img/photos/p006_poster.jpg', date: '2024-03-14', caption: '', album: '她的美术集训', w: 720, h: 960, dur: 22 },
    { id: 'p007', type: 'video', src: './assets/img/photos/p007.mp4', poster: './assets/img/photos/p007_poster.jpg', date: '2024-03-14', caption: '', album: '她的美术集训', w: 720, h: 1136, dur: 17 },
    { id: 'p008', type: 'video', src: './assets/img/photos/p008.mp4', poster: './assets/img/photos/p008_poster.jpg', date: '2024-03-15', caption: '', album: '她的美术集训', w: 720, h: 1280, dur: 22 },
    { id: 'p009', type: 'video', src: './assets/img/photos/p009.mp4', poster: './assets/img/photos/p009_poster.jpg', date: '2024-03-31', caption: '', album: '她的美术集训', w: 544, h: 960, dur: 3 },
    { id: 'p010', type: 'video', src: './assets/img/photos/p010.mp4', poster: './assets/img/photos/p010_poster.jpg', date: '2024-04-13', caption: '', album: '她的美术集训', w: 720, h: 1280, dur: 12 },
    /* ⚠ 这个是用剪映导出的（原名 lv_0_20240501100036.mp4），很可能才是「我做的视频」，待你确认 */
    { id: 'p011', type: 'video', src: './assets/img/photos/p011.mp4', poster: './assets/img/photos/p011_poster.jpg', date: '2024-05-01', caption: '', album: '她的美术集训', w: 1080, h: 1440, dur: 17 },
    /* 已换成桌面上的 lv_0_20240501100036.mp4（我做的那支视频）
       ?v=2 用来绕开浏览器对旧视频的缓存，以后再换视频把 v 往上加 */
    { id: 'p012', type: 'video', src: './assets/img/photos/p012.mp4?v=2', poster: './assets/img/photos/p012_poster.jpg?v=2', date: '2024-08-04', caption: '', album: '第一次网恋奔现', w: 960, h: 1280, dur: 17 },
    { id: 'p013', type: 'image', src: './assets/img/photos/p013.jpg', thumb: './assets/img/photos/p013_thumb.jpg', date: '2024-08-07', caption: '她给她闺蜜说想来找我，我很开心', album: '她的美术集训', w: 723, h: 1600 },
    { id: 'p014', type: 'image', src: './assets/img/photos/p014.jpg', thumb: './assets/img/photos/p014_thumb.jpg', date: '2024-08-07', caption: '她集训时拍给我的', album: '她的美术集训', w: 1200, h: 1600 },
    { id: 'p015', type: 'image', src: './assets/img/photos/p015.jpg', thumb: './assets/img/photos/p015_thumb.jpg', date: '2024-08-07', caption: '她集训时拍给我的', album: '她的美术集训', w: 1080, h: 1416 },
    { id: 'p016', type: 'image', src: './assets/img/photos/p016.jpg', thumb: './assets/img/photos/p016_thumb.jpg', date: '2024-08-07', caption: '她集训时拍给我的', album: '她的美术集训', w: 728, h: 796 },
    { id: 'p017', type: 'image', src: './assets/img/photos/p017.jpg', thumb: './assets/img/photos/p017_thumb.jpg', date: '2024-08-07', caption: '她集训时拍给我的', album: '她的美术集训', w: 960, h: 1280 },
    { id: 'p018', type: 'image', src: './assets/img/photos/p018.jpg', thumb: './assets/img/photos/p018_thumb.jpg', date: '2024-08-07', caption: '', album: '她的美术集训', w: 1230, h: 1280 },
    { id: 'p019', type: 'image', src: './assets/img/photos/p019.jpg', thumb: './assets/img/photos/p019_thumb.jpg', date: '2024-08-07', caption: '她集训时拍给我的', album: '她的美术集训', w: 900, h: 1600 },
    { id: 'p020', type: 'image', src: './assets/img/photos/p020.jpg', thumb: './assets/img/photos/p020_thumb.jpg', date: '2024-08-07', caption: '她的闺蜜帮我偷拍的', album: '她的美术集训', w: 1200, h: 1600 },
    { id: 'p021', type: 'image', src: './assets/img/photos/p021.jpg', thumb: './assets/img/photos/p021_thumb.jpg', date: '2024-08-07', caption: '她集训时拍给我的', album: '她的美术集训', w: 1200, h: 1600 },
    { id: 'p022', type: 'image', src: './assets/img/photos/p022.jpg', thumb: './assets/img/photos/p022_thumb.jpg', date: '2024-08-07', caption: '', album: '日常', w: 1080, h: 1440 },
    /* 三封手写信上锁：加了 lock 字段的卡片会先模糊、输入暗号后才显示 */
    { id: 'p023', type: 'image', src: './assets/img/photos/p023.jpg', thumb: './assets/img/photos/p023_thumb.jpg', date: '2024-08-07', caption: '她给我写的信', album: '日常', w: 780, h: 1040, lock: '147', lockHint: '提示：小赵身份证后 3 位' },
    { id: 'p024', type: 'image', src: './assets/img/photos/p024.jpg', thumb: './assets/img/photos/p024_thumb.jpg', date: '2024-08-07', caption: '她给我写的信', album: '日常', w: 780, h: 780, lock: '147', lockHint: '提示：小赵身份证后 3 位' },
    { id: 'p025', type: 'image', src: './assets/img/photos/p025.jpg', thumb: './assets/img/photos/p025_thumb.jpg', date: '2024-08-07', caption: '她给我写的信', album: '日常', w: 780, h: 780, lock: '147', lockHint: '提示：小赵身份证后 3 位' }
  ],

  /* ---------- 时光轴 ----------
     photo 字段填照片 id（对应上面 photos 数组），会自动带出图片/视频与尺寸。
     下面 5 条都有据可查（日期来自 EXIF 或你给的说明），可以放心用。
     TODO: 请继续补充「第二次见面」「第三次见面」等节点，目标 10~30 条。 */
  timeline: [
    {
      id: 'tl-001',
      date: '2021-08-06',
      title: '我们在一起了',
      desc: '从这一天开始，我的日历多了一个要记的日子。'
      // TODO: 补一句——那天你是怎么表白的？在哪？她什么反应？
    },
    {
      id: 'tl-002',
      date: '2023-08-17',
      title: '第一次见面',
      desc: '在屏幕里说了两年话，终于见到真人。两个人都尴尬得不行，手都不知道往哪放，最后只能这样牵着。',
      photo: 'p003'
    },
    {
      id: 'tl-003',
      /* 不写日期，自动跟随 p001 的日期；p001 日期待你确认 */
      title: '一块画了我名字的糖',
      photo: 'p001'
    },
    {
      id: 'tl-004',
      date: '2023-10-05',
      title: '她开始美术集训',
      desc: '那阵子她忙得没什么空，能收到她拍来的一张照片，我能高兴一整天。',
      photo: 'p004'
    },
    {
      id: 'tl-005',
      date: '2024-08-04',
      title: '我做了一支视频',
      desc: '把我们的照片剪在一起。其实从第一次见面之后，我就想做了。',
      photo: 'p012'
    }
  ],

  /* ---------- 共同愿望清单 ----------
     TODO: 以下为示例，请换成你们真正想做的事（15~40 条）。
     建议混一些已经实现的，打开就有进度感。 */
  wishes: [
    { id: 'w01', text: '一起去看一次海边的日出' },
    { id: 'w02', text: '把想去的地方做成一张地图，一个一个划掉' },
    { id: 'w03', text: '一起吃一次凌晨的便利店' },
    { id: 'w04', text: '学会做一道你爱吃的菜' },
    { id: 'w05', text: '拍一组穿同款衣服的合照' },
    { id: 'w06', text: '在雨天一起窝着看一整部电影' },
    { id: 'w07', text: '去一次游乐园，坐你最怕的那个项目' },
    { id: 'w08', text: '养一盆植物，一起把它养活' },
    { id: 'w09', text: '给对方写一封手写信' },
    { id: 'w10', text: '一起跨一次年，看到零点的第一句祝福是你' },
    { id: 'w11', text: '去你的 hometown 走一遍你上学的路' },
    { id: 'w12', text: '把我们的照片洗出来，做成一本相册' }
  ],

  /* ---------- 问答互动 ----------
     TODO: 以下为示例，请换成「只有你们两个知道答案」的问题。
     所有选项都要给温柔的反馈，不设对错。 */
  quiz: [
    {
      id: 'q1',
      question: '第一次见我的时候，你心里在想什么？',
      options: [
        { text: '这人还挺好看的', feedback: '（被我看穿了，我当时也在想同一件事。）' },
        { text: '有点紧张，不知道该说什么', feedback: '其实我更紧张，回去路上还在复盘自己有没有说错话。' },
        { text: '完全没印象了', feedback: '没关系，反正后来你记住了，这就够了。' }
      ]
    },
    {
      id: 'q2',
      question: '你觉得我们最像的地方是什么？',
      options: [
        { text: '都嘴硬，其实很软', feedback: '所以我们才总要先僵一下，再偷偷和好。' },
        { text: '都爱吃', feedback: '这条我最认同，我们的约会有一半是在决定吃什么。' },
        { text: '都很宅', feedback: '那更好，宅在一起的时光才是我最舍不得的。' }
      ]
    },
    {
      id: 'q3',
      question: '如果给你一个愿望，你会许什么？',
      options: [
        { text: '一直在一起', feedback: '这个愿望已经被我偷偷实现一半了，剩下一半我继续努力。' },
        { text: '去很远的地方旅行', feedback: '那就说好了，清单我记下了，一个一个陪你去。' },
        { text: '先许一个好吃的', feedback: '很符合你的风格，我完全支持，走吧。' }
      ]
    }
    // TODO: 建议补充到 5~10 题
  ],

  /* ---------- 通关告白 ----------
     TODO: 请替换成你自己写的 100~300 字。用 \n\n 分段，会逐段淡入。 */
  finale: '宝宝：\n\n做这个网站的时候我一直在想，到底要放点什么，才能让你知道我心里是怎么想的。\n\n后来发现放不下。这几年最好的部分都不是什么大事，是你随手发来的照片、是我们吵完架还是想见面、是你困得迷迷糊糊还跟我说晚安。\n\n我不知道未来会怎么样，但我知道我想和你一起去看。\n\n谢谢你选了我。我会一直在这儿。',

  /* ---------- 小日历（她的那几天） ----------
     记录只存在她这台设备的浏览器里（period_starts / period_days）
     这里只是默认参数，记录够两次以后会自动改用她自己的平均周期 */
  period: {
    defaultCycle: 28,       // 还没记住周期时按 28 天推算
    defaultPeriod: 5,       // 每次经期按 5 天显示
    luteal: 14,             // 排卵日 = 预计下次经期前 14 天
    fertilityBefore: 5,     // 易孕期从排卵日前 5 天开始
    fertilityAfter: 1       // 到排卵日后 1 天结束
  },

  /* ---------- 首页宫格副文案 ---------- */
  navDesc: {
    album: '把好看的你都存起来',
    timeline: '我们一路走过来的样子',
    letters: '有些话我写在信里了',
    wishes: '想和你一起做的事',
    quiz: '来测测你有多了解我们',
    board: '想说的话贴在这儿',
    period: '她的那几天，我记着'
  }
};
