/* ============================================================
   11_main.js —— 启动 / 按钮绑定 / 流程衔接
   ============================================================ */
'use strict';

(function () {

  function boot() {
    G.game.init();

    /* 应用存档设置：音量 / 震屏强度 */
    var settings = G.Save.getSettings();
    G.Audio.setVolume(settings.volume);
    G.game.shakeScale = settings.shake;

    /* 角色选择：renderCharSelect 会在内部回调选中项（默认第一个） */
    var selectedChar = G.CHARACTERS[0];
    G.UI.renderCharSelect(function (ch) { selectedChar = ch; });

    function byId(id) { return document.getElementById(id); }

    var focusGate = byId('focusGate');
    var focusButton = byId('btnFocusGate');
    var focusParticles = byId('focusParticles');
    for (var particleIndex = 0; particleIndex < 28; particleIndex++) {
      var particle = document.createElement('span');
      particle.className = 'focus-particle';
      particle.style.setProperty('--size', (2 + Math.random() * 4).toFixed(1) + 'px');
      particle.style.setProperty('--angle', Math.round(Math.random() * 360) + 'deg');
      particle.style.setProperty('--distance', Math.round(150 + Math.random() * 300) + 'px');
      particle.style.setProperty('--duration', (2.8 + Math.random() * 3.2).toFixed(2) + 's');
      particle.style.setProperty('--delay', (-Math.random() * 5).toFixed(2) + 's');
      particle.style.setProperty('--color', Math.random() > 0.45 ? '#8fb8ff' : '#ffd24a');
      focusParticles.appendChild(particle);
    }

    function releaseFocus() {
      if (focusGate.classList.contains('hidden')) return;
      focusGate.classList.add('hidden');
      G.Audio.unlock();
      focusButton.blur();
    }

    focusButton.addEventListener('click', releaseFocus);
    focusGate.addEventListener('keydown', function (e) {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        releaseFocus();
      }
    });

    function updateBgmControls() {
      var state = G.Audio.getBgmState();
      byId('bgmTrackName').textContent = state.name;
      byId('btnBgmToggle').textContent = state.playing ? '||' : '>'; 
      byId('btnBgmToggle').title = state.playing ? '暂停' : '播放';
      byId('btnBgmToggle').setAttribute('aria-label', state.playing ? '暂停' : '播放');
      byId('bgmVolume').value = state.volume;
    }

    G.Audio.onChange = updateBgmControls;
    G.Audio.init();
    G.Audio.playBgm();

    // 浏览器禁止无手势自动播放时，在首次页面点击启动标题音乐。
    document.addEventListener('pointerdown', function () {
      if (G.Audio.getBgmState().mode === 'menu' && !G.Audio.bgmPlaying) G.Audio.unlock();
    });

    /* 开始游戏 */
    byId('btnStart').addEventListener('click', function () {
      if (!selectedChar) return;
      G.Save.clearRun();        // 新开一局：放弃旧的续局存档
      G.Audio.unlock();          // 首次用户手势：解锁音频
      G.Audio.startBattleBgm();
      G.UI.showScreen(null);
      G.game.newRun(selectedChar);
    });

    /* 继续游戏（读取续局存档） */
    byId('btnResumeRun').addEventListener('click', function () {
      var data = G.Save.getRun();
      if (!data) return;
      G.Audio.unlock();
      G.Audio.startBattleBgm();
      var ok = G.game.resumeRun(data);
      if (!ok) { G.Save.clearRun(); G.UI.showScreen('scrTitle'); }
    });

    /* 设置 */
    byId('btnSettings').addEventListener('click', function () {
      var s = G.Save.getSettings();
      byId('setVolume').value = s.volume;
      byId('setShake').value = s.shake;
      byId('setVolumeVal').textContent = Math.round(s.volume * 100) + '%';
      byId('setShakeVal').textContent = Math.round(s.shake * 100) + '%';
      G.UI.showScreen('scrSettings');
    });
    byId('btnSettingsBack').addEventListener('click', function () {
      G.UI.showScreen('scrTitle');
    });
    byId('setVolume').addEventListener('input', function (e) {
      var v = parseFloat(e.target.value);
      G.Audio.setVolume(v);
      byId('setVolumeVal').textContent = Math.round(v * 100) + '%';
      G.Save.setSettings({ volume: v });
    });
    byId('setShake').addEventListener('input', function (e) {
      var v = parseFloat(e.target.value);
      G.game.shakeScale = v;
      byId('setShakeVal').textContent = Math.round(v * 100) + '%';
      G.Save.setSettings({ shake: v });
    });

    byId('btnBgmPrev').addEventListener('click', function () {
      G.Audio.nextBgm(-1);
      G.Audio.playBgm();
      updateBgmControls();
    });
    byId('btnBgmToggle').addEventListener('click', function () {
      G.Audio.toggleBgm();
      updateBgmControls();
    });
    byId('btnBgmNext').addEventListener('click', function () {
      G.Audio.nextBgm(1);
      G.Audio.playBgm();
      updateBgmControls();
    });
    byId('bgmVolume').addEventListener('input', function (e) {
      G.Audio.setBgmVolume(parseFloat(e.target.value));
      updateBgmControls();
    });

    /* 商店 → 下一波 */
    byId('btnNextWave').addEventListener('click', function () {
      G.game.nextWave();
    });

    /* 商店 → 重掷 */
    byId('btnReroll').addEventListener('click', function () {
      var ok = G.Shop.reroll(G.game.player);
      if (!ok) return;
      G.UI.renderShop(G.game);
    });

    /* 暂停 → 继续 */
    byId('btnResume').addEventListener('click', function () {
      G.game.togglePause();
    });

    /* 暂停 → 放弃本局，回到标题 */
    byId('btnQuit').addEventListener('click', function () {
      G.Save.clearRun();        // 放弃本局：清除续局存档
      G.game.state = 'title';
      G.game.player = null;
      byId('hud').classList.add('hidden');
      byId('statPanel').classList.add('hidden');
      G.UI.showScreen('scrTitle');
    });

    /* 结算 → 再来一局 */
    byId('btnRestart').addEventListener('click', function () {
      G.Save.clearRun();        // 结算后再来：清除续局存档
      G.game.state = 'title';
      G.game.player = null;
      byId('hud').classList.add('hidden');
      byId('statPanel').classList.add('hidden');
      G.UI.renderCharSelect(function (ch) { selectedChar = ch; });
      G.UI.showScreen('scrTitle');
    });

    /* 进入标题界面（覆盖层默认可见） */
    G.UI.showScreen('scrTitle');
    updateBgmControls();
    focusButton.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
