/* ============================
   紫夜魔谕 · History Engine
   Local Storage & Drawer UI (Per-user Profiles)
   ============================ */

'use strict';

window.TAROT_HISTORY = (() => {
  const STORAGE_KEY = 'tarot_history_v2';
  const MAX_HISTORY = 50;

  // State: allData maps userName to { readings: [], stats: {} }
  let allData = {};
  let currentUser = null; // Currently selected user in drawer
  let drawerEl = null;
  let isOpen = false;

  // Initialization
  function init() {
    migrateOldData();
    loadData();
    injectUI();
    document.addEventListener('tarot-reading-complete', (e) => {
      saveReading(e.detail);
    });
  }

  // Data Layer
  function migrateOldData() {
    try {
      const oldRaw = localStorage.getItem('tarot_history');
      if (oldRaw) {
        const oldData = JSON.parse(oldRaw);
        if (oldData.readings && oldData.readings.length > 0) {
          // Wrap old data under '未知寻问者'
          const newData = { '未知寻问者': oldData };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        }
        localStorage.removeItem('tarot_history');
      }
    } catch (e) {}
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        allData = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[History] Failed to parse local storage', e);
      allData = {};
    }
    const users = Object.keys(allData);
    if (users.length > 0) {
      currentUser = users[0];
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      renderUserSelect();
      renderHistoryList();
      renderStats();
    } catch (e) {
      console.warn('[History] Failed to save local storage', e);
    }
  }

  function saveReading(readingInfo) {
    const userName = readingInfo.userName || '未知寻问者';
    if (!allData[userName]) {
      allData[userName] = { readings: [], stats: { totalReadings: 0 } };
    }
    const userState = allData[userName];
    
    const entry = {
      id: 'r_' + Date.now() + '_' + Math.floor(Math.random()*1000),
      timestamp: new Date().toISOString(),
      ...readingInfo
    };
    userState.readings.unshift(entry);
    if (userState.readings.length > MAX_HISTORY) {
      userState.readings.pop();
    }
    userState.stats.totalReadings++;
    userState.stats.lastVisit = entry.timestamp;
    currentUser = userName; // Auto switch drawer view
    saveData();
  }

  function getRepeatedCards(userName) {
    const nameToUse = userName || currentUser;
    if (!nameToUse || !allData[nameToUse]) return [];
    
    const counts = {};
    allData[nameToUse].readings.forEach(r => {
      if (!r.card || !r.card.name) return;
      const baseName = r.card.name.split('（逆位）')[0].trim();
      counts[baseName] = (counts[baseName] || 0) + 1;
    });
    return Object.entries(counts).filter(([_, c]) => c >= 3).map(([n, c]) => ({ name: n, count: c }));
  }

  function clearCurrentUser() {
    if (!currentUser) return;
    if (confirm(\`是否确定清空【\${currentUser}】的所有命运档案？无法撤销。\`)) {
      delete allData[currentUser];
      const users = Object.keys(allData);
      currentUser = users.length > 0 ? users[0] : null;
      saveData();
    }
  }

  // UI Injection
  function injectUI() {
    const nav = document.querySelector('.nav-inner');
    const cta = document.getElementById('nav-cta');
    if (nav && cta) {
      const btn = document.createElement('button');
      btn.className = 'history-toggle';
      btn.id = 'history-toggle';
      btn.setAttribute('aria-label', '命运档案');
      btn.title = '命运档案';
      btn.innerHTML = \`
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>\`;
      btn.addEventListener('click', toggleDrawer);
      nav.insertBefore(btn, cta);
    }

    drawerEl = document.createElement('div');
    drawerEl.className = 'history-drawer';
    drawerEl.innerHTML = \`
      <div class="history-drawer-overlay"></div>
      <div class="history-drawer-panel">
        <div class="history-header">
          <div class="history-title-group">
            <h2>命运档案</h2>
            <select id="history-user-select" class="history-user-select" aria-label="选择占卜者"></select>
          </div>
          <button class="history-close" aria-label="关闭">&times;</button>
        </div>
        <div class="history-stats">
          <div class="stat-item"><span class="stat-value" id="stat-total">0</span><span class="stat-label">次占卜</span></div>
          <div class="stat-item"><span class="stat-value" id="stat-element">-</span><span class="stat-label">元素偏好</span></div>
        </div>
        <div class="history-list" id="history-list"></div>
        <div class="history-footer">
          <button class="history-clear-btn" id="history-clear-btn">清空当前角色记忆</button>
        </div>
      </div>
    \`;
    document.body.appendChild(drawerEl);

    drawerEl.querySelector('.history-close').addEventListener('click', toggleDrawer);
    drawerEl.querySelector('.history-drawer-overlay').addEventListener('click', toggleDrawer);
    drawerEl.querySelector('#history-clear-btn').addEventListener('click', clearCurrentUser);
    drawerEl.querySelector('#history-user-select').addEventListener('change', (e) => {
      currentUser = e.target.value;
      renderHistoryList();
      renderStats();
    });

    const style = document.createElement('style');
    style.textContent = \`
      .history-toggle {
        background: none; border: 1px solid rgba(201,168,76,0.2); border-radius: 8px;
        padding: 6px 8px; cursor: pointer; color: var(--gold-400, #c9a84c);
        transition: all 0.3s ease; display: flex; align-items: center; justify-content: center;
        margin-right: 12px; flex-shrink: 0;
      }
      .history-toggle:hover { border-color: var(--gold-400); background: rgba(201,168,76,0.08); box-shadow: 0 0 12px rgba(201,168,76,0.15); }
      
      .history-drawer { position: fixed; inset: 0; z-index: 1000; pointer-events: none; opacity: 0; transition: opacity 0.3s ease; display: flex; justify-content: flex-end; }
      .history-drawer.is-open { pointer-events: auto; opacity: 1; }
      
      .history-drawer-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
      
      .history-drawer-panel {
        position: relative; width: 100%; max-width: 400px; height: 100%;
        background: rgba(13,0,16,0.95); border-left: 1px solid rgba(201,168,76,0.3);
        box-shadow: -10px 0 30px rgba(0,0,0,0.8);
        transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex; flex-direction: column;
      }
      .history-drawer.is-open .history-drawer-panel { transform: translateX(0); }
      
      .history-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid rgba(201,168,76,0.1); }
      .history-title-group { display: flex; flex-direction: column; gap: 4px; }
      .history-header h2 { margin: 0; color: var(--gold-400); font-family: 'Cinzel', serif; font-size: 1.2rem; }
      .history-user-select { background: rgba(201,168,76,0.1); color: #fff; border: 1px solid rgba(201,168,76,0.3); border-radius: 4px; padding: 4px 8px; font-size: 0.85rem; outline: none; cursor: pointer; }
      .history-user-select:focus { border-color: var(--gold-400); }
      .history-user-select option { background: #1a1a1a; color: #fff; }
      
      .history-close { background: none; border: none; color: #aaa; font-size: 1.5rem; cursor: pointer; padding: 0 10px; }
      .history-close:hover { color: #fff; }
      
      .history-stats { display: flex; padding: 20px; gap: 20px; border-bottom: 1px solid rgba(201,168,76,0.1); }
      .stat-item { display: flex; flex-direction: column; }
      .stat-value { font-size: 1.5rem; color: var(--gold-300); font-family: 'Cinzel', serif; }
      .stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-top: 4px; }
      
      .history-list { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; scrollbar-width: thin; scrollbar-color: rgba(201,168,76,0.3) transparent; }
      .history-list::-webkit-scrollbar { width: 6px; }
      .history-list::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 3px; }
      
      .history-item {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
        border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;
      }
      .history-item:hover { border-color: rgba(201,168,76,0.3); background: rgba(255,255,255,0.05); }
      .history-item-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
      .history-item-title { color: var(--gold-400); font-size: 0.95rem; font-weight: bold; }
      .history-item-time { color: rgba(255,255,255,0.4); font-size: 0.75rem; }
      .history-item-meta { font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 8px; }
      .history-item-content { font-size: 0.85rem; color: rgba(255,255,255,0.8); line-height: 1.5; display: none; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; }
      .history-item.is-expanded .history-item-content { display: block; }
      
      .history-footer { padding: 20px; border-top: 1px solid rgba(201,168,76,0.1); text-align: center; }
      .history-clear-btn { background: none; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.6); padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
      .history-clear-btn:hover { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,0.1); }
      
      @media (max-width: 768px) {
        .history-toggle { position: fixed; bottom: 135px; left: 20px; z-index: 999; background: rgba(13,0,16,0.85); backdrop-filter: blur(8px); border-radius: 50%; padding: 10px 12px; }
      }
    \`;
    document.head.appendChild(style);

    renderUserSelect();
    renderStats();
    renderHistoryList();
  }

  function toggleDrawer() {
    isOpen = !isOpen;
    if (drawerEl) {
      if (isOpen) {
        renderUserSelect();
        renderHistoryList();
      }
      drawerEl.classList.toggle('is-open', isOpen);
    }
  }

  function getRelativeTime(d) {
    const rtf = new Intl.RelativeTimeFormat('zh', { numeric: 'auto' });
    const diffDays = Math.round((d.getTime() - Date.now()) / 86400000);
    if (diffDays === 0) {
      const diffHours = Math.round((d.getTime() - Date.now()) / 3600000);
      if (diffHours === 0) return '刚刚';
      return rtf.format(diffHours, 'hour');
    }
    if (diffDays > -7) return rtf.format(diffDays, 'day');
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }

  function analyzeElements(readings) {
    if (!readings || readings.length === 0) return '-';
    const counts = { W:0, C:0, S:0, P:0, M:0 };
    readings.forEach(r => {
      const n = r.card?.name || '';
      if (n.includes('权杖') || n.includes('WANDS')) counts.W++;
      else if (n.includes('圣杯') || n.includes('CUPS')) counts.C++;
      else if (n.includes('宝剑') || n.includes('SWORDS')) counts.S++;
      else if (n.includes('星币') || n.includes('PENTACLES')) counts.P++;
      else counts.M++;
    });
    const max = Object.entries(counts).reduce((a,b) => a[1] > b[1] ? a : b);
    if (max[1] === 0) return '均衡';
    const names = { W:'火', C:'水', S:'风', P:'土', M:'灵' };
    return names[max[0]] + '系主导';
  }

  function renderUserSelect() {
    const select = document.getElementById('history-user-select');
    if (!select) return;
    const users = Object.keys(allData);
    if (users.length === 0) {
      select.innerHTML = '<option value="">(无存档)</option>';
      select.style.display = 'none';
      return;
    }
    select.style.display = 'block';
    select.innerHTML = users.map(u => \`<option value="\${u}">\${u} 的存档</option>\`).join('');
    if (currentUser && users.includes(currentUser)) {
      select.value = currentUser;
    } else {
      currentUser = users[0];
      select.value = currentUser;
    }
  }

  function renderStats() {
    const st = document.getElementById('stat-total');
    const el = document.getElementById('stat-element');
    const clearBtn = document.getElementById('history-clear-btn');
    
    if (!currentUser || !allData[currentUser]) {
      if (st) st.textContent = '0';
      if (el) el.textContent = '-';
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }
    
    if (clearBtn) clearBtn.style.display = 'inline-block';
    if (st) st.textContent = allData[currentUser].stats.totalReadings;
    if (el) el.textContent = analyzeElements(allData[currentUser].readings);
  }

  function renderHistoryList() {
    const list = document.getElementById('history-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (!currentUser || !allData[currentUser] || allData[currentUser].readings.length === 0) {
      list.innerHTML = '<div style="text-align:center; color:rgba(255,255,255,0.3); padding: 40px 0;">该寻问者的长廊空空如也</div>';
      return;
    }

    allData[currentUser].readings.forEach(r => {
      const d = new Date(r.timestamp);
      const item = document.createElement('div');
      item.className = 'history-item';
      
      const themeMap = { love:'感情', career:'事业', wealth:'财富', future:'未来', growth:'成长', decision:'抉择' };
      const themeTxt = themeMap[r.theme] || '综合';
      
      item.innerHTML = \`
        <div class="history-item-header">
          <div class="history-item-title">\${r.card?.name || '未知牌'}</div>
          <div class="history-item-time">\${getRelativeTime(d)}</div>
        </div>
        <div class="history-item-meta">
          <span>\${themeTxt}</span> | <span>\${r.position}</span>
        </div>
        <div class="history-item-content">
          \${r.question ? '<p style="color:rgba(255,255,255,0.5); font-style:italic; margin-bottom:10px;">"' + r.question + '"</p>' : ''}
          <p><strong style="color:var(--gold-400)">核心：</strong>\${r.reading?.core || ''}</p>
          <p><strong style="color:var(--gold-400)">建议：</strong>\${r.reading?.advice || ''}</p>
          <p><strong style="color:var(--purple-400, #a78bfa)">指引：</strong>\${r.reading?.quote || ''}</p>
        </div>
      \`;
      item.addEventListener('click', () => {
        item.classList.toggle('is-expanded');
      });
      list.appendChild(item);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    save: saveReading,
    getAll: (user) => allData[user || currentUser]?.readings || [],
    getStats: (user) => allData[user || currentUser]?.stats || null,
    getRepeatedCards,
    clearCurrentUser,
    toggleDrawer
  };
})();
