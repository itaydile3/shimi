(function () {
  var nodes = document.querySelectorAll("[data-he]");
  var images = document.querySelectorAll("[data-alt-he]");
  var labels = document.querySelectorAll("[data-label-he]");
  var buttons = document.querySelectorAll("[data-set-lang]");
  var status = document.getElementById("lang-status");
  var was = document.querySelectorAll(".js-wa");
  var reel = document.getElementById("reel");
  var sound = document.getElementById("sound");
  var heroPlay = document.getElementById("hero-play");

  var notes = {
    he: {
      default: "שלום שימי, אשמח לקבוע שיחת היכרות של 15 דקות ולדבר על התוכן והשיווק של העסק שלי.",
      presence: "שלום שימי, אשמח לשמוע על מסלול נוכחות ולתכנן יום צילום לעסק שלי.",
      growth: "שלום שימי, אשמח לשמוע על מסלול צמיחה וליווי תוכן שוטף לעסק שלי.",
      department: "שלום שימי, אשמח לשמוע על מסלול ניהול השיווק ולבדוק מה מתאים לעסק שלי.",
      audit: "שלום שימי, אשלח את עמוד האינסטגרם של העסק ואשמח ל-3 רעיונות לשיפור התוכן.",
    },
    en: {
      default: "Hi Shimi, I'd like to book a free 15-minute call to discuss content and marketing for my business.",
      presence: "Hi Shimi, I'd like to hear about the Presence package and plan a shoot for my business.",
      growth: "Hi Shimi, I'd like to hear about the Growth package and ongoing content support for my business.",
      department: "Hi Shimi, I'd like to discuss the Marketing package and what would work for my business.",
      audit: "Hi Shimi, I'll send my business's Instagram page and would love 3 ideas to improve the content.",
    },
  };

  var meta = {
    he: {
      title: "שימי לוי — וידאו קולנועי וחשיבה שיווקית",
      description: "צילום, בימוי, עריכה ושיווק דיגיטלי עם שימי לוי, בעל תואר בקולנוע. תוכן מקצועי לעצמאים, עסקים וארגונים. בואו נדבר על העסק שלכם.",
      status: "השפה: עברית",
      langLabel: "שפה",
    },
    en: {
      title: "Shimi Levy — Cinematic video. A marketing mindset.",
      description: "Cinematic video, photography, and digital marketing with Shimi Levy, a cinema graduate. Content shaped around your business, audience, and goals. Book a free introductory call.",
      status: "Language: English",
      langLabel: "Language",
    },
  };

  function paintSound() {
    if (!sound || !reel) return;
    var on = !reel.muted;
    var he = document.documentElement.lang !== "en";
    sound.textContent = on ? (he ? "השתק" : "Mute") : (he ? "שמע" : "Sound");
    sound.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function apply(lang) {
    var key = lang === "en" ? "en" : "he";
    var he = key === "he";
    var copy = meta[key];

    document.documentElement.lang = key;
    document.documentElement.dir = he ? "rtl" : "ltr";
    document.title = copy.title;

    var description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", copy.description);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", copy.title);
    var locale = document.querySelector('meta[property="og:locale"]');
    if (locale) locale.setAttribute("content", he ? "he_IL" : "en_US");
    var ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", copy.description);

    nodes.forEach(function (el) {
      if (el === sound) return;
      var value = el.getAttribute(he ? "data-he" : "data-en");
      if (value != null) el.textContent = value;
    });

    images.forEach(function (img) {
      var value = img.getAttribute(he ? "data-alt-he" : "data-alt-en");
      if (value != null) img.alt = value;
    });

    labels.forEach(function (el) {
      var value = el.getAttribute(he ? "data-label-he" : "data-label-en");
      if (value != null) el.setAttribute("aria-label", value);
    });

    was.forEach(function (link) {
      var which = link.getAttribute("data-wa");
      var text = notes[key][which] || notes[key].default;
      link.href = "https://wa.me/972502070031?text=" + encodeURIComponent(text);
    });

    var switcher = document.querySelector(".lang");
    if (switcher) switcher.setAttribute("aria-label", copy.langLabel);

    buttons.forEach(function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-set-lang") === key ? "true" : "false");
    });

    paintSound();
    paintPlayback();
    paintReels();
    paintTicker();
    if (status) status.textContent = copy.status;

    try {
      localStorage.setItem("shimi-lang", key);
    } catch (e) {}
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      apply(button.getAttribute("data-set-lang"));
    });
  });

  var reelPlayers = [];
  document.querySelectorAll('.reel-player').forEach(function (container) {
    var video = container.querySelector('video');
    var toggle = container.querySelector('.reel-toggle');
    var mute = container.querySelector('.reel-sound');
    var item = { container: container, video: video, toggle: toggle, mute: mute, started: false };
    reelPlayers.push(item);
    // Native controls remain available if this initialization never completes.
    toggle.hidden = false;
    mute.hidden = false;
    video.controls = false;
    toggle.addEventListener('click', function () {
      if (!video.paused) { video.pause(); return; }
      reelPlayers.forEach(function (other) { if (other !== item) other.video.pause(); });
      if (!item.started) { video.muted = false; item.started = true; }
      var play = video.play();
      if (play && play.catch) play.catch(paintReels);
    });
    mute.addEventListener('click', function () { video.muted = !video.muted; paintReels(); });
    ['play', 'pause', 'ended', 'volumechange'].forEach(function (event) { video.addEventListener(event, paintReels); });
  });

  function paintReels() {
    var he = document.documentElement.lang !== 'en';
    reelPlayers.forEach(function (item) {
      var playing = !item.video.paused && !item.video.ended;
      var name = item.video.getAttribute('aria-label');
      item.container.classList.toggle('is-playing', playing);
      item.toggle.setAttribute('aria-label', (he ? (playing ? 'השהיה: ' : 'ניגון: ') : (playing ? 'Pause: ' : 'Play: ')) + name);
      item.toggle.querySelector('.play-symbol').textContent = playing ? 'Ⅱ' : '▶';
      item.toggle.querySelector('.reel-status').textContent = he ? (playing ? 'השהיה' : 'ניגון') : (playing ? 'Pause' : 'Play');
      item.mute.textContent = he ? (item.video.muted ? 'שמע' : 'השתק') : (item.video.muted ? 'Sound' : 'Mute');
      item.mute.setAttribute('aria-label', he ? (item.video.muted ? 'הפעלת שמע' : 'השתקת שמע') : (item.video.muted ? 'Unmute reel' : 'Mute reel'));
      item.mute.setAttribute('aria-pressed', item.video.muted ? 'false' : 'true');
    });
  }

  if ('IntersectionObserver' in window) {
    var galleryIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (!entry.isIntersecting) entry.target.pause(); });
    }, { threshold: 0.1 });
    reelPlayers.forEach(function (item) { galleryIO.observe(item.video); });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) reelPlayers.forEach(function (item) { item.video.pause(); });
  });

  var timecode = document.getElementById('tc');
  function paintTimecode() {
    if (!timecode || !reel) return;
    var time = reel.currentTime || 0;
    var pad = function (n) { return String(n).padStart(2, '0'); };
    timecode.textContent = [Math.floor(time / 3600), Math.floor(time / 60) % 60, Math.floor(time) % 60, Math.floor((time % 1) * 25)].map(pad).join(':');
  }
  if (reel) {
    function paintRolling() {
      reel.parentElement.classList.toggle('is-rolling', !reel.paused && !reel.ended && reel.readyState >= 2 && reel.currentTime > 0);
    }
    reel.addEventListener('timeupdate', function () { paintTimecode(); paintRolling(); });
    ['playing', 'pause', 'ended', 'emptied'].forEach(function (name) { reel.addEventListener(name, paintRolling); });
    ['waiting', 'stalled'].forEach(function (name) { reel.addEventListener(name, function () { reel.parentElement.classList.remove('is-rolling'); }); });
    reel.addEventListener('seeked', paintTimecode);
  }

  var ticker = document.getElementById('ticker');
  var tickerToggle = document.getElementById('ticker-toggle');
  function paintTicker() {
    if (!ticker || !tickerToggle) return;
    var paused = ticker.classList.contains('is-paused');
    var he = document.documentElement.lang !== 'en';
    tickerToggle.textContent = paused ? '▶' : 'Ⅱ';
    tickerToggle.setAttribute('aria-label', he ? (paused ? 'המשך הטקסט הנע' : 'עצירת הטקסט הנע') : (paused ? 'Resume moving text' : 'Pause moving text'));
    tickerToggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
  }
  if (ticker && tickerToggle) {
    tickerToggle.hidden = false;
    tickerToggle.addEventListener('click', function () { ticker.classList.toggle('is-paused'); paintTicker(); });
  }

  var tierRow = document.querySelector('.tiers');
  if (tierRow) {
    var originalTiers = Array.prototype.slice.call(tierRow.children);
    var packageBreakpoint = window.matchMedia('(max-width: 899px)');
    function arrangePackages() {
      var active = document.activeElement;
      var keepFocus = tierRow.contains(active);
      var ordered = originalTiers.slice();
      if (packageBreakpoint.matches) ordered.sort(function (a, b) {
        return Number(b.classList.contains('tier-hot')) - Number(a.classList.contains('tier-hot'));
      });
      ordered.forEach(function (card) { tierRow.appendChild(card); });
      if (packageBreakpoint.matches) tierRow.scrollLeft = 0;
      if (keepFocus) active.focus({ preventScroll: true });
    }
    arrangePackages();
    if (packageBreakpoint.addEventListener) packageBreakpoint.addEventListener('change', arrangePackages);
    else if (packageBreakpoint.addListener) packageBreakpoint.addListener(arrangePackages);
  }

  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = motionPreference.matches;
  var closingReel = document.getElementById("closing-reel");
  var finalPlay = document.getElementById("final-play");
  var media = [
    { video: reel, button: heroPlay, visible: false, userPaused: false },
    { video: closingReel, button: finalPlay, visible: false, userPaused: false },
  ].filter(function (item) { return item.video; });

  function paintPlayback() {
    var he = document.documentElement.lang !== "en";
    media.forEach(function (item) {
      if (!item.button) return;
      var paused = item.video.paused;
      if (item.video === reel) item.video.parentElement.classList.toggle("is-recording", !paused);
      var background = item.video === closingReel;
      item.button.textContent = paused ? "▶" : "Ⅱ";
      item.button.setAttribute("aria-pressed", paused ? "true" : "false");
      item.button.setAttribute("aria-label", he
        ? (paused ? "ניגון סרטון" : "השהיית סרטון") + (background ? " רקע" : "")
        : (paused ? "Play" : "Pause") + (background ? " background video" : " video"));
    });
  }

  function playMedia(item) {
    var source = item.video.getAttribute("data-src");
    if (source) {
      item.video.src = source;
      item.video.removeAttribute("data-src");
    }
    var play = item.video.play();
    if (play && play.catch) play.catch(paintPlayback);
  }

  media.forEach(function (item) {
    if (reduce) {
      item.video.removeAttribute("autoplay");
      item.video.pause();
    } else if (item.video === reel) {
      item.video.muted = true;
      item.video.defaultMuted = true;
      item.video.autoplay = true;
    }
    if (item.button) {
      item.button.hidden = false;
      item.button.addEventListener("click", function () {
        item.userPaused = !item.video.paused;
        if (item.userPaused) item.video.pause();
        else playMedia(item);
      });
    }
    item.video.addEventListener("play", paintPlayback);
    item.video.addEventListener("pause", paintPlayback);
  });

  if (sound && reel) {
    sound.addEventListener("click", function () {
      reel.muted = !reel.muted;
      if (!reel.muted) {
        media[0].userPaused = false;
        playMedia(media[0]);
      }
      paintSound();
    });
  }

  if ("IntersectionObserver" in window) {
    var mediaIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var item = media.filter(function (candidate) { return candidate.video === entry.target; })[0];
        item.visible = entry.isIntersecting;
        if (item.visible && !reduce && !item.userPaused && !document.hidden) playMedia(item);
        else item.video.pause();
      });
    }, { threshold: 0.08 });
    media.forEach(function (item) { mediaIO.observe(item.video); });
  } else if (!reduce && media.length) {
    playMedia(media[0]);
  }

  document.addEventListener("visibilitychange", function () {
    media.forEach(function (item) {
      if (document.hidden) item.video.pause();
      else if (item.visible && !reduce && !item.userPaused) playMedia(item);
    });
  });

  var revealNodes = document.querySelectorAll(".reveal");
  var countNodes = document.querySelectorAll("[data-count-to]");
  var countFrames = new Map();

  function showTotal(el) {
    var value = el.querySelector("[data-count-value]");
    if (value) value.textContent = el.getAttribute("data-count-to") + el.getAttribute("data-count-suffix");
  }

  function settleMotion() {
    revealNodes.forEach(function (el) { el.classList.add("in"); });
    countFrames.forEach(function (id) { cancelAnimationFrame(id); });
    countFrames.clear();
    countNodes.forEach(showTotal);
  }

  if (!reduce && "IntersectionObserver" in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        revealIO.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -5% 0px" });
    revealNodes.forEach(function (el) { revealIO.observe(el); });
    // Never hide content until its observer has been successfully installed.
    document.documentElement.classList.add("motion-ready");

    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        countIO.unobserve(el);
        if (reduce) return;
        var text = el.getAttribute("data-count-to");
        var end = Number(text);
        var decimals = (text.split(".")[1] || "").length;
        var suffix = el.getAttribute("data-count-suffix");
        var value = el.querySelector("[data-count-value]");
        var start = performance.now();
        function tick(now) {
          if (reduce) { showTotal(el); return; }
          var progress = Math.min((now - start) / 1200, 1);
          value.textContent = (end * (1 - Math.pow(1 - progress, 3))).toFixed(decimals) + suffix;
          if (progress < 1) countFrames.set(el, requestAnimationFrame(tick));
          else { showTotal(el); countFrames.delete(el); }
        }
        countFrames.set(el, requestAnimationFrame(tick));
      });
    }, { threshold: 0.6 });
    countNodes.forEach(function (el) { countIO.observe(el); });
  }

  document.addEventListener("focusin", function (event) {
    var el = event.target.closest(".reveal");
    if (el) el.classList.add("in");
  });

  function updateMotionPreference(event) {
    reduce = event.matches;
    if (reduce) settleMotion();
    media.forEach(function (item) {
      if (reduce) { item.video.removeAttribute("autoplay"); item.video.pause(); }
      else if (item.visible && !item.userPaused && !document.hidden) playMedia(item);
    });
  }
  if (motionPreference.addEventListener) motionPreference.addEventListener("change", updateMotionPreference);
  else if (motionPreference.addListener) motionPreference.addListener(updateMotionPreference);

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href*='wa.me']");
    if (!link) return;
    var where = link.getAttribute("data-wa") || (link.closest("section") && link.closest("section").id) || "dock";
    if (window.ShimiAnalytics) window.ShimiAnalytics.trackContact(where, document.documentElement.lang);
  });

  var saved = "he";
  try {
    if (localStorage.getItem("shimi-lang") === "en") saved = "en";
  } catch (e) {}
  apply(saved);
})();
