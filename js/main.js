/* ============================
   紫夜魔谕 · Main JS
   Particles · Animations · UI
   ============================ */

'use strict';

function scrollToEl(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const offset = 80;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* ─── 1. Particle System ─────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], animFrame;

  const COLORS = [
    'rgba(201,168,76,',
    'rgba(139,92,246,',
    'rgba(196,181,253,',
    'rgba(223,192,104,',
  ];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function isMobile() { return window.innerWidth < 768; }
  function isTablet() { return window.innerWidth < 1100; }

  function count() {
    if (isMobile()) return 40;
    if (isTablet()) return 80;
    return 140;
  }

  function createParticle() {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x:    Math.random() * W,
      y:    Math.random() * H,
      r:    Math.random() * 1.4 + 0.2,
      vx:   (Math.random() - 0.5) * 0.18,
      vy:   -(Math.random() * 0.25 + 0.05),
      life: Math.random(),
      maxLife: Math.random() * 0.6 + 0.2,
      color,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.02 + 0.008,
    };
  }

  function initParticleArr() {
    particles = [];
    const n = count();
    for (let i = 0; i < n; i++) {
      const p = createParticle();
      p.life = Math.random(); // random start phase
      particles.push(p);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.twinkle += p.twinkleSpeed;
      const twinkleAlpha = 0.3 + Math.sin(p.twinkle) * 0.3;
      const alpha = Math.sin(p.life * Math.PI) * twinkleAlpha;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.fill();

      // tiny cross sparkle for gold particles
      if (p.color === COLORS[0] && p.r > 1) {
        ctx.strokeStyle = p.color + (alpha * 0.5) + ')';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x - p.r * 2.5, p.y);
        ctx.lineTo(p.x + p.r * 2.5, p.y);
        ctx.moveTo(p.x, p.y - p.r * 2.5);
        ctx.lineTo(p.x, p.y + p.r * 2.5);
        ctx.stroke();
      }

      p.x  += p.vx;
      p.y  += p.vy;
      p.life += 0.003;

      if (p.life > 1 || p.y < -10 || p.x < -10 || p.x > W + 10) {
        Object.assign(p, createParticle());
        p.y = H + 5;
        p.life = 0;
      }
    }

    animFrame = requestAnimationFrame(draw);
  }

  function start() {
    resize();
    initParticleArr();
    draw();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(animFrame);
      start();
    }, 200);
  });

  // Respect reduced motion
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!motionQuery.matches) {
    start();
  }
})();


/* ─── 2. Navbar scroll behavior ─────────────── */
(function initNavbar() {
  const navbar  = document.getElementById('navbar');
  const backTop = document.getElementById('back-to-top');
  if (!navbar) return;

  function onScroll() {
    const scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', scrollY > 60);
    if (backTop) backTop.classList.toggle('visible', scrollY > 500);

    // Active nav link highlight
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) {
        current = sec.id;
      }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();


/* ─── 3. Mobile nav toggle ───────────────────── */
(function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
})();


/* ─── 4. Scroll Reveal (IntersectionObserver) ── */
(function initScrollReveal() {
  const heroEls = document.querySelectorAll('.reveal-line, .reveal-up, .reveal-right');

  // Hero elements: trigger on load
  setTimeout(() => {
    heroEls.forEach(el => el.classList.add('visible'));
  }, 100);

  // Section elements: trigger on scroll
  const sectionEls = document.querySelectorAll(
    '.theme-card, .step-item, .triple-block, .privacy-card, .guide-card, .form-block, .spread-block'
  );

  if (!('IntersectionObserver' in window)) {
    sectionEls.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el  = entry.target;
        const idx = parseInt(el.dataset.index || '0', 10);
        setTimeout(() => el.classList.add('in-view'), idx * 80);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  sectionEls.forEach((el, i) => {
    el.dataset.index = i % 6;
    observer.observe(el);
  });
})();


/* ─── 5. Theme Card Selection ────────────────── */
(function initThemeCards() {
  const cards = document.querySelectorAll('.theme-card');
  const hiddenInput = document.getElementById('select-theme');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      if (typeof TAROT_AUDIO !== 'undefined') TAROT_AUDIO.playSelect();
      cards.forEach(c => { c.style.borderColor = ''; c.style.boxShadow = ''; });
      card.style.borderColor = 'var(--gold-400)';
      card.style.boxShadow   = '0 0 32px var(--gold-glow), var(--shadow-card)';
      const theme = card.dataset.theme;
      if (hiddenInput && theme) hiddenInput.value = theme;
      // sync rune chips
      document.querySelectorAll('.rune-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.val === theme);
        chip.setAttribute('aria-pressed', String(chip.dataset.val === theme));
      });
      setTimeout(() => {
        scrollToEl('form-section');
      }, 300);
    });

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
})();


/* ─── 5b. Rune Chip Selector ─────────────────── */
(function initRuneChips() {
  const chips      = document.querySelectorAll('.rune-chip');
  const hiddenInput = document.getElementById('select-theme');
  const themeCards  = document.querySelectorAll('.theme-card');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (typeof TAROT_AUDIO !== 'undefined') TAROT_AUDIO.playSelect();
      chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      const val = chip.dataset.val;
      if (hiddenInput) hiddenInput.value = val;
      // Mirror onto theme grid
      themeCards.forEach(c => {
        const isMatch = c.dataset.theme === val;
        c.style.borderColor = isMatch ? 'var(--gold-400)' : '';
        c.style.boxShadow   = isMatch ? '0 0 32px var(--gold-glow), var(--shadow-card)' : '';
      });
    });
  });
})();


/* ─── 6. DeepSeek API · Tarot Reading Engine ── */
const TAROT_AI = (() => {
  const API_URL = '/api/tarot-reading';

  // 78张大小阿卡纳随机池
  const CARD_POOL = [
    // ─── Major Arcana (22) ───
    { zh: '愚者',     en: 'THE FOOL',          img: '0-thefool.jpg',            pos: ['新的开始','天真无畏','自由探索'],         rev: ['鲁莽冒进','缺乏方向','不计后果'] },
    { zh: '魔术师',   en: 'THE MAGICIAN',       img: '1-themagician.jpg',        pos: ['意志力','创造力','资源整合'],             rev: ['欺骗操控','才华浪费','缺乏行动'] },
    { zh: '女祭司',   en: 'THE HIGH PRIESTESS', img: '2-thehighpriestess.jpg',   pos: ['直觉洞察','内在智慧','隐藏真相'],         rev: ['忽视直觉','过于表面','内心封闭'] },
    { zh: '女皇',     en: 'THE EMPRESS',        img: '3-theempress.jpg',         pos: ['丰盛富饶','创造滋养','感官愉悦'],         rev: ['过度依赖','创造力枯竭','忽略自我'] },
    { zh: '皇帝',     en: 'THE EMPEROR',        img: '4-theemperor.jpg',         pos: ['权威秩序','理性掌控','稳固根基'],         rev: ['专制僵化','控制欲强','权力滥用'] },
    { zh: '教皇',     en: 'THE HIEROPHANT',     img: '5-thehierophant.jpg',      pos: ['传统信仰','精神引导','知识传承'],         rev: ['教条束缚','盲从权威','打破常规'] },
    { zh: '恋人',     en: 'THE LOVERS',         img: '6-thelovers.jpg',          pos: ['深层结合','灵魂选择','价值抉择'],         rev: ['关系失衡','价值冲突','逃避选择'] },
    { zh: '战车',     en: 'THE CHARIOT',        img: '7-thechariot.jpg',         pos: ['坚定意志','克服阻碍','胜利前进'],         rev: ['失去方向','内心冲突','强行推进'] },
    { zh: '力量',     en: 'STRENGTH',           img: '8-strength.jpg',           pos: ['内在力量','温柔坚韧','驯服本能'],         rev: ['自我怀疑','软弱屈服','失控暴怒'] },
    { zh: '隐士',     en: 'THE HERMIT',         img: '9-thehermit.jpg',          pos: ['内省寻道','独处智慧','精神指引'],         rev: ['过度孤僻','拒绝帮助','迷失方向'] },
    { zh: '命运之轮', en: 'WHEEL OF FORTUNE',   img: '10-fortune.jpg',           pos: ['命运转折','因果循环','关键时机'],         rev: ['抗拒变化','厄运逆转','错失时机'] },
    { zh: '正义',     en: 'JUSTICE',            img: '11-justice.jpg',           pos: ['公正裁决','因果业报','真相大白'],         rev: ['不公偏见','逃避责任','判断失误'] },
    { zh: '倒吊人',   en: 'THE HANGED MAN',     img: '12-thehangedman.jpg',      pos: ['视角颠覆','甘愿牺牲','灵性觉醒'],         rev: ['无谓牺牲','拖延逃避','拒绝放手'] },
    { zh: '死神',     en: 'DEATH',              img: '13-death.jpg',             pos: ['深层转化','旧章终结','凤凰涅槃'],         rev: ['抗拒蜕变','恐惧改变','停滞不前'] },
    { zh: '节制',     en: 'TEMPERANCE',         img: '14-temperance.jpg',        pos: ['平衡调和','耐心融合','中庸之道'],         rev: ['极端失衡','缺乏耐心','过度放纵'] },
    { zh: '恶魔',     en: 'THE DEVIL',          img: '15-thedevil.jpg',          pos: ['直面阴影','欲望诱惑','物质束缚'],         rev: ['挣脱枷锁','觉醒解放','夺回力量'] },
    { zh: '塔',       en: 'THE TOWER',          img: '16-thetower.jpg',          pos: ['突破幻象','根基崩塌','闪电觉醒'],         rev: ['恐惧改变','灾难延后','内在动摇'] },
    { zh: '星星',     en: 'THE STAR',           img: '17-thestar.jpg',           pos: ['希望指引','疗愈重生','宇宙祝福'],         rev: ['信心丧失','灵性断联','希望幻灭'] },
    { zh: '月亮',     en: 'THE MOON',           img: '18-themoon.jpg',           pos: ['潜意识浮现','迷雾幻象','深层恐惧'],       rev: ['走出迷惑','真相渐明','释放恐惧'] },
    { zh: '太阳',     en: 'THE SUN',            img: '19-thesun.jpg',            pos: ['光明喜悦','成功绽放','纯真活力'],         rev: ['短暂阴霾','过度乐观','内在受伤'] },
    { zh: '审判',     en: 'JUDGEMENT',          img: '20-judgement.jpg',          pos: ['灵性觉醒','使命召唤','重生审视'],         rev: ['自我否定','逃避召唤','拒绝成长'] },
    { zh: '世界',     en: 'THE WORLD',          img: '21-theworld.jpg',          pos: ['圆满整合','周期完成','自由大成'],         rev: ['未竟之事','缺少收尾','害怕完结'] },
    // ─── Wands · 权杖 (14) ───
    { zh: '权杖王牌', en: 'ACE OF WANDS',       img: '22-aceofwands.jpg',        pos: ['灵感涌现','新的机遇','创造力爆发'],       rev: ['延迟启动','创意受阻','缺乏动力'] },
    { zh: '权杖二',   en: 'TWO OF WANDS',       img: '23-wands2.jpg',            pos: ['远见规划','探索未知','未来蓝图'],         rev: ['恐惧未知','缺乏规划','安于现状'] },
    { zh: '权杖三',   en: 'THREE OF WANDS',     img: '24-wands3.jpg',            pos: ['拓展视野','前瞻远见','商业良机'],         rev: ['缺乏远见','拓展受阻','准备不足'] },
    { zh: '权杖四',   en: 'FOUR OF WANDS',      img: '25-wands4.jpg',            pos: ['欢庆丰收','和谐家庭','里程碑'],           rev: ['缺少归属','过渡期','根基不稳'] },
    { zh: '权杖五',   en: 'FIVE OF WANDS',      img: '26-wands5.jpg',            pos: ['激烈竞争','观点碰撞','意见分歧'],         rev: ['化解冲突','避免争端','内在矛盾'] },
    { zh: '权杖六',   en: 'SIX OF WANDS',       img: '27-wands6.jpg',            pos: ['凯旋胜利','公众认可','领袖荣耀'],         rev: ['名誉受损','骄傲自负','缺乏认可'] },
    { zh: '权杖七',   en: 'SEVEN OF WANDS',     img: '28-wands7.jpg',            pos: ['坚守阵地','捍卫信念','逆境抗争'],         rev: ['力不从心','放弃防守','自我怀疑'] },
    { zh: '权杖八',   en: 'EIGHT OF WANDS',     img: '29-wands8.jpg',            pos: ['迅速推进','旅途变动','消息突至'],         rev: ['延误等待','混乱无序','方向不明'] },
    { zh: '权杖九',   en: 'NINE OF WANDS',      img: '30-wands9.jpg',            pos: ['坚韧不拔','警惕防备','最后考验'],         rev: ['精疲力竭','偏执多疑','拒绝放松'] },
    { zh: '权杖十',   en: 'TEN OF WANDS',       img: '31-wands10.jpg',           pos: ['重担压身','责任过载','独自承担'],         rev: ['学会放手','分担责任','拒绝重负'] },
    { zh: '权杖侍从', en: 'PAGE OF WANDS',      img: '32-pageofwands.jpg',       pos: ['探索热情','好消息降临','创意萌芽'],       rev: ['幼稚冲动','消息延迟','缺乏方向'] },
    { zh: '权杖骑士', en: 'KNIGHT OF WANDS',    img: '33-knightofwands.jpg',     pos: ['冲劲十足','大胆行动','冒险前行'],         rev: ['急躁鲁莽','有始无终','方向混乱'] },
    { zh: '权杖王后', en: 'QUEEN OF WANDS',     img: '34-queenofwands.jpg',      pos: ['温暖自信','独立坚强','魅力感召'],         rev: ['控制欲强','嫉妒猜疑','自信不足'] },
    { zh: '权杖国王', en: 'KING OF WANDS',      img: '35-kingofwands.jpg',       pos: ['远见卓识','领袖风范','果断决策'],         rev: ['专制蛮横','急功近利','缺乏耐心'] },
    // ─── Cups · 圣杯 (14) ───
    { zh: '圣杯王牌', en: 'ACE OF CUPS',        img: '36-aceofcups.jpg',         pos: ['情感新生','爱的涌泉','灵性觉醒'],         rev: ['情感封闭','爱的匮乏','创意枯竭'] },
    { zh: '圣杯二',   en: 'TWO OF CUPS',        img: '37-cups2.jpg',             pos: ['伴侣连结','心灵契合','相互吸引'],         rev: ['关系失衡','沟通不畅','信任缺失'] },
    { zh: '圣杯三',   en: 'THREE OF CUPS',      img: '38-cups3.jpg',             pos: ['欢聚庆祝','友谊共鸣','群体喜悦'],         rev: ['社交疲惫','过度放纵','友谊疏远'] },
    { zh: '圣杯四',   en: 'FOUR OF CUPS',       img: '39-cups4.jpg',             pos: ['情感倦怠','不满现状','冥想内省'],         rev: ['重燃热情','突破停滞','把握机会'] },
    { zh: '圣杯五',   en: 'FIVE OF CUPS',       img: '40-cups5.jpg',             pos: ['悲伤失落','遗憾执念','未见之福'],         rev: ['走出悲伤','接受现实','重新出发'] },
    { zh: '圣杯六',   en: 'SIX OF CUPS',        img: '41-cups6.jpg',             pos: ['童年回忆','怀旧温情','纯真重现'],         rev: ['活在过去','理想化记忆','拒绝成长'] },
    { zh: '圣杯七',   en: 'SEVEN OF CUPS',      img: '42-cups7.jpg',             pos: ['幻想迷惑','选择过多','白日梦境'],         rev: ['回归现实','做出抉择','看清真相'] },
    { zh: '圣杯八',   en: 'EIGHT OF CUPS',      img: '43-cups8.jpg',             pos: ['主动离去','放下执念','寻求更深'],         rev: ['恐惧改变','不舍旧物','漫无目的'] },
    { zh: '圣杯九',   en: 'NINE OF CUPS',       img: '44-cups9.jpg',             pos: ['心愿达成','满足感恩','情感丰盛'],         rev: ['贪婪不足','物质至上','自满傲慢'] },
    { zh: '圣杯十',   en: 'TEN OF CUPS',        img: '45-cups10.jpg',            pos: ['家庭圆满','情感归宿','长久幸福'],         rev: ['家庭失和','理想破灭','价值观冲突'] },
    { zh: '圣杯侍从', en: 'PAGE OF CUPS',       img: '46-pageofcups.jpg',        pos: ['情感萌动','创意灵感','温柔信使'],         rev: ['情感不成熟','过于敏感','逃避现实'] },
    { zh: '圣杯骑士', en: 'KNIGHT OF CUPS',     img: '47-knightofcups.jpg',      pos: ['浪漫追求','理想主义','情感邀约'],         rev: ['情绪化','不切实际','善变轻浮'] },
    { zh: '圣杯王后', en: 'QUEEN OF CUPS',      img: '48-queenofcups.jpg',       pos: ['共情直觉','温柔力量','情感智慧'],         rev: ['情感操控','过度付出','自我牺牲'] },
    { zh: '圣杯国王', en: 'KING OF CUPS',       img: '49-kingofcups.jpg',        pos: ['情感成熟','慷慨包容','沉稳内敛'],         rev: ['情感压抑','冷漠疏离','控制情绪'] },
    // ─── Swords · 宝剑 (14) ───
    { zh: '宝剑王牌', en: 'ACE OF SWORDS',      img: '50-aceofswords.jpg',       pos: ['真相突破','心智清明','正义之剑'],         rev: ['思维混乱','真相扭曲','滥用智力'] },
    { zh: '宝剑二',   en: 'TWO OF SWORDS',      img: '51-swords2.jpg',           pos: ['僵持抉择','内心拉锯','回避真相'],         rev: ['信息过载','犹豫不决','焦虑加重'] },
    { zh: '宝剑三',   en: 'THREE OF SWORDS',    img: '52-swords3.jpg',           pos: ['心碎悲痛','分离之苦','深刻教训'],         rev: ['伤痛愈合','释放悲伤','自我原谅'] },
    { zh: '宝剑四',   en: 'FOUR OF SWORDS',     img: '53-swords4.jpg',           pos: ['休养生息','暂时退隐','恢复能量'],         rev: ['焦躁不安','强行复出','拒绝休息'] },
    { zh: '宝剑五',   en: 'FIVE OF SWORDS',     img: '54-swords5.jpg',           pos: ['不义之胜','冲突残局','自私算计'],         rev: ['化解恩怨','承认错误','重建关系'] },
    { zh: '宝剑六',   en: 'SIX OF SWORDS',      img: '55-swords6.jpg',           pos: ['过渡转变','离开困境','走向平静'],         rev: ['逃避问题','原地踏步','无法放下'] },
    { zh: '宝剑七',   en: 'SEVEN OF SWORDS',    img: '56-swords7.jpg',           pos: ['策略谋划','隐秘行事','独立思考'],         rev: ['自欺欺人','谎言败露','良心不安'] },
    { zh: '宝剑八',   en: 'EIGHT OF SWORDS',    img: '57-swords8.jpg',           pos: ['思维困局','自我束缚','受害者心态'],       rev: ['挣脱枷锁','看到出路','自我解放'] },
    { zh: '宝剑九',   en: 'NINE OF SWORDS',     img: '58-swords9.jpg',           pos: ['焦虑失眠','过度担忧','噩梦缠身'],         rev: ['释放恐惧','曙光初现','最坏已过'] },
    { zh: '宝剑十',   en: 'TEN OF SWORDS',      img: '59-swords10.jpg',          pos: ['彻底终结','触底时刻','背叛之痛'],         rev: ['涅槃重生','最坏已过','缓慢复原'] },
    { zh: '宝剑侍从', en: 'PAGE OF SWORDS',     img: '60-pageofswords.jpg',      pos: ['好奇求知','敏锐观察','直言不讳'],         rev: ['散播流言','冷嘲热讽','思维浅薄'] },
    { zh: '宝剑骑士', en: 'KNIGHT OF SWORDS',   img: '61-knightofswords.jpg',    pos: ['果敢迅猛','言辞犀利','正义冲锋'],         rev: ['急躁冲动','口无遮拦','缺乏同理'] },
    { zh: '宝剑王后', en: 'QUEEN OF SWORDS',    img: '62-queenofswords.jpg',     pos: ['独立清醒','洞察秋毫','冷静判断'],         rev: ['冷酷无情','过度批判','感情压抑'] },
    { zh: '宝剑国王', en: 'KING OF SWORDS',     img: '63-kingofswords.jpg',      pos: ['权威理性','公正严明','智识领袖'],         rev: ['暴政独断','以权谋私','冷酷操控'] },
    // ─── Pentacles · 星币 (14) ───
    { zh: '星币王牌', en: 'ACE OF PENTACLES',   img: '64-aceofpentacles.jpg',    pos: ['物质新机','繁荣种子','脚踏实地'],         rev: ['错失良机','财务延迟','计划落空'] },
    { zh: '星币二',   en: 'TWO OF PENTACLES',   img: '65-pentacles2.jpg',        pos: ['灵活应变','优先取舍','资源调配'],         rev: ['失去平衡','顾此失彼','财务混乱'] },
    { zh: '星币三',   en: 'THREE OF PENTACLES', img: '66-pentacles3.jpg',        pos: ['精益求精','团队协作','技艺精进'],         rev: ['敷衍了事','缺乏协作','质量不佳'] },
    { zh: '星币四',   en: 'FOUR OF PENTACLES',  img: '67-pentacles4.jpg',        pos: ['财务安全','守护资源','稳健保守'],         rev: ['贪婪执著','过度吝啬','控制欲强'] },
    { zh: '星币五',   en: 'FIVE OF PENTACLES',  img: '68-pentacles5.jpg',        pos: ['物质困窘','精神匮乏','被排斥感'],         rev: ['走出困境','获得援助','信心恢复'] },
    { zh: '星币六',   en: 'SIX OF PENTACLES',   img: '69-pentacles6.jpg',        pos: ['慷慨施予','公平交换','财务平衡'],         rev: ['债务纠缠','施舍附条件','财务不均'] },
    { zh: '星币七',   en: 'SEVEN OF PENTACLES', img: '70-pentacles7.jpg',        pos: ['耐心播种','长期投资','静待收获'],         rev: ['急于求成','缺乏耐心','投资失误'] },
    { zh: '星币八',   en: 'EIGHT OF PENTACLES', img: '71-pentacles8.jpg',        pos: ['专注打磨','勤勉学习','匠人精神'],         rev: ['急功近利','缺乏热情','重复劳作'] },
    { zh: '星币九',   en: 'NINE OF PENTACLES',  img: '72-pentacles9.jpg',        pos: ['独立富足','品质生活','自给自足'],         rev: ['过度物质','孤独代价','虚荣浮华'] },
    { zh: '星币十',   en: 'TEN OF PENTACLES',   img: '73-pentacles10.jpg',       pos: ['家族传承','世代积累','物质圆满'],         rev: ['家族纷争','遗产纠葛','财务危机'] },
    { zh: '星币侍从', en: 'PAGE OF PENTACLES',  img: '74-pageofpentacles.jpg',   pos: ['学习新技','务实起步','成长机遇'],         rev: ['缺乏专注','学业受阻','眼高手低'] },
    { zh: '星币骑士', en: 'KNIGHT OF PENTACLES', img: '75-knightofpentacles.jpg', pos: ['稳健前行','尽职尽责','可靠踏实'],        rev: ['固步自封','效率低下','过于保守'] },
    { zh: '星币王后', en: 'QUEEN OF PENTACLES',  img: '76-queenofpentacles.jpg',  pos: ['丰饶滋养','生活智慧','务实关怀'],        rev: ['忽视自我','过度操劳','安全感缺失'] },
    { zh: '星币国王', en: 'KING OF PENTACLES',   img: '77-kingofpentacles.jpg',   pos: ['财富掌控','商业成就','物质大师'],        rev: ['贪婪无度','物质至上','投资失败'] },
  ];

  function pickCard() {
    const rng = crypto.getRandomValues(new Uint32Array(2));
    const c = CARD_POOL[rng[0] % CARD_POOL.length];
    const rev = (rng[1] % 100) < 30;
    const kw  = rev ? (c.rev || c.pos) : c.pos;
    return {
      name:     rev ? `${c.zh}（逆位）· ${c.en} (Rev.)` : `${c.zh} · ${c.en}`,
      img:      c.img,
      keywords: kw.slice(0, 3).join(' · '),
      energy:   rev ? (rng[1] % 25) + 50 : (rng[0] % 25) + 70,
      reversed: rev,
    };
  }

  async function askDeepSeek(userName, question, theme, position, cards) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let resp;
    try {
      resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName,
          question,
          theme,
          position,
          cards,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`API ${resp.status}: ${errText}`);
    }

    return resp.json();
  }

  return { pickCard, askDeepSeek };
})();


/* ─── 6b. Tarot Card Selection + AI Reading ─── */
(function initTarotCards() {
  const cards     = document.querySelectorAll('.tarot-card');
  const hintEl    = document.getElementById('spread-hint');
  const resultSec = document.getElementById('reading-result');
  let drawnCards  = [];
  let isLoading   = false;

  const positions = ['过去', '现在', '未来'];
  const hints = [
    '过去的烛光已经燃起，请抽取代表「现在」的牌…',
    '当下的能量已被感知，请抽取代表「未来」的牌…',
    '未来的星光已经降临，神谕正在显现…',
  ];

  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('selected') || isLoading || drawnCards.length >= 3) return;
      
      const name = document.getElementById('user-name')?.value.trim();
      const question = document.getElementById('user-question')?.value.trim();
      if (!name || !question) {
        const btn = document.getElementById('form-submit-btn');
        if (btn) btn.click();
        return;
      }

      // Draw unique card
      let picked;
      do {
        picked = TAROT_AI.pickCard();
      } while (drawnCards.some(c => c.name === picked.name));
      
      drawnCards.push(picked);

      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      card.style.animation = 'none';

      // Flip card in place (change the background image directly)
      const imgTarget = card.querySelector('.card-back-img');
      const overlay = card.querySelector('.card-back-overlay');
      if (imgTarget) {
         imgTarget.src = `assets/images/cards/${picked.img}`;
         if (picked.reversed) {
           imgTarget.style.transform = 'rotate(180deg)';
           imgTarget.style.filter = 'brightness(0.85) contrast(1.1)';
         }
      }
      if (overlay) overlay.style.display = 'none';

      if (typeof TAROT_AUDIO !== 'undefined') TAROT_AUDIO.playReveal();

      if (hintEl) {
        const span = hintEl.querySelector('span');
        if (span) { span.style.opacity = '0'; setTimeout(() => { span.textContent = hints[drawnCards.length - 1]; span.style.opacity = '1'; span.style.transition = 'opacity 0.4s'; }, 200); }
      }

      if (drawnCards.length === 3) {
        setTimeout(() => invokeReading(drawnCards), 1000);
      }
    });

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  async function invokeReading(drawn) {
    if (!resultSec) return;
    isLoading = true;

    // 读取表单信息
    const userName = document.getElementById('user-name')?.value.trim() || '寻问者';
    const question = document.getElementById('user-question')?.value.trim() || '';
    const theme    = document.getElementById('select-theme')?.value || '';

    // 先展示结构（loading状态）
    showResultShell(drawn);

    try {
      const reading = await TAROT_AI.askDeepSeek(userName, question, theme, '时间之流', drawn);
      fillReadingContent(reading);
      
      // Dispatch event to save history
      document.dispatchEvent(new CustomEvent('tarot-reading-complete', {
        detail: {
          userName,
          spread: '时间之流', // Assuming default spread for now
          theme,
          question,
          card: drawn[1], // fallback for icon
          cards: drawn,
          position: '现在',
          reading,
          energy: Math.floor((drawn[0].energy + drawn[1].energy + drawn[2].energy) / 3)
        }
      }));
    } catch (err) {
      console.error('[DeepSeek Error]', err);
      fillReadingFallback();
    } finally {
      isLoading = false;
    }
  }

  function showResultShell(drawn) {
    // 填写牌名（立即显示）
    document.getElementById('reading-card-name').textContent = drawn.map(c => c.name.split('·')[0].trim()).join(' · ');

    drawn.forEach((c, i) => {
      const imgEl = document.getElementById(`reading-img-${i}`);
      const kwEl = document.getElementById(`reading-kw-${i}`);
      if (imgEl) {
        imgEl.src = `assets/images/cards/${c.img}`;
        if (c.reversed) {
          imgEl.style.transform = 'rotate(180deg)';
          imgEl.style.filter = 'brightness(0.85) contrast(1.1)';
        } else {
          imgEl.style.transform = 'none';
          imgEl.style.filter = 'none';
        }
      }
      if (kwEl) {
        kwEl.textContent = c.keywords;
      }
    });

    // 解读区显示loading骨架
    const loadingHTML = `<span class="ai-loading">
      <span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>
      <em style="font-family:var(--font-italic);color:var(--text-faint);font-size:0.82rem">神谕召唤中，请稍候…</em>
    </span>`;
    ['interp-core-text','interp-advice-text','interp-warning-text'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = loadingHTML;
    });
    const quoteEl = document.getElementById('quote-text');
    if (quoteEl) quoteEl.innerHTML = loadingHTML;

    // 展示结果区
    resultSec.hidden = false;
    resultSec.removeAttribute('hidden');
    setTimeout(() => scrollToEl('reading-result'), 150);
  }

  function fillReadingContent(reading) {
    // 打字机效果逐字渲染
    typeText('interp-core-text',    reading.core    || '');
    typeText('interp-advice-text',  reading.advice  || '', 120);
    typeText('interp-warning-text', reading.warning || '', 240);
    typeText('quote-text',          reading.quote   || '', 360);
  }

  function fillReadingFallback() {
    typeText('interp-core-text',    '星盘的低语此刻无法穿透迷雾，但命运的轨迹依然向你敞开。请再次凝神，将你的意图投入烛火之中。');
    typeText('interp-advice-text',  '保持内心的安静，答案往往藏在你最不经意的瞬间。相信直觉，那是灵魂最诚实的语言。', 120);
    typeText('interp-warning-text', '暂时的静默不代表命运的缺席，只是深渊尚在聆听。', 240);
    typeText('quote-text',          '沉默是宇宙回答之前最深的呼吸。', 360);
  }

  function typeText(id, text, delay = 0) {
    const el = document.getElementById(id);
    if (!el) return;
    setTimeout(() => {
      el.innerHTML = '';
      let i = 0;
      const timer = setInterval(() => {
        const char = text[i] || '';
        if (char === '\n') {
          el.appendChild(document.createElement('br'));
        } else {
          el.appendChild(document.createTextNode(char));
          if (i % 4 === 0 && typeof TAROT_AUDIO !== 'undefined') TAROT_AUDIO.playTick();
        }
        i++;
        if (i >= text.length) clearInterval(timer);
      }, 28);
    }, delay);
  }

  // 重新抽牌
  document.getElementById('reading-retry-btn')?.addEventListener('click', () => {
    if (isLoading) return;
    if (resultSec) { resultSec.hidden = true; resultSec.setAttribute('hidden', ''); }
    selected = null;
    cards.forEach(c => {
      c.classList.remove('selected');
      c.setAttribute('aria-pressed', 'false');
      c.style.animation = '';
    });
    scrollToEl('spread');
  });

  document.getElementById('reading-save-btn')?.addEventListener('click', () => {
    window.print();
  });
})();




/* ─── 7. FAQ Accordion ───────────────────────── */
(function initFAQ() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close all
      items.forEach(it => {
        const b = it.querySelector('.faq-question');
        const a = it.querySelector('.faq-answer');
        if (b && a) {
          b.setAttribute('aria-expanded', 'false');
          a.classList.remove('open');
        }
      });

      // Open clicked if was closed
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        answer.classList.add('open');
      }
    });
  });
})();


/* ─── 8. Form Submit → 引导去选牌 ────────────── */
(function initForm() {
  const form = document.getElementById('oracle-form');
  const btn  = document.getElementById('form-submit-btn');
  if (!form || !btn) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const name     = document.getElementById('user-name')?.value.trim();
    const question = document.getElementById('user-question')?.value.trim();

    // 简单校验：名字必填
    if (!name) { if (typeof TAROT_AUDIO !== 'undefined') TAROT_AUDIO.playError(); shakeRitual('fg-name'); return; }
    if (!question) { if (typeof TAROT_AUDIO !== 'undefined') TAROT_AUDIO.playError(); shakeRitual('fg-question'); return; }

    // 按钮变化 → 引导选牌
    if (typeof TAROT_AUDIO !== 'undefined') TAROT_AUDIO.playSubmit();
    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = `
      <span class="btn-shine"></span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           style="animation:spin 1s linear infinite" aria-hidden="true">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      意图已刻入深渊…`;

    setTimeout(() => {
      btn.innerHTML = `
        <span class="btn-shine"></span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        印记已落定 · 前往抽牌`;
      btn.style.cssText = 'background:linear-gradient(135deg,rgba(201,168,76,0.2),rgba(124,58,237,0.2));border-color:var(--gold-500);color:var(--gold-300)';

      // 让塔罗牌区波动提示
      setTimeout(() => {
        scrollToEl('spread');
        document.querySelectorAll('.tarot-card').forEach((c, i) => {
          setTimeout(() => {
            c.style.boxShadow = '0 0 30px rgba(201,168,76,0.5), 0 0 60px rgba(124,58,237,0.25)';
            setTimeout(() => { c.style.boxShadow = ''; }, 900);
          }, i * 200);
        });
      }, 600);

      // 5秒后重置按钮以允许再次提交
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = `
          <span class="btn-shine"></span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
          </svg>
          重新铭刻意图`;
        btn.style.cssText = '';
      }, 5000);
    }, 1400);
  });

  function shakeRitual(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.animation = 'shake 0.4s cubic-bezier(0.36,0.07,0.19,0.97) both';
    const inp = el.querySelector('.ritual-input');
    if (inp) {
      inp.style.borderBottom = '1px solid #e63946';
      inp.focus();
    }
    setTimeout(() => {
      el.style.animation = '';
      if (inp) inp.style.borderBottom = '';
    }, 600);
  }
})();


/* ─── 9. Card Tilt Effect (desktop only) ─────── */
(function initCardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return; // touch devices skip

  const cards = document.querySelectorAll('.theme-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width  / 2;
      const cy = rect.height / 2;
      const tiltX = (y - cy) / cy * 6;
      const tiltY = (cx - x) / cx * 6;
      card.style.transform = `translateY(-6px) scale(1.02) perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
})();


/* ─── 10. Smooth anchor links ────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id  = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    scrollToEl(id);
  });
});


/* ─── 11. Candle/Glow Cursor (desktop) ─────── */
(function initCursorGlow() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  glow.style.cssText = `
    position: fixed;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: opacity 0.3s;
    mix-blend-mode: screen;
  `;
  document.body.appendChild(glow);

  let mx = -999, my = -999;
  let cx = -999, cy = -999;
  let rafId;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    glow.style.opacity = '1';
  });

  function update() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    glow.style.left = cx + 'px';
    glow.style.top  = cy + 'px';
    rafId = requestAnimationFrame(update);
  }
  update();
})();


/* ─── 12. CSS Keyframes (injected) ──────────── */
(function injectKeyframes() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes shake {
      10%, 90% { transform: translateX(-2px); }
      20%, 80% { transform: translateX(4px); }
      30%, 50%, 70% { transform: translateX(-6px); }
      40%, 60% { transform: translateX(6px); }
    }
    @keyframes cardFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
    @keyframes glowPulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.7; }
    }
    /* AI loading dots */
    .ai-loading {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .ai-dot {
      display: inline-block;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #c9a84c;
      animation: aiDotPulse 1.4s ease-in-out infinite both;
    }
    .ai-dot:nth-child(2) { animation-delay: 0.2s; }
    .ai-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes aiDotPulse {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();


/* ─── 13. Tarot card idle float ──────────────── */
(function initCardFloat() {
  const wraps = document.querySelectorAll('.tarot-card-wrap');
  wraps.forEach((wrap, i) => {
    const card = wrap.querySelector('.tarot-card');
    if (!card) return;
    card.style.animation = `cardFloat ${3.5 + i * 0.4}s ease-in-out ${i * 0.5}s infinite`;

    // Stop floating when selected
    card.addEventListener('click', () => {
      card.style.animation = 'none';
    });
  });
})();


/* ─── 14. Form select theme sync from nav ───── */
(function syncThemeHighlight() {
  const select = document.getElementById('select-theme');
  const cards  = document.querySelectorAll('.theme-card');
  if (!select) return;

  select.addEventListener('change', () => {
    const val = select.value;
    cards.forEach(card => {
      const isMatch = card.dataset.theme === val;
      card.style.borderColor = isMatch ? 'var(--gold-400)' : '';
      card.style.boxShadow   = isMatch ? '0 0 32px var(--gold-glow), var(--shadow-card)' : '';
    });
  });
})();


/* ─── 15. Victorian ornament SVG bg decoration ─ */
(function addSectionOrnaments() {
  const sections = ['.themes-section', '.how-section'];
  sections.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.style.backgroundImage = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cpath d='M40 5L43.5 17H56.5L46.5 24L50 36L40 29L30 36L33.5 24L23.5 17H36.5Z' stroke='%23c9a84c' stroke-opacity='0.035' stroke-width='0.8'/%3E%3C/g%3E%3C/svg%3E")`;
  });
})();

console.log('%c✦ 紫夜魔谕 · ARCANA NOCTIS ✦', 
  'color: #c9a84c; font-family: serif; font-size: 14px; text-shadow: 0 0 10px #7c3aed;');
