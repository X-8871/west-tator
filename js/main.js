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
{ zh: '愚者',    en: 'THE FOOL',          img: '0-thefool.jpg', pos: ['新的开始','天真无畏','冒险精神'] },
    { zh: '魔术师',  en: 'THE MAGICIAN',       img: '1-themagician.jpg', pos: ['意志力','创造力','技艺'] },
    { zh: '女祭司',  en: 'THE HIGH PRIESTESS', img: '2-thehighpriestess.jpg', pos: ['直觉','神秘','内在智慧'] },
    { zh: '女皇',    en: 'THE EMPRESS',        img: '3-theempress.jpg', pos: ['丰盛','创造','母性之力'] },
    { zh: '皇帝',    en: 'THE EMPEROR',        img: '4-theemperor.jpg', pos: ['权威','结构','领导力'] },
    { zh: '教皇',    en: 'THE HIEROPHANT',     img: '5-thehierophant.jpg', pos: ['传统','信仰','精神引导'] },
    { zh: '恋人',    en: 'THE LOVERS',         img: '6-thelovers.jpg', pos: ['结合','选择','灵魂伴侣'] },
    { zh: '战车',    en: 'THE CHARIOT',        img: '7-thechariot.jpg', pos: ['意志','胜利','自律'] },
    { zh: '力量',    en: 'STRENGTH',           img: '8-strength.jpg', pos: ['内在力量','勇气','温柔'] },
    { zh: '隐士',    en: 'THE HERMIT',         img: '9-thehermit.jpg', pos: ['内省','孤独','寻道'] },
    { zh: '命运之轮',en: 'WHEEL OF FORTUNE',   img: '10-fortune.jpg', pos: ['转机','循环','命运'] },
    { zh: '正义',    en: 'JUSTICE',            img: '11-justice.jpg', pos: ['公正','真相','因果'] },
    { zh: '倒吊人',  en: 'THE HANGED MAN',     img: '12-thehangedman.jpg', pos: ['暂停','新视角','牺牲'] },
    { zh: '死神',    en: 'DEATH',              img: '13-death.jpg', pos: ['转化','结束','蜕变'] },
    { zh: '节制',    en: 'TEMPERANCE',         img: '14-temperance.jpg', pos: ['平衡','调和','耐心'] },
    { zh: '恶魔',    en: 'THE DEVIL',          img: '15-thedevil.jpg', pos: ['束缚','诱惑','阴影'] },
    { zh: '塔',      en: 'THE TOWER',          img: '16-thetower.jpg', pos: ['突变','崩塌','觉醒'] },
    { zh: '星星',    en: 'THE STAR',           img: '17-thestar.jpg', pos: ['希望','疗愈','指引'] },
    { zh: '月亮',    en: 'THE MOON',           img: '18-themoon.jpg', pos: ['幻象','潜意识','迷雾'] },
    { zh: '太阳',    en: 'THE SUN',            img: '19-thesun.jpg', pos: ['喜悦','成功','活力'] },
    { zh: '审判',    en: 'JUDGEMENT',          img: '20-judgement.jpg', pos: ['重生','召唤','领悟'] },
    { zh: '世界',    en: 'THE WORLD',          img: '21-theworld.jpg', pos: ['圆满','整合','旅程终点'] },
    { zh: '权杖王牌', en: 'ACE OF WANDS', img: '22-aceofwands.jpg', pos: ['新的开始', '行动', '热情'] },
    { zh: '权杖二', en: 'TWO OF WANDS', img: '23-wands2.jpg', pos: ['平衡与选择', '行动', '热情'] },
    { zh: '权杖三', en: 'THREE OF WANDS', img: '24-wands3.jpg', pos: ['合作与成长', '行动', '热情'] },
    { zh: '权杖四', en: 'FOUR OF WANDS', img: '25-wands4.jpg', pos: ['稳定与休息', '行动', '热情'] },
    { zh: '权杖五', en: 'FIVE OF WANDS', img: '26-wands5.jpg', pos: ['冲突与损失', '行动', '热情'] },
    { zh: '权杖六', en: 'SIX OF WANDS', img: '27-wands6.jpg', pos: ['过渡与胜利', '行动', '热情'] },
    { zh: '权杖七', en: 'SEVEN OF WANDS', img: '28-wands7.jpg', pos: ['防御与坚持', '行动', '热情'] },
    { zh: '权杖八', en: 'EIGHT OF WANDS', img: '29-wands8.jpg', pos: ['快速与行动', '行动', '热情'] },
    { zh: '权杖九', en: 'NINE OF WANDS', img: '30-wands9.jpg', pos: ['满足与焦虑', '行动', '热情'] },
    { zh: '权杖十', en: 'TEN OF WANDS', img: '31-wands10.jpg', pos: ['完成与重负', '行动', '热情'] },
    { zh: '权杖侍从', en: 'PAGE OF WANDS', img: '32-pageofwands.jpg', pos: ['消息与探索', '行动', '热情'] },
    { zh: '权杖骑士', en: 'KNIGHT OF WANDS', img: '33-knightofwands.jpg', pos: ['行动与冲动', '行动', '热情'] },
    { zh: '权杖王后', en: 'QUEEN OF WANDS', img: '34-queenofwands.jpg', pos: ['滋养与直觉', '行动', '热情'] },
    { zh: '权杖国王', en: 'KING OF WANDS', img: '35-kingofwands.jpg', pos: ['掌控与权威', '行动', '热情'] },
    { zh: '圣杯王牌', en: 'ACE OF CUPS', img: '36-aceofcups.jpg', pos: ['新的开始', '情感', '直觉'] },
    { zh: '圣杯二', en: 'TWO OF CUPS', img: '37-cups2.jpg', pos: ['平衡与选择', '情感', '直觉'] },
    { zh: '圣杯三', en: 'THREE OF CUPS', img: '38-cups3.jpg', pos: ['合作与成长', '情感', '直觉'] },
    { zh: '圣杯四', en: 'FOUR OF CUPS', img: '39-cups4.jpg', pos: ['稳定与休息', '情感', '直觉'] },
    { zh: '圣杯五', en: 'FIVE OF CUPS', img: '40-cups5.jpg', pos: ['冲突与损失', '情感', '直觉'] },
    { zh: '圣杯六', en: 'SIX OF CUPS', img: '41-cups6.jpg', pos: ['过渡与胜利', '情感', '直觉'] },
    { zh: '圣杯七', en: 'SEVEN OF CUPS', img: '42-cups7.jpg', pos: ['防御与坚持', '情感', '直觉'] },
    { zh: '圣杯八', en: 'EIGHT OF CUPS', img: '43-cups8.jpg', pos: ['快速与行动', '情感', '直觉'] },
    { zh: '圣杯九', en: 'NINE OF CUPS', img: '44-cups9.jpg', pos: ['满足与焦虑', '情感', '直觉'] },
    { zh: '圣杯十', en: 'TEN OF CUPS', img: '45-cups10.jpg', pos: ['完成与重负', '情感', '直觉'] },
    { zh: '圣杯侍从', en: 'PAGE OF CUPS', img: '46-pageofcups.jpg', pos: ['消息与探索', '情感', '直觉'] },
    { zh: '圣杯骑士', en: 'KNIGHT OF CUPS', img: '47-knightofcups.jpg', pos: ['行动与冲动', '情感', '直觉'] },
    { zh: '圣杯王后', en: 'QUEEN OF CUPS', img: '48-queenofcups.jpg', pos: ['滋养与直觉', '情感', '直觉'] },
    { zh: '圣杯国王', en: 'KING OF CUPS', img: '49-kingofcups.jpg', pos: ['掌控与权威', '情感', '直觉'] },
    { zh: '宝剑王牌', en: 'ACE OF SWORDS', img: '50-aceofswords.jpg', pos: ['新的开始', '思想', '冲突'] },
    { zh: '宝剑二', en: 'TWO OF SWORDS', img: '51-swords2.jpg', pos: ['平衡与选择', '思想', '冲突'] },
    { zh: '宝剑三', en: 'THREE OF SWORDS', img: '52-swords3.jpg', pos: ['合作与成长', '思想', '冲突'] },
    { zh: '宝剑四', en: 'FOUR OF SWORDS', img: '53-swords4.jpg', pos: ['稳定与休息', '思想', '冲突'] },
    { zh: '宝剑五', en: 'FIVE OF SWORDS', img: '54-swords5.jpg', pos: ['冲突与损失', '思想', '冲突'] },
    { zh: '宝剑六', en: 'SIX OF SWORDS', img: '55-swords6.jpg', pos: ['过渡与胜利', '思想', '冲突'] },
    { zh: '宝剑七', en: 'SEVEN OF SWORDS', img: '56-swords7.jpg', pos: ['防御与坚持', '思想', '冲突'] },
    { zh: '宝剑八', en: 'EIGHT OF SWORDS', img: '57-swords8.jpg', pos: ['快速与行动', '思想', '冲突'] },
    { zh: '宝剑九', en: 'NINE OF SWORDS', img: '58-swords9.jpg', pos: ['满足与焦虑', '思想', '冲突'] },
    { zh: '宝剑十', en: 'TEN OF SWORDS', img: '59-swords10.jpg', pos: ['完成与重负', '思想', '冲突'] },
    { zh: '宝剑侍从', en: 'PAGE OF SWORDS', img: '60-pageofswords.jpg', pos: ['消息与探索', '思想', '冲突'] },
    { zh: '宝剑骑士', en: 'KNIGHT OF SWORDS', img: '61-knightofswords.jpg', pos: ['行动与冲动', '思想', '冲突'] },
    { zh: '宝剑王后', en: 'QUEEN OF SWORDS', img: '62-queenofswords.jpg', pos: ['滋养与直觉', '思想', '冲突'] },
    { zh: '宝剑国王', en: 'KING OF SWORDS', img: '63-kingofswords.jpg', pos: ['掌控与权威', '思想', '冲突'] },
    { zh: '星币王牌', en: 'ACE OF PENTACLES', img: '64-aceofpentacles.jpg', pos: ['新的开始', '物质', '财富'] },
    { zh: '星币二', en: 'TWO OF PENTACLES', img: '65-pentacles2.jpg', pos: ['平衡与选择', '物质', '财富'] },
    { zh: '星币三', en: 'THREE OF PENTACLES', img: '66-pentacles3.jpg', pos: ['合作与成长', '物质', '财富'] },
    { zh: '星币四', en: 'FOUR OF PENTACLES', img: '67-pentacles4.jpg', pos: ['稳定与休息', '物质', '财富'] },
    { zh: '星币五', en: 'FIVE OF PENTACLES', img: '68-pentacles5.jpg', pos: ['冲突与损失', '物质', '财富'] },
    { zh: '星币六', en: 'SIX OF PENTACLES', img: '69-pentacles6.jpg', pos: ['过渡与胜利', '物质', '财富'] },
    { zh: '星币七', en: 'SEVEN OF PENTACLES', img: '70-pentacles7.jpg', pos: ['防御与坚持', '物质', '财富'] },
    { zh: '星币八', en: 'EIGHT OF PENTACLES', img: '71-pentacles8.jpg', pos: ['快速与行动', '物质', '财富'] },
    { zh: '星币九', en: 'NINE OF PENTACLES', img: '72-pentacles9.jpg', pos: ['满足与焦虑', '物质', '财富'] },
    { zh: '星币十', en: 'TEN OF PENTACLES', img: '73-pentacles10.jpg', pos: ['完成与重负', '物质', '财富'] },
    { zh: '星币侍从', en: 'PAGE OF PENTACLES', img: '74-pageofpentacles.jpg', pos: ['消息与探索', '物质', '财富'] },
    { zh: '星币骑士', en: 'KNIGHT OF PENTACLES', img: '75-knightofpentacles.jpg', pos: ['行动与冲动', '物质', '财富'] },
    { zh: '星币王后', en: 'QUEEN OF PENTACLES', img: '76-queenofpentacles.jpg', pos: ['滋养与直觉', '物质', '财富'] },
    { zh: '星币国王', en: 'KING OF PENTACLES', img: '77-kingofpentacles.jpg', pos: ['掌控与权威', '物质', '财富'] },
  ];

  function pickCard() {
    const c = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
    const rev = Math.random() < 0.3;
    const kw  = c.pos.slice(0, 3);
    return {
      name:     rev ? `${c.zh}（逆位）· ${c.en} (Rev.)` : `${c.zh} · ${c.en}`,
      keywords: kw.join(' · '),
      energy:   rev ? Math.floor(Math.random() * 25 + 50) : Math.floor(Math.random() * 25 + 70),
      reversed: rev,
    };
  }

  async function askDeepSeek(userName, question, theme, position, card) {
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
          card,
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
  let selected    = null;
  let isLoading   = false;

  const positions = ['过去', '现在', '未来'];
  const hints = [
    '过去的烛光已经燃起，神谕正在凝聚…',
    '当下的能量已被感知，深渊开始回应…',
    '未来的星光已经降临，命运低语传来…',
  ];

  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      if (selected === card || isLoading) return;
      
      const name = document.getElementById('user-name')?.value.trim();
      const question = document.getElementById('user-question')?.value.trim();
      if (!name || !question) {
        const btn = document.getElementById('form-submit-btn');
        if (btn) btn.click();
        return;
      }
      
      cards.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
        c.style.animation = `cardFloat ${3.5 + Array.from(cards).indexOf(c) * 0.4}s ease-in-out infinite`;
      });
      selected = card;
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      card.style.animation = 'none';

      if (hintEl) {
        const span = hintEl.querySelector('span');
        if (span) { span.style.opacity = '0'; setTimeout(() => { span.textContent = hints[i]; span.style.opacity = '1'; span.style.transition = 'opacity 0.4s'; }, 200); }
      }

      setTimeout(() => invokeReading(positions[i]), 600);
    });

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  async function invokeReading(position) {
    if (!resultSec) return;
    isLoading = true;

    // 读取表单信息
    const userName = document.getElementById('user-name')?.value.trim() || '寻问者';
    const question = document.getElementById('user-question')?.value.trim() || '';
    const theme    = document.getElementById('select-theme')?.value || '';

    // 随机抽牌
    const card = TAROT_AI.pickCard();

    // 先展示结构（loading状态）
    showResultShell(card, position);

    try {
      const reading = await TAROT_AI.askDeepSeek(userName, question, theme, position, card);
      fillReadingContent(reading, card.energy);
    } catch (err) {
      console.error('[DeepSeek Error]', err);
      fillReadingFallback();
    } finally {
      isLoading = false;
    }
  }

  function showResultShell(card, position) {
    // 填写牌名、位置、关键词（立即显示）
    document.getElementById('reading-card-name').textContent = card.name;
    document.getElementById('reading-position').textContent = position;
    document.getElementById('reading-kw-text').textContent  = card.keywords;

    // 能量条动画
    const fill = document.getElementById('energy-fill');
    const val  = document.getElementById('energy-val');
    if (fill) { fill.style.width = '0%'; setTimeout(() => { fill.style.width = card.energy + '%'; }, 300); }
    if (val)  val.textContent = card.energy + '%';

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

    // 牌图动画与图片替换
    const img = document.getElementById('reading-card-img');
    const flipper = document.getElementById('reading-flipper');
    if (img && flipper) { 
      // 恢复翻牌前状态
      flipper.classList.remove('flipped');
      img.style.transform = 'none';
      img.style.filter = 'none';
      
      // 稍微延迟以触发CSS动画
      setTimeout(() => {
        img.src = `assets/images/cards/${card.img}`;
        
        if (card.reversed) {
          img.style.transform = 'rotate(180deg)';
          // 逆位保留一点暗色调滤镜，更有感觉
          img.style.filter = 'brightness(0.85) contrast(1.1)';
        }
        
        // 执行 3D 翻转
        flipper.classList.add('flipped');
      }, 100);
    }

    // 展示结果区
    resultSec.hidden = false;
    resultSec.removeAttribute('hidden');
    setTimeout(() => scrollToEl('reading-result'), 150);
  }

  function fillReadingContent(reading, energy) {
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
    if (!name) { shakeRitual('fg-name'); return; }
    if (!question) { shakeRitual('fg-question'); return; }

    // 按钮变化 → 引导选牌
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
