/* ══ Frutiger Aero Sticker Studio — Phase 10 management panel ══ */
(function () {
  const LAYOUT_KEY = 'aquablog-sticker-layout-v2';
  const CUSTOM_KEY = 'aquablog-custom-stickers-v1';
  const stickersLayer = document.querySelector('.floating-stickers');
  if (!stickersLayer) return;

  let stickers = [];
  let selectedSticker = null;
  let dragState = null;
  let editMode = true;

  const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || ''); } catch (_) { return fallback; }
  };
  const readLayout = () => readJSON(LAYOUT_KEY, {});
  function saveLayout() {
    const layout = {};
    stickers.forEach(sticker => {
      const rect = sticker.getBoundingClientRect();
      layout[sticker.dataset.stickerId] = {
        x: Math.round(rect.left), y: Math.round(rect.top),
        width: Math.round(rect.width), opacity: sticker.style.opacity || '',
        hidden: sticker.dataset.hidden === 'true', tab: sticker.dataset.showOn || 'all'
      };
    });
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch (_) {}
  }
  function saveCustomStickers() {
    const custom = stickers.filter(s => s.dataset.customSticker === 'true').map(s => ({
      src: s.getAttribute('src'), label: s.dataset.label || '自定义贴纸', id: s.dataset.stickerId,
      width: s.style.width || '', opacity: s.style.opacity || '', showOn: s.dataset.showOn || 'all'
    }));
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom)); } catch (_) {}
  }
  function applySavedLayout() {
    const layout = readLayout();
    stickers.forEach(sticker => {
      const saved = layout[sticker.dataset.stickerId];
      if (!saved) return;
      if (Number.isFinite(saved.x)) { sticker.style.left = `${saved.x}px`; sticker.style.right = 'auto'; }
      if (Number.isFinite(saved.y)) { sticker.style.top = `${saved.y}px`; sticker.style.bottom = 'auto'; }
      if (saved.width) sticker.style.width = `${saved.width}px`;
      if (saved.opacity !== undefined && saved.opacity !== '') sticker.style.opacity = saved.opacity;
      sticker.dataset.hidden = String(!!saved.hidden);
      sticker.dataset.showOn = saved.tab || 'all';
    });
  }
  function currentTab() {
    return document.querySelector('.nav-tab.active')?.dataset.tab || 'blog';
  }
  function applyTabVisibility() {
    const tab = currentTab();
    stickers.forEach(sticker => {
      const hidden = sticker.dataset.hidden === 'true';
      const showOn = sticker.dataset.showOn || 'all';
      sticker.style.display = hidden || (showOn !== 'all' && showOn !== tab) ? 'none' : '';
    });
  }
  function selectSticker(sticker) {
    if (!sticker) return;
    selectedSticker = sticker;
    stickers.forEach(item => item.classList.toggle('is-selected', item === sticker));
    const label = document.getElementById('sticker-selected-label');
    if (label) label.textContent = sticker.dataset.label || sticker.alt || '贴纸已选中';
    const opacity = document.getElementById('sticker-opacity');
    if (opacity) opacity.value = sticker.style.opacity || '1';
    const tab = document.getElementById('sticker-tab-select');
    if (tab) tab.value = sticker.dataset.showOn || 'all';
    const visible = document.getElementById('sticker-visible-toggle');
    if (visible) visible.textContent = sticker.dataset.hidden === 'true' ? '显示贴纸' : '隐藏贴纸';
  }
  function setEditMode(enabled) {
    editMode = enabled;
    document.body.classList.toggle('sticker-edit-mode', enabled);
    const toggle = document.getElementById('sticker-edit-toggle');
    if (toggle) {
      toggle.textContent = enabled ? '✓ 编辑贴纸' : '✦ 编辑贴纸';
      toggle.setAttribute('aria-pressed', String(enabled));
    }
    stickers.forEach(sticker => sticker.tabIndex = enabled ? 0 : -1);
  }
  function bindSticker(sticker, index) {
    sticker.dataset.stickerId = sticker.dataset.stickerId || `sticker-${index + 1}`;
    sticker.dataset.showOn = sticker.dataset.showOn || 'all';
    sticker.draggable = false;
    sticker.addEventListener('pointerdown', event => {
      if (!editMode || event.button !== 0 || sticker.style.display === 'none') return;
      event.preventDefault();
      selectSticker(sticker);
      const rect = sticker.getBoundingClientRect();
      sticker.style.left = `${rect.left}px`; sticker.style.top = `${rect.top}px`;
      sticker.style.right = 'auto'; sticker.style.bottom = 'auto';
      sticker.classList.add('is-dragging');
      try { sticker.setPointerCapture(event.pointerId); } catch (_) {}
      dragState = { sticker, pointerId: event.pointerId, dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    });
    sticker.addEventListener('pointermove', event => {
      if (!dragState || dragState.sticker !== sticker || dragState.pointerId !== event.pointerId) return;
      const maxX = Math.max(0, window.innerWidth - sticker.offsetWidth);
      const maxY = Math.max(0, window.innerHeight - sticker.offsetHeight);
      sticker.style.left = `${Math.min(maxX, Math.max(0, event.clientX - dragState.dx))}px`;
      sticker.style.top = `${Math.min(maxY, Math.max(0, event.clientY - dragState.dy))}px`;
    });
    function finishDrag(event) {
      if (!dragState || dragState.sticker !== sticker || dragState.pointerId !== event.pointerId) return;
      sticker.classList.remove('is-dragging'); dragState = null; saveLayout();
    }
    sticker.addEventListener('pointerup', finishDrag);
    sticker.addEventListener('pointercancel', finishDrag);
    sticker.addEventListener('focus', () => selectSticker(sticker));
    sticker.addEventListener('keydown', event => {
      if (!editMode) return;
      const step = event.shiftKey ? 10 : 2;
      const rect = sticker.getBoundingClientRect(); let x = rect.left, y = rect.top;
      if (event.key === 'ArrowLeft') x -= step;
      else if (event.key === 'ArrowRight') x += step;
      else if (event.key === 'ArrowUp') y -= step;
      else if (event.key === 'ArrowDown') y += step;
      else return;
      event.preventDefault();
      sticker.style.left = `${Math.max(0, Math.min(window.innerWidth - rect.width, x))}px`;
      sticker.style.top = `${Math.max(0, Math.min(window.innerHeight - rect.height, y))}px`;
      sticker.style.right = 'auto'; sticker.style.bottom = 'auto'; saveLayout();
    });
  }

  // Restore any custom stickers added in this browser.
  const savedCustom = readJSON(CUSTOM_KEY, []);
  if (Array.isArray(savedCustom)) savedCustom.forEach(item => {
    if (!item || !item.src || !/^https?:\/\//i.test(item.src) && !/^(\.\/)?stickers\//i.test(item.src)) return;
    const img = document.createElement('img');
    img.src = item.src; img.alt = ''; img.className = 'floating-sticker custom-floating-sticker';
    img.dataset.customSticker = 'true'; img.dataset.label = item.label || '自定义贴纸';
    img.dataset.stickerId = item.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (item.width) img.style.width = item.width;
    if (item.opacity) img.style.opacity = item.opacity;
    if (item.showOn) img.dataset.showOn = item.showOn;
    img.draggable = false; stickersLayer.appendChild(img);
  });

  stickers = Array.from(document.querySelectorAll('.floating-sticker'));
  stickers.forEach(bindSticker);

  const toolbar = document.createElement('section');
  toolbar.className = 'sticker-studio';
  toolbar.setAttribute('aria-label', '贴纸管理面板');
  toolbar.innerHTML = `
    <div class="sticker-studio-bar">
      <button type="button" id="sticker-panel-toggle" aria-expanded="false">✧ 贴纸管理</button>
      <span id="sticker-selected-label">选择一张贴纸</span>
      <button type="button" id="sticker-edit-toggle" aria-pressed="true">✓ 编辑</button>
      <button type="button" id="sticker-reset" title="恢复默认位置和大小">重置</button>
    </div>
    <div class="sticker-studio-panel" id="sticker-studio-panel" hidden>
      <div class="sticker-control-row">
        <span>贴纸大小</span><button type="button" id="sticker-smaller" aria-label="缩小贴纸">A−</button><button type="button" id="sticker-larger" aria-label="放大贴纸">A＋</button>
        <label for="sticker-opacity">透明度</label><input id="sticker-opacity" type="range" min="0.15" max="1" step="0.05" value="1">
        <button type="button" id="sticker-visible-toggle">隐藏贴纸</button>
      </div>
      <div class="sticker-scene-presets">
        <strong>场景布局</strong>
        <button type="button" data-sticker-preset="aqua">💧 Aqua</button>
        <button type="button" data-sticker-preset="y2k">💿 Y2K</button>
        <button type="button" data-sticker-preset="minimal">☁ 清爽</button>
      </div>
      <div class="sticker-library-row">
        <label for="sticker-library-select">快速素材库</label>
        <select id="sticker-library-select">
          <option value="">选择一款贴纸…</option>
          <option value="stickers/Happy Bubble Sticker.gif">Happy Bubble · 气泡</option>
          <option value="stickers/Flower Sticker by Erstwilder.gif">Flower · 花朵</option>
          <option value="stickers/sun.gif">Sun · 太阳</option>
          <option value="stickers/Frosted Flakes Snow Sticker by Timetravelsclub.gif">Snow · 冰晶</option>
          <option value="stickers/Motivation Help Sticker.gif">Motivation · 文字</option>
        </select>
        <button type="button" id="sticker-library-add">＋ 添加素材</button>
      </div>
      <div class="sticker-control-row">
        <label for="sticker-tab-select">显示页面</label>
        <select id="sticker-tab-select">
          <option value="all">所有 Tab</option><option value="blog">Home</option><option value="about">About</option><option value="art">Art</option><option value="videos">Videos</option><option value="diary">Diary</option><option value="music">Music</option><option value="links">Links</option><option value="guestbook">Guestbook</option><option value="friends">Friends</option>
        </select>
      </div>
      <form class="sticker-add-form" id="sticker-add-form">
        <label for="sticker-src-input">添加 GIF / 图片</label>
        <input id="sticker-src-input" type="text" placeholder="例如：stickers/my-sticker.gif" required>
        <input id="sticker-name-input" type="text" placeholder="贴纸名称（可选）" maxlength="40">
        <button type="submit">＋ 添加贴纸</button>
        <small>支持 stickers/文件名.gif 或 https:// 图片链接。添加的文件需放在网站可访问的位置。</small>
      </form>
    </div>`;
  document.body.appendChild(toolbar);

  const panel = document.getElementById('sticker-studio-panel');
  document.getElementById('sticker-panel-toggle').addEventListener('click', event => {
    const open = panel.hidden; panel.hidden = !open;
    event.currentTarget.setAttribute('aria-expanded', String(open));
    event.currentTarget.textContent = open ? '✧ 收起管理' : '✧ 贴纸管理';
  });
  document.getElementById('sticker-edit-toggle').addEventListener('click', () => setEditMode(!editMode));

  // Scene presets reposition and resize the current stickers without deleting custom ones.
  const scenePresets = {
    aqua: [
      { x: .035, y: .17, w: 62, o: .92 },
      { x: .83, y: .22, w: 78, o: .88 },
      { x: .07, y: .72, w: 56, o: .82 },
      { x: .87, y: .72, w: 66, o: .9 }
    ],
    y2k: [
      { x: .06, y: .12, w: 82, o: 1 },
      { x: .78, y: .15, w: 88, o: 1 },
      { x: .12, y: .76, w: 72, o: .96 },
      { x: .82, y: .68, w: 76, o: 1 }
    ],
    minimal: [
      { x: .025, y: .24, w: 42, o: .52 },
      { x: .92, y: .28, w: 44, o: .48 },
      { x: .035, y: .78, w: 38, o: .42 },
      { x: .93, y: .76, w: 42, o: .48 }
    ]
  };
  document.querySelectorAll('[data-sticker-preset]').forEach(button => {
    button.addEventListener('click', () => {
      const preset = scenePresets[button.dataset.stickerPreset];
      if (!preset) return;
      stickers.forEach((sticker, index) => {
        const slot = preset[index % preset.length];
        const width = Math.min(slot.w, Math.max(28, window.innerWidth * .22));
        sticker.style.width = `${width}px`; sticker.style.height = 'auto';
        sticker.style.left = `${Math.round(Math.max(0, Math.min(window.innerWidth - width, slot.x * window.innerWidth)))}px`;
        sticker.style.top = `${Math.round(Math.max(0, Math.min(window.innerHeight - width, slot.y * window.innerHeight)))}px`;
        sticker.style.right = 'auto'; sticker.style.bottom = 'auto'; sticker.style.opacity = String(slot.o);
      });
      saveLayout(); saveCustomStickers();
      if (selectedSticker) selectSticker(selectedSticker);
    });
  });

  document.getElementById('sticker-library-add').addEventListener('click', () => {
    const picker = document.getElementById('sticker-library-select');
    const src = picker.value;
    if (!src) return;
    const img = document.createElement('img');
    img.src = src; img.alt = ''; img.className = 'floating-sticker custom-floating-sticker';
    img.dataset.customSticker = 'true';
    img.dataset.label = picker.options[picker.selectedIndex].text.split(' · ')[0] || '素材贴纸';
    img.dataset.stickerId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    img.style.left = `${Math.max(12, window.innerWidth / 2 - 32)}px`;
    img.style.top = `${Math.max(12, window.innerHeight / 2 - 32)}px`;
    img.style.right = 'auto'; img.style.bottom = 'auto'; img.style.width = '64px';
    stickersLayer.appendChild(img); stickers.push(img); bindSticker(img, stickers.length - 1);
    selectSticker(img); img.addEventListener('error', () => alert('素材加载失败，请检查 stickers 文件夹。'), { once: true });
    saveLayout(); saveCustomStickers(); applyTabVisibility(); picker.value = '';
  });

  function resizeSelected(multiplier) {
    if (!selectedSticker) return;
    const current = selectedSticker.getBoundingClientRect().width;
    selectedSticker.style.width = `${Math.max(24, Math.min(240, Math.round(current * multiplier)))}px`;
    selectedSticker.style.height = 'auto'; saveLayout(); saveCustomStickers();
  }
  document.getElementById('sticker-smaller').addEventListener('click', () => resizeSelected(.85));
  document.getElementById('sticker-larger').addEventListener('click', () => resizeSelected(1.18));
  document.getElementById('sticker-opacity').addEventListener('input', event => {
    if (!selectedSticker) return;
    selectedSticker.style.opacity = event.target.value; saveLayout(); saveCustomStickers();
  });
  document.getElementById('sticker-tab-select').addEventListener('change', event => {
    if (!selectedSticker) return;
    selectedSticker.dataset.showOn = event.target.value; applyTabVisibility(); saveLayout(); saveCustomStickers();
  });
  document.getElementById('sticker-visible-toggle').addEventListener('click', () => {
    if (!selectedSticker) return;
    selectedSticker.dataset.hidden = selectedSticker.dataset.hidden === 'true' ? 'false' : 'true';
    applyTabVisibility(); selectSticker(selectedSticker); saveLayout();
  });
  document.getElementById('sticker-reset').addEventListener('click', () => {
    try { localStorage.removeItem(LAYOUT_KEY); localStorage.removeItem(CUSTOM_KEY); } catch (_) {}
    stickers.filter(s => s.dataset.customSticker === 'true').forEach(s => s.remove());
    stickers = Array.from(document.querySelectorAll('.floating-sticker'));
    stickers.forEach((sticker, index) => {
      sticker.style.left = ''; sticker.style.top = ''; sticker.style.right = ''; sticker.style.bottom = '';
      sticker.style.width = ''; sticker.style.height = ''; sticker.style.opacity = '';
      sticker.dataset.hidden = 'false'; sticker.dataset.showOn = 'all';
      sticker.classList.remove('is-selected', 'is-dragging');
    });
    selectedSticker = null; selectSticker(stickers[0]); applyTabVisibility();
  });
  document.getElementById('sticker-add-form').addEventListener('submit', event => {
    event.preventDefault();
    const srcInput = document.getElementById('sticker-src-input');
    const nameInput = document.getElementById('sticker-name-input');
    const src = srcInput.value.trim();
    if (!(/^https?:\/\//i.test(src) || /^(\.\/)?stickers\/[\w .()\-]+\.(gif|png|jpe?g|webp|svg)$/i.test(src))) {
      srcInput.setCustomValidity('请输入 https 图片链接，或 stickers/文件名.gif 这样的相对路径。');
      srcInput.reportValidity(); srcInput.setCustomValidity(''); return;
    }
    const img = document.createElement('img');
    img.src = src; img.alt = ''; img.className = 'floating-sticker custom-floating-sticker';
    img.dataset.customSticker = 'true'; img.dataset.label = nameInput.value.trim() || '自定义贴纸';
    img.dataset.stickerId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    img.style.left = `${Math.max(12, window.innerWidth / 2 - 32)}px`;
    img.style.top = `${Math.max(12, window.innerHeight / 2 - 32)}px`;
    img.style.right = 'auto'; img.style.bottom = 'auto'; img.style.width = '64px';
    stickersLayer.appendChild(img);
    stickers.push(img); bindSticker(img, stickers.length - 1); selectSticker(img);
    img.addEventListener('error', () => alert('图片加载失败，请检查文件路径或图片链接。'), { once: true });
    srcInput.value = ''; nameInput.value = ''; saveLayout(); saveCustomStickers(); applyTabVisibility();
  });

  applySavedLayout();
  selectSticker(stickers[0]);
  setEditMode(true);
  applyTabVisibility();
  document.querySelectorAll('.nav-tab').forEach(tab => tab.addEventListener('click', () => setTimeout(applyTabVisibility, 0)));
  window.addEventListener('resize', () => {
    stickers.forEach(sticker => {
      if (!sticker.style.left || !sticker.style.top) return;
      const rect = sticker.getBoundingClientRect();
      sticker.style.left = `${Math.max(0, Math.min(window.innerWidth - rect.width, rect.left))}px`;
      sticker.style.top = `${Math.max(0, Math.min(window.innerHeight - rect.height, rect.top))}px`;
    });
    saveLayout();
  });
})();
