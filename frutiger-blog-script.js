/* =====================================================
   FRUTIGER AERO BLOG — blog.js
   Handles: tab switching, SC player, image fallbacks
===================================================== */

/* -------------------------------------------------------
   TAB SWITCHING
------------------------------------------------------- */
var tabLabels = {
  blog:  'Latest Posts',
  about: 'About Me',
  art:   'Art Gallery',
  videos: 'Videos',
  diary: 'Diary',
  music: 'Music',
  links: 'Links'
};

function switchTab(name, el) {
  document.querySelectorAll('.tab-pane').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-tab').forEach(function(t)  { t.classList.remove('active'); });
  var pane = document.getElementById('tab-' + name);
  if (pane) pane.classList.add('active');
  if (el)   el.classList.add('active');
  var bc = document.getElementById('breadcrumb-current');
  if (bc)   bc.textContent = tabLabels[name] || name;
}

/* -------------------------------------------------------
   SOUNDCLOUD MINI PLAYER
   Waits for SC API script to finish loading before binding
------------------------------------------------------- */
function initSCPlayer(iframeId, discId, barsId, btnId, trackId) {
  function tryBind() {
    if (typeof SC === 'undefined') { setTimeout(tryBind, 300); return; }
    var iframe = document.getElementById(iframeId);
    if (!iframe) return;
    var widget = SC.Widget(iframe);
    var disc   = document.getElementById(discId);
    var bars   = document.getElementById(barsId);
    var btn    = document.getElementById(btnId);
    var track  = document.getElementById(trackId);

    function setPlaying(on) {
      if (disc)  disc.classList.toggle('spinning', on);
      if (bars)  bars.classList.toggle('active', on);
      if (track) track.classList.toggle('scrolling', on);
      if (btn)   btn.textContent = on ? '⏸' : '▶';
    }

    widget.bind(SC.Widget.Events.PLAY,   function() { setPlaying(true);  });
    widget.bind(SC.Widget.Events.PAUSE,  function() { setPlaying(false); });
    widget.bind(SC.Widget.Events.FINISH, function() { setPlaying(false); });

    function toggle() { widget.isPaused(function(p) { p ? widget.play() : widget.pause(); }); }
    if (btn)  btn.addEventListener('click',  toggle);
    if (disc) disc.addEventListener('click', toggle);
  }
  tryBind();
}

/* -------------------------------------------------------
   IMAGE FALLBACK SAFETY NET
   onerror on each img handles most cases;
   this catches any that slip through on load
------------------------------------------------------- */
function initImageFallbacks() {
  document.querySelectorAll('.icon-img').forEach(function(img) {
    function applyFallback() {
      img.style.display = 'none';
      var fb = img.nextElementSibling;
      if (fb && fb.classList.contains('icon-fallback')) fb.style.display = 'block';
    }
    img.addEventListener('error', applyFallback);
    if (img.complete && img.naturalWidth === 0) applyFallback();
  });
}

/* -------------------------------------------------------
   INIT
------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
  initImageFallbacks();
  initLightbox();
  // Frutiger Aero blog player IDs
  // initSCPlayer('sc-player-fa', 'mp-disc-fa', 'mp-bars-fa', 'mp-btn-fa', 'mp-track-fa');
});

/* -------------------------------------------------------
   LIGHTBOX — click any .art-item or .post-thumb img
   to see it full size
------------------------------------------------------- */
function openLightbox(src) {
  var lb = document.getElementById('lightbox');
  var img = document.getElementById('lightbox-img');
  if (!lb || !img || !src) return;
  img.src = src;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
  if (e && e.target === document.getElementById('lightbox-img')) return;
  var lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
}

// Close with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeLightbox();
});

function initLightbox() {
  // Art grid items
  document.querySelectorAll('.art-item .icon-img, .art-item').forEach(function(el) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', function() {
      var img = el.tagName === 'IMG' ? el : el.querySelector('.icon-img');
      if (img && img.src && img.naturalWidth > 0) openLightbox(img.src);
    });
  });
  // Post thumbnails
  document.querySelectorAll('.post-thumb .icon-img, .post-img .icon-img, .diary-thumb .icon-img').forEach(function(img) {
    if (!img) return;
    img.style.cursor = 'pointer';
    img.addEventListener('click', function() {
      if (img.src && img.naturalWidth > 0) openLightbox(img.src);
    });
  });
}



/* ══ Local Music Player ══ */
function initLocalMusicPlayer() {
  const audio = document.getElementById("local-audio-fa");
  const disc = document.getElementById("mp-disc-fa");
  const prevBtn = document.getElementById("music-prev");
  const nextBtn = document.getElementById("music-next");
  const title = document.getElementById("mp-track-fa");
  const status = document.getElementById("music-status");
  const bars = document.getElementById("mp-bars-fa");
  const list = document.getElementById("music-track-list");

  // 如果播放器 HTML 元素缺失，在控制台显示原因
  if (!audio || !disc || !title || !list) {
    console.error("音乐播放器初始化失败，请检查 HTML 元素 ID：", {
      audio: !!audio,
      disc: !!disc,
      title: !!title,
      list: !!list
    });
    return;
  }

  const tracks = [
    {
      title: "7 Weeks 3 Days",
      artist: "Backrooms Version",
      src: "music/7 Weeks 3 Days.mp3"
    },
    {
      title: "Comfort Chain",
      artist: "Instupendo",
      src: "music/Comfort Chain.mp3"
    },
    {
      title: "I'd Rather Sleep",
      artist: "Kero Kero Bonito",
      src: "music/I'd Rather Sleep - Kero Kero Bonito.mp3"
    }
  ];

  let currentIndex = 0;

  function updateStatus(text) {
    if (status) status.textContent = text;
  }

  function updatePlayState(playing) {
    disc.classList.toggle("is-playing", playing);

    if (bars) {
      bars.style.opacity = playing ? "1" : "0.35";
    }

    if (playing) {
      updateStatus("PLAYING");
    } else if (audio.ended) {
      updateStatus("FINISHED");
    } else {
      updateStatus("PAUSED");
    }
  }

  function renderPlaylist() {
    list.replaceChildren();

    tracks.forEach(function (track, index) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "music-track-item";
      button.classList.toggle("active", index === currentIndex);
      button.setAttribute(
        "aria-current",
        index === currentIndex ? "true" : "false"
      );

      const number = document.createElement("span");
      number.className = "music-track-number";
      number.textContent = String(index + 1).padStart(2, "0");

      const name = document.createElement("span");
      name.className = "music-track-name";
      name.textContent = track.title + " — " + track.artist;

      button.append(number, name);

      button.addEventListener("click", function () {
        loadTrack(index, true);
      });

      list.appendChild(button);
    });
  }

  function loadTrack(index, autoplay) {
    currentIndex = (index + tracks.length) % tracks.length;
    const track = tracks[currentIndex];

    audio.pause();
    audio.src = track.src;
    audio.load();

    title.textContent = "♪ " + track.title + " — " + track.artist;

    renderPlaylist();
    updateStatus("READY");
    updatePlayState(false);

    if (autoplay) {
      playAudio();
    }
  }

  function playAudio() {
    audio.play().catch(function (error) {
      console.error("音乐播放失败：", error);
      updateStatus("PLAY ERROR");
    });
  }

  // 唱片：播放 / 暂停
  disc.addEventListener("click", function () {
    if (audio.paused) {
      playAudio();
    } else {
      audio.pause();
    }
  });

  // 上一首
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      loadTrack(currentIndex - 1, true);
    });
  }

  // 下一首
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      loadTrack(currentIndex + 1, true);
    });
  }

  audio.addEventListener("play", function () {
    updatePlayState(true);
  });

  audio.addEventListener("pause", function () {
    updatePlayState(false);
  });

  audio.addEventListener("ended", function () {
    if (currentIndex < tracks.length - 1) {
      loadTrack(currentIndex + 1, true);
    } else {
      updatePlayState(false);
      updateStatus("FINISHED");
    }
  });

  audio.addEventListener("error", function () {
    updateStatus("FILE ERROR");
    console.error("音乐文件无法加载：", audio.currentSrc);
  });

  // 先生成歌单，再加载第一首歌曲
  renderPlaylist();
  loadTrack(0, false);

  console.log("本地音乐播放器初始化完成，歌曲数量：", tracks.length);
}

// 等 HTML 加载完成后再初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLocalMusicPlayer);
} else {
  initLocalMusicPlayer();
}

/* ══ Guestbook Database ══ */
(function () {
  const SUPABASE_URL = "https://rkubeolqhvztdfpfthok.supabase.co";
  const SUPABASE_KEY = "sb_publishable_u7bDaUIwUojCI80h7Mtw2w_LG1_l7hf";

  function initGuestbook() {
    const form = document.getElementById("guestbook-form");
    const list = document.getElementById("guestbook-messages");
    const status = document.getElementById("guestbook-status");
    const submit = document.getElementById("guestbook-submit");

    if (!form || !list || !status || !submit) return;

    if (!window.supabase || SUPABASE_URL.startsWith("填写你的")) {
      status.textContent = "Guestbook is not configured yet.";
      list.textContent = "Please configure the database connection.";
      return;
    }

    const db = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    function setStatus(message) {
      status.textContent = message;
    }

    function formatDate(value) {
      return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    }

    async function loadMessages() {
      list.replaceChildren();
      list.textContent = "Loading messages...";

      const { data, error } = await db
        .from("guestbook")
        .select("id, nickname, message, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        list.textContent = "Could not load messages. Please try again later.";
        console.error("Guestbook load error:", error);
        return;
      }

      list.replaceChildren();

      if (!data || data.length === 0) {
        list.textContent = "No messages yet. Be the first to leave one ♪";
        return;
      }

      data.forEach(function (item) {
        const entry = document.createElement("article");
        entry.className = "guestbook-entry";

        const head = document.createElement("div");
        head.className = "guestbook-entry-head";

        const name = document.createElement("span");
        name.className = "guestbook-entry-name";
        name.textContent = item.nickname;

        const date = document.createElement("time");
        date.className = "guestbook-entry-date";
        date.textContent = formatDate(item.created_at);
        date.dateTime = item.created_at;

        const message = document.createElement("div");
        message.className = "guestbook-entry-message";
        message.textContent = item.message;

        head.append(name, date);
        entry.append(head, message);
        list.appendChild(entry);
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      // 简单的隐藏字段反垃圾检查
      if (form.elements.website.value.trim()) return;

      const nickname = form.elements.nickname.value.trim();
      const message = form.elements.message.value.trim();

      if (!nickname || nickname.length > 30) {
        setStatus("Nickname must be 1–30 characters.");
        return;
      }

      if (!message || message.length > 500) {
        setStatus("Message must be 1–500 characters.");
        return;
      }

      submit.disabled = true;
      setStatus("Sending your message...");

      try {
        const { error } = await db
          .from("guestbook")
          .insert({ nickname, message });

        if (error) throw error;

        form.reset();
        setStatus("Submitted! Your message will appear after review.");
      } catch (error) {
        console.error("Guestbook submit error:", error);
        setStatus("Could not submit. Please try again later.");
      } finally {
        submit.disabled = false;
      }
    });

    loadMessages();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGuestbook);
  } else {
    initGuestbook();
  }
})();
