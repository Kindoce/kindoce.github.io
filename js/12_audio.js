/* ============================================================
   12_audio.js —— WebAudio 程序化音效
   - 零外部文件、零依赖，全部用振荡器/噪声实时合成
   - AudioContext 不可用时（无头测试 / file:// 双击）自动降级为静默 no-op
   - 浏览器自动播放策略：在首次用户手势（开始按钮）里调用 unlock()
   ============================================================ */
(function () {
  var G = window.G || (window.G = {});

  var ACtor = (typeof window !== 'undefined')
    ? (window.AudioContext || window.webkitAudioContext)
    : null;

  function AudioSys() {
    this.ctx = null;
    this.master = null;
    this.bgm = null;
    this.bgmVolume = 0.34;
    this.bgmIndex = 0;
    this.bgmMode = 'menu';
    this.pendingMode = null;
    this.normalBgmIndex = 0;
    this.normalBgmPlaying = false;
    this.combatBgmIndex = 0;
    this.menuBgm = { name: '造梦西游3', src: 'audio/zaomeng-xiyou-3.mp3' };
    this.bgmTracks = [
      this.menuBgm,
      { name: '哈雪大帽险', src: 'audio/ha-xue-da-mao-xian.mp3' },
      { name: '哈风车', src: 'audio/ha-feng-che.mp3' },
      { name: '哈基米：Billie Jean', src: 'audio/billie-jean.mp3' },
      { name: '蓝莲哈', src: 'audio/lan-lian-ha.mp3' },
      { name: '曼波の小曲／登山の小曲', src: 'audio/manbo-climb-la-la-la.mp3' }
    ];
    this.combatTracks = {
      elite: [
        { name: '精英战：明星训练家的战斗', src: 'audio/elite-09.mp3' },
        { name: '精英战：与觉醒小光的战斗', src: 'audio/elite-12.mp3' },
        { name: '精英战：Ex战斗', src: 'audio/elite-35.mp3' }
      ],
      boss: [
        { name: 'Boss战：最终决战', src: 'audio/boss-13.mp3' },
        { name: 'Boss战：DLC2三神兽的战斗', src: 'audio/boss-40.mp3' }
      ]
    };
    this.bgmPlaying = false;
    this.onChange = null;
    this.volume = 0.22;
    this.muted = false;
    this._last = {};
    // 每个音效的全局最小间隔（秒），避免同一帧大量命中时吵成一片
    this._gap = {
      fire: 0.09, swing: 0.10, hit: 0.06, crit: 0.05, kill: 0.05,
      pickup: 0.06, heal: 0, wave: 0, boss: 0, levelup: 0,
      buy: 0, hurt: 0, death: 0, victory: 0, bossdie: 0
    };
  }

  AudioSys.prototype.init = function () {
    if (this.bgm == null && typeof Audio !== 'undefined') this._loadBgmTrack();
    if (!ACtor || this.ctx) return;
    try {
      this.ctx = new ACtor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  };

  AudioSys.prototype._notify = function () {
    if (typeof this.onChange === 'function') this.onChange(this.getBgmState());
  };

  // 由用户手势触发（开始游戏点击）——解锁/恢复 AudioContext
  AudioSys.prototype.unlock = function () {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch (e) {}
    }
    this.playBgm();
  };

  AudioSys.prototype._loadBgmTrack = function () {
    if (typeof Audio === 'undefined') return;
    var tracks = this.bgmMode === 'menu' ? [this.menuBgm]
      : this.bgmMode === 'normal' ? this.bgmTracks : this.combatTracks[this.bgmMode];
    var index = this.bgmMode === 'normal' ? this.normalBgmIndex : this.combatBgmIndex;
    var track = this.bgmMode === 'menu' ? this.menuBgm : tracks[index];
    try {
      if (this.bgm) {
        this.bgm.pause();
        this.bgm.src = '';
      }
      this.bgm = new Audio(track.src);
      var audio = this.bgm;
      this.bgm.loop = true;
      this.bgm.autoplay = true;
      this.bgm.setAttribute('autoplay', '');
      this.bgm.setAttribute('playsinline', '');
      this.bgm.preload = 'auto';
      this.bgm.volume = this.muted ? 0 : this.volume * this.bgmVolume;
      if (track === this.menuBgm) {
        var startAt = function () {
          try { this.bgm.currentTime = 1; } catch (e) {}
        }.bind(this);
        this.bgm.addEventListener('loadedmetadata', startAt, { once: true });
        if (this.bgm.readyState >= 1) startAt();
      }
      this.bgm.addEventListener('ended', function () {
        this.bgmPlaying = false;
        if (this.pendingMode) {
          var nextMode = this.pendingMode;
          this.pendingMode = null;
          this._applyBgmMode(nextMode);
        } else {
          this._notify();
        }
      }.bind(this));
      if (track === this.menuBgm) {
        this.bgm.addEventListener('canplay', function () {
          if (this.bgm === audio && !this.bgmPlaying) this.playBgm();
        }.bind(this), { once: true });
      }
    } catch (e) { this.bgm = null; }
  };

  AudioSys.prototype.playBgm = function () {
    this.init();
    if (!this.bgm) return false;
    this.bgm.volume = this.muted ? 0 : this.volume * this.bgmVolume;
    try {
      var audio = this.bgm;
      var playback = audio.play();
      this.bgmPlaying = true;
      this._notify();
      if (playback && playback.catch) playback.catch(function () {
        if (this.bgm !== audio) return;
        this.bgmPlaying = false;
        this._notify();
      }.bind(this));
      return true;
    } catch (e) { return false; }
  };

  AudioSys.prototype.pauseBgm = function () {
    if (!this.bgm) return false;
    this.bgm.pause();
    this.bgmPlaying = false;
    this._notify();
    return true;
  };

  AudioSys.prototype.toggleBgm = function () {
    return this.bgmPlaying ? (this.pauseBgm(), false) : this.playBgm();
  };

  AudioSys.prototype.nextBgm = function (step) {
    if (this.bgmMode === 'menu') return this.getBgmState();
    var wasPlaying = this.bgmPlaying;
    var tracks = this.bgmMode === 'normal' ? this.bgmTracks : this.combatTracks[this.bgmMode];
    var index = this.bgmMode === 'normal' ? this.normalBgmIndex : this.combatBgmIndex;
    index = (index + (step || 1) + tracks.length) % tracks.length;
    if (this.bgmMode === 'normal') this.normalBgmIndex = index;
    else this.combatBgmIndex = index;
    this._loadBgmTrack();
    if (this.pendingMode) this.bgm.loop = false;
    if (wasPlaying) this.playBgm();
    else this._notify();
    return this.getBgmState();
  };

  AudioSys.prototype.setBgmVolume = function (v) {
    this.bgmVolume = Math.max(0, Math.min(1, v));
    if (this.bgm) this.bgm.volume = this.muted ? 0 : this.volume * this.bgmVolume;
    this._notify();
  };

  AudioSys.prototype.getBgmState = function () {
    var tracks = this.bgmMode === 'menu' ? [this.menuBgm]
      : this.bgmMode === 'normal' ? this.bgmTracks : this.combatTracks[this.bgmMode];
    var index = this.bgmMode === 'normal' ? this.normalBgmIndex : this.combatBgmIndex;
    return {
      name: this.bgmMode === 'menu' ? this.menuBgm.name : tracks[index].name,
      playing: this.bgmPlaying,
      volume: this.bgmVolume,
      mode: this.bgmMode
    };
  };

  AudioSys.prototype._applyBgmMode = function (mode) {
    this.bgmMode = mode;
    var tracks = mode === 'normal' ? this.bgmTracks : this.combatTracks[mode];
    if (mode === 'normal') this.normalBgmIndex = Math.floor(Math.random() * tracks.length);
    else this.combatBgmIndex = Math.floor(Math.random() * tracks.length);
    this._loadBgmTrack();
    if (mode === 'normal') {
      if (this.normalBgmPlaying) this.playBgm();
      else this.pauseBgm();
    } else {
      this.playBgm();
    }
  };

  AudioSys.prototype.startBattleBgm = function () {
    this.pendingMode = null;
    this.normalBgmPlaying = true;
    this._applyBgmMode('normal');
    return this.getBgmState();
  };

  AudioSys.prototype.setCombatMode = function (mode) {
    mode = mode === 'boss' ? 'boss' : mode === 'elite' ? 'elite' : 'normal';
    if (mode === this.pendingMode) return this.getBgmState();
    if (mode === this.bgmMode) return this.getBgmState();
    if (mode === 'normal') {
      if (this.bgmMode === 'menu') {
        this.pendingMode = null;
        this.normalBgmPlaying = true;
        this._applyBgmMode('normal');
        return this.getBgmState();
      }
      if (this.bgmMode !== 'normal' && this.bgmPlaying && this.bgm) {
        this.pendingMode = 'normal';
        this.bgm.loop = false;
        this._notify();
      } else {
        this.pendingMode = null;
        this._applyBgmMode('normal');
      }
      return this.getBgmState();
    }
    this.pendingMode = null;
    if (this.bgmMode !== 'normal' && this.bgm) this.bgm.loop = true;
    if (this.bgmMode === 'normal') {
      this.normalBgmPlaying = this.bgmPlaying;
    }
    this._applyBgmMode(mode);
    return this.getBgmState();
  };

  AudioSys.prototype.setVolume = function (v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
    if (this.bgm) this.bgm.volume = this.muted ? 0 : this.volume * this.bgmVolume;
  };

  AudioSys.prototype.toggleMute = function () {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
    if (this.bgm) this.bgm.volume = this.muted ? 0 : this.volume * this.bgmVolume;
    return this.muted;
  };

  /* —— 内部合成原语 —— */
  AudioSys.prototype._tone = function (t, opt) {
    var ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = opt.type || 'square';
    var f0 = opt.f0, f1 = opt.f1 == null ? f0 : opt.f1;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + opt.dur);
    var peak = opt.gain == null ? 0.3 : opt.gain;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (opt.atk || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + opt.dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + opt.dur + 0.03);
  };

  AudioSys.prototype._noise = function (t, dur, peak, filt) {
    var ctx = this.ctx;
    var n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (filt) {
      var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filt;
      src.connect(f); f.connect(g);
    } else { src.connect(g); }
    g.connect(this.master);
    src.start(t); src.stop(t + dur + 0.03);
  };

  AudioSys.prototype._chord = function (t, freqs, opt) {
    for (var i = 0; i < freqs.length; i++) {
      this._tone(t + (opt.stagger ? i * opt.stagger : 0), {
        type: opt.type || 'triangle',
        f0: freqs[i],
        f1: opt.f1 ? opt.f1[i] : freqs[i],
        dur: opt.dur,
        gain: opt.gain == null ? 0.22 : opt.gain,
        atk: opt.atk
      });
    }
  };

  /* —— 各音效定义 —— */
  var SOUNDS = {
    // 远程武器开火：短促方波下滑 + 高频噪声
    fire: function (A, t) {
      A._tone(t, { type: 'square', f0: 880, f1: 360, dur: 0.07, gain: 0.12 });
      A._noise(t, 0.05, 0.07, 1800);
    },
    // 近战挥击：风声噪声
    swing: function (A, t) {
      A._noise(t, 0.10, 0.11, 1200);
      A._tone(t, { type: 'triangle', f0: 520, f1: 240, dur: 0.09, gain: 0.07 });
    },
    // 命中：短噪声 + 低方波
    hit: function (A, t) {
      A._noise(t, 0.05, 0.10, 900);
      A._tone(t, { type: 'square', f0: 320, f1: 180, dur: 0.05, gain: 0.07 });
    },
    // 暴击：双声上扬
    crit: function (A, t) {
      A._tone(t, { type: 'square', f0: 1300, f1: 1700, dur: 0.07, gain: 0.14 });
      A._tone(t + 0.04, { type: 'square', f0: 1700, f1: 2100, dur: 0.07, gain: 0.11 });
    },
    // 击杀：噪声爆 + 低频
    kill: function (A, t) {
      A._noise(t, 0.10, 0.13, 600);
      A._tone(t, { type: 'sawtooth', f0: 200, f1: 90, dur: 0.09, gain: 0.10 });
    },
    // BOSS 死亡：长低频轰鸣
    bossdie: function (A, t) {
      A._noise(t, 0.7, 0.35, 700);
      A._tone(t, { type: 'sawtooth', f0: 180, f1: 40, dur: 0.7, gain: 0.22 });
      A._tone(t + 0.05, { type: 'square', f0: 300, f1: 60, dur: 0.5, gain: 0.12 });
    },
    // 拾取材料：清脆上扬
    pickup: function (A, t) {
      A._tone(t, { type: 'triangle', f0: 1200, f1: 1700, dur: 0.08, gain: 0.13 });
    },
    // 拾取治疗：柔和双音
    heal: function (A, t) {
      A._chord(t, [600, 900], { type: 'sine', dur: 0.18, gain: 0.14, stagger: 0.06, f1: [760, 1100] });
    },
    // 波次开始：庄重两音
    wave: function (A, t) {
      A._chord(t, [440, 660], { type: 'triangle', dur: 0.22, gain: 0.18, stagger: 0.10 });
    },
    // BOSS 登场：低沉压迫
    boss: function (A, t) {
      A._tone(t, { type: 'sawtooth', f0: 160, f1: 70, dur: 0.55, gain: 0.26 });
      A._noise(t, 0.3, 0.12, 400);
    },
    // 升级：上行琶音
    levelup: function (A, t) {
      A._chord(t, [523, 659, 784], { type: 'triangle', dur: 0.16, gain: 0.18, stagger: 0.07 });
    },
    // 购买：清脆双声
    buy: function (A, t) {
      A._tone(t, { type: 'square', f0: 900, f1: 1300, dur: 0.07, gain: 0.16 });
      A._tone(t + 0.06, { type: 'square', f0: 1300, f1: 1700, dur: 0.08, gain: 0.14 });
    },
    // 受伤：噪声 + 下滑锯齿
    hurt: function (A, t) {
      A._noise(t, 0.14, 0.28, 320);
      A._tone(t, { type: 'sawtooth', f0: 220, f1: 110, dur: 0.13, gain: 0.18 });
    },
    // 玩家死亡：长下滑
    death: function (A, t) {
      A._tone(t, { type: 'sawtooth', f0: 420, f1: 60, dur: 0.9, gain: 0.30 });
      A._noise(t + 0.1, 0.4, 0.18, 300);
    },
    // 胜利：大调上行琶音
    victory: function (A, t) {
      A._chord(t, [523, 659, 784, 1047], { type: 'triangle', dur: 0.3, gain: 0.2, stagger: 0.12, f1: [523, 659, 784, 1047] });
    }
  };

  AudioSys.prototype.sfx = function (name) {
    if (this.muted) return;
    if (!this.ctx) return;            // 未初始化 / 降级环境：静默
    if (this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch (e) {} }
    var gap = this._gap[name] || 0;
    if (gap > 0) {
      var now = this.ctx.currentTime;
      var last = this._last[name] || 0;
      if (now - last < gap) return;
      this._last[name] = now;
    }
    var fn = SOUNDS[name];
    if (!fn) return;
    try { fn(this, this.ctx.currentTime); } catch (e) { /* 单音失败不影响游戏 */ }
  };

  G.Audio = new AudioSys();
})();
