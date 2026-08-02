/* ============================================================
   05_enemies.js —— 敌人数据库 + 20 波配置
   ai 类型：
     chase    直线追击
     zigzag   蛇形接近（难命中）
     leaper   周期性突进
     shooter  保持距离并射击
     bomber   接触/死亡时爆炸
     charger  蓄力后高速冲锋
     splitter 死亡后分裂
     summoner 周期召唤小怪
     boss1 / boss2  多阶段 BOSS
   ============================================================ */
'use strict';

(function () {

  var E = [

    /* ---------------- 普通敌人 ---------------- */
    { id: 'worm', name: '腐虫', sprite: 'e_worm', sc: 3, r: 11,
      hp: 10, spd: 54, dmg: 5, armor: 0, mat: 1, danger: 1, ai: 'chase' },

    { id: 'bat', name: '尖啸蝠', sprite: 'e_bat', sc: 3, r: 10,
      hp: 7, spd: 120, dmg: 4, armor: 0, mat: 1, danger: 1.3, ai: 'zigzag', wob: 2.6 },

    { id: 'slime', name: '裂胶怪', sprite: 'e_slime', sc: 3, r: 13,
      hp: 17, spd: 56, dmg: 6, armor: 0, mat: 2, danger: 2.0, ai: 'splitter',
      splitInto: 'slimelet', splitCount: 2 },

    { id: 'slimelet', name: '小裂胶', sprite: 'e_slime', sc: 2, r: 8,
      hp: 6, spd: 84, dmg: 4, armor: 0, mat: 1, danger: 0, ai: 'chase', noSpawn: true },

    { id: 'skeleton', name: '枯骨兵', sprite: 'e_skeleton', sc: 3, r: 11,
      hp: 19, spd: 76, dmg: 7, armor: 1, mat: 2, danger: 2.0, ai: 'chase' },

    { id: 'beetle', name: '铁甲虫', sprite: 'e_beetle', sc: 3, r: 14,
      hp: 28, spd: 46, dmg: 8, armor: 4, mat: 2, danger: 2.6, ai: 'chase' },

    { id: 'eye', name: '窥视者', sprite: 'e_eye', sc: 3, r: 12,
      hp: 13, spd: 44, dmg: 6, armor: 0, mat: 2, danger: 2.5, ai: 'shooter',
      keep: 230, fireCd: 2.1, bspd: 250, bdmg: 7 },

    { id: 'spider', name: '跃蛛', sprite: 'e_spider', sc: 3, r: 11,
      hp: 13, spd: 96, dmg: 5, armor: 0, mat: 1, danger: 2.0, ai: 'leaper',
      leapCd: 2.2, leapSpd: 420, leapTime: 0.32 },

    { id: 'wraith', name: '游魂', sprite: 'e_wraith', sc: 3, r: 12,
      hp: 15, spd: 94, dmg: 7, armor: 0, mat: 2, danger: 2.5, ai: 'chase', ghost: true },

    { id: 'bomber', name: '爆弹虫', sprite: 'e_bomber', sc: 3, r: 12,
      hp: 15, spd: 98, dmg: 6, armor: 0, mat: 2, danger: 3.0, ai: 'bomber',
      boomR: 92, boomDmg: 20, fuse: 0.55 },

    { id: 'warlock', name: '邪术师', sprite: 'e_warlock', sc: 3, r: 13,
      hp: 24, spd: 40, dmg: 9, armor: 1, mat: 3, danger: 4.0, ai: 'shooter',
      keep: 275, fireCd: 2.6, bspd: 230, bdmg: 9, salvo: 3, salvoArc: 0.42 },

    { id: 'stone', name: '石傀', sprite: 'e_stone', sc: 3, r: 17,
      hp: 58, spd: 33, dmg: 12, armor: 7, mat: 4, danger: 4.2, ai: 'chase' },

    { id: 'charger', name: '犀角兽', sprite: 'e_charger', sc: 3, r: 16,
      hp: 40, spd: 58, dmg: 14, armor: 2, mat: 4, danger: 4.6, ai: 'charger',
      chargeCd: 3.0, windup: 0.7, chargeSpd: 480, chargeTime: 0.85 },

    /* ---------------- 新增普通敌人 ---------------- */
    { id: 'swarmling', name: '虫群', sprite: 'e_swarmling', sc: 2, r: 7,
      hp: 5, spd: 140, dmg: 3, armor: 0, mat: 1, danger: 1.2, ai: 'chase' },
    { id: 'mimic', name: '拟态箱', sprite: 'e_mimic', sc: 3, r: 12,
      hp: 22, spd: 60, dmg: 9, armor: 2, mat: 8, danger: 2.4, ai: 'chase' },
    { id: 'gargoyle', name: '石像鬼', sprite: 'e_gargoyle', sc: 3, r: 15,
      hp: 34, spd: 44, dmg: 10, armor: 6, mat: 3, danger: 3.5, ai: 'chase' },
    { id: 'hex_archer', name: '咒术弓手', sprite: 'e_hex_archer', sc: 3, r: 12,
      hp: 14, spd: 50, dmg: 7, armor: 0, mat: 2, danger: 3.0, ai: 'shooter',
      keep: 280, fireCd: 2.3, bspd: 300, bdmg: 8 },
    { id: 'void_horror', name: '虚空恐魔', sprite: 'e_void_horror', sc: 3, r: 12,
      hp: 16, spd: 110, dmg: 8, armor: 0, mat: 2, danger: 3.2, ai: 'zigzag', wob: 3.0 },
    { id: 'glutton', name: '贪食体', sprite: 'e_glutton', sc: 3, r: 14,
      hp: 24, spd: 58, dmg: 7, armor: 1, mat: 2, danger: 2.8, ai: 'splitter',
      splitInto: 'swarmling', splitCount: 3 },

    /* ---------------- 精英 ---------------- */
    { id: 'el_ironclad', name: '精英 · 铁卫', sprite: 'el_ironclad', sc: 4, r: 26, elite: true,
      hp: 300, spd: 42, dmg: 18, armor: 14, mat: 26, danger: 0, ai: 'chase',
      shockCd: 4.5, shockR: 165, shockDmg: 16 },

    { id: 'el_butcher', name: '精英 · 血屠', sprite: 'el_butcher', sc: 4, r: 24, elite: true,
      hp: 230, spd: 92, dmg: 21, armor: 4, mat: 26, danger: 0, ai: 'charger',
      chargeCd: 2.1, windup: 0.45, chargeSpd: 620, chargeTime: 0.8 },

    { id: 'el_hexer', name: '精英 · 术法者', sprite: 'el_hexer', sc: 4, r: 24, elite: true,
      hp: 190, spd: 48, dmg: 14, armor: 3, mat: 26, danger: 0, ai: 'shooter',
      keep: 300, fireCd: 1.7, bspd: 260, bdmg: 12, salvo: 5, salvoArc: 0.9 },

    { id: 'el_brood', name: '精英 · 孵化者', sprite: 'el_brood', sc: 4, r: 25, elite: true,
      hp: 265, spd: 52, dmg: 15, armor: 5, mat: 26, danger: 0, ai: 'summoner',
      sumCd: 3.4, sumWhat: 'spider', sumCount: 3 },

    { id: 'el_reaper', name: '精英 · 收割者', sprite: 'el_reaper', sc: 4, r: 25, elite: true,
      hp: 320, spd: 80, dmg: 22, armor: 6, mat: 28, danger: 0, ai: 'charger',
      chargeCd: 2.2, windup: 0.5, chargeSpd: 560, chargeTime: 0.7 },

    /* ---------------- BOSS ---------------- */
    { id: 'boss_behemoth', name: '腐化巨兽', sprite: 'boss_behemoth', sc: 5, r: 46,
      boss: true, noScale: true,
      hp: 2100, spd: 46, dmg: 24, armor: 12, mat: 130, danger: 0, ai: 'boss1' },

    { id: 'boss_abyss', name: '深渊之主', sprite: 'boss_abyss', sc: 5, r: 48,
      boss: true, noScale: true,
      hp: 5200, spd: 52, dmg: 30, armor: 18, mat: 300, danger: 0, ai: 'boss2' }
  ];

  G.ENEMIES = E;
  G.ENEMY_MAP = {};
  E.forEach(function (e) { G.ENEMY_MAP[e.id] = e; });

  /* ------------------------------------------------------------
     难度成长
     ------------------------------------------------------------ */
  G.waveScale = function (wave) {
    var w = wave - 1;
    return {
      hp:  1 + 0.26 * w + 0.013 * w * w,
      dmg: 1 + 0.105 * w,
      spd: 1 + 0.011 * w,
      mat: 1 + 0.13 * w
    };
  };

  /* ------------------------------------------------------------
     20 波配置
       dur    时长（秒）
       rate   每秒投放的「危险值」
       pool   可刷出的敌人 [id, 权重]
       elites 本波精英：[[id, 出现时间比例], ...]
       boss   BOSS id
       label  波次副标题
     ------------------------------------------------------------ */
  var W = [
    { dur: 20, rate: 1.55, pool: [['worm', 9], ['bat', 6], ['slime', 4]], label: '试探' },
    { dur: 22, rate: 2.00, pool: [['worm', 8], ['bat', 7], ['slime', 6], ['skeleton', 4]], label: '骚动' },
    { dur: 24, rate: 2.40, pool: [['worm', 7], ['bat', 7], ['slime', 6], ['skeleton', 6], ['spider', 3]], label: '增殖' },
    { dur: 26, rate: 2.85, pool: [['worm', 6], ['bat', 6], ['slime', 6], ['skeleton', 6], ['spider', 5]], label: '骸骨' },
    { dur: 62, rate: 1.60, pool: [['worm', 6], ['bat', 5], ['skeleton', 4]],
      boss: 'boss_behemoth', bossHpMul: 0.7, label: 'BOSS · 腐化巨兽' },
    { dur: 30, rate: 3.40, pool: [['skeleton', 7], ['spider', 6], ['beetle', 5], ['eye', 4], ['swarmling', 6], ['void_horror', 4]], label: '甲壳' },
    { dur: 32, rate: 3.85, pool: [['skeleton', 6], ['spider', 6], ['beetle', 6], ['eye', 5], ['wraith', 4], ['hex_archer', 4], ['gargoyle', 4]], label: '游魂' },
    { dur: 34, rate: 4.30, pool: [['spider', 6], ['beetle', 6], ['eye', 5], ['wraith', 5], ['bomber', 4], ['gargoyle', 5], ['mimic', 3]], label: '引爆' },
    { dur: 36, rate: 4.70, pool: [['beetle', 6], ['eye', 5], ['wraith', 5], ['bomber', 5], ['warlock', 4]],
      elites: [['el_hexer', 0.35], ['el_ironclad', 0.70]], label: '双精英' },
    { dur: 62, rate: 1.60, pool: [['worm', 6], ['bat', 5], ['skeleton', 4]],
      boss: 'boss_behemoth', bossHpMul: 4, label: 'BOSS · 腐化巨兽' },

    { dur: 38, rate: 5.10, pool: [['skeleton', 5], ['beetle', 6], ['wraith', 5], ['bomber', 5], ['warlock', 5], ['stone', 3], ['mimic', 4], ['glutton', 4], ['gargoyle', 4]], label: '硬化' },
    { dur: 40, rate: 5.50, pool: [['beetle', 6], ['wraith', 5], ['bomber', 5], ['warlock', 5], ['stone', 4], ['charger', 3], ['void_horror', 5], ['hex_archer', 5]], label: '冲锋' },
    { dur: 42, rate: 5.95, pool: [['spider', 5], ['bomber', 6], ['warlock', 5], ['stone', 5], ['charger', 4], ['eye', 4]], label: '压迫' },
    { dur: 44, rate: 6.40, pool: [['beetle', 5], ['wraith', 6], ['bomber', 5], ['warlock', 6], ['stone', 5], ['charger', 5]],
      elites: [['el_brood', 0.40], ['el_reaper', 0.72]], label: '孵化' },
    { dur: 95, rate: 2.30, pool: [['wraith', 6], ['bomber', 5], ['skeleton', 5], ['spider', 5]],
      boss: 'boss_abyss', bossHpMul: 8, label: 'BOSS · 深渊之主' },
    { dur: 46, rate: 7.25, pool: [['beetle', 5], ['wraith', 6], ['bomber', 6], ['warlock', 6], ['stone', 6], ['charger', 6], ['spider', 5], ['hex_archer', 5]], label: '洪流' },
    { dur: 48, rate: 7.70, pool: [['wraith', 6], ['bomber', 7], ['warlock', 6], ['stone', 6], ['charger', 6], ['eye', 5]],
      elites: [['el_hexer', 0.34], ['el_brood', 0.66], ['el_reaper', 0.80]], label: '术法围城' },
    { dur: 50, rate: 8.20, pool: [['beetle', 6], ['wraith', 6], ['bomber', 7], ['warlock', 7], ['stone', 7], ['charger', 7]], label: '崩坏' },
    { dur: 52, rate: 8.80, pool: [['wraith', 7], ['bomber', 7], ['warlock', 7], ['stone', 7], ['charger', 8], ['spider', 6]],
      elites: [['el_ironclad', 0.25], ['el_butcher', 0.50], ['el_hexer', 0.75], ['el_reaper', 0.88]], label: '最后一夜' },
    { dur: 95, rate: 2.30, pool: [['wraith', 6], ['bomber', 5], ['skeleton', 5], ['spider', 5]],
      boss: 'boss_abyss', bossHpMul: 10, label: 'BOSS · 深渊之主' }
  ];

  G.WAVES = W;
  G.MAX_WAVE = W.length;

  /** 从波次池里按权重抽一个敌人 id */
  G.rollEnemy = function (wave) {
    var cfg = W[wave - 1];
    var ids = cfg.pool.map(function (p) { return p[0]; });
    var ws = cfg.pool.map(function (p) { return p[1]; });
    return G.weightedPick(ids, ws);
  };

})();
