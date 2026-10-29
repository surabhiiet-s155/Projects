/* ==========================================================================
   Emoji Memory Master - 20 Level Campaign JavaScript Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ------------------------------------------------------------------------
  // 1. AUDIO CONTROLLER (Web Audio API Synthesizer)
  // ------------------------------------------------------------------------
  class AudioController {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15) {
      if (this.isMuted || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }

    playFlip() {
      this.init();
      this.playTone(420, 'sine', 0.08, 0.1);
    }

    playMatch() {
      this.init();
      if (this.isMuted || !this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 'triangle', 0.18, 0.12), idx * 60);
      });
    }

    playMismatch() {
      this.init();
      if (this.isMuted || !this.ctx) return;
      this.playTone(220, 'sawtooth', 0.12, 0.08);
      setTimeout(() => this.playTone(180, 'sawtooth', 0.18, 0.08), 80);
    }

    playBomb() {
      this.init();
      if (this.isMuted || !this.ctx) return;
      this.playTone(120, 'square', 0.35, 0.25);
    }

    playFreeze() {
      this.init();
      if (this.isMuted || !this.ctx) return;
      this.playTone(880, 'sine', 0.3, 0.15);
      setTimeout(() => this.playTone(1174.66, 'sine', 0.4, 0.15), 100);
    }

    playPowerup() {
      this.init();
      if (this.isMuted || !this.ctx) return;
      [300, 450, 600, 900].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.1, 0.12), i * 40);
      });
    }

    playWhoosh() {
      this.init();
      if (this.isMuted || !this.ctx) return;
      this.playTone(200, 'sine', 0.25, 0.12);
    }

    playVictory() {
      this.init();
      if (this.isMuted || !this.ctx) return;
      const melody = [
        { f: 523.25, d: 0.15 }, { f: 659.25, d: 0.15 }, { f: 783.99, d: 0.15 },
        { f: 1046.5, d: 0.4 }
      ];
      melody.forEach((note, i) => {
        setTimeout(() => this.playTone(note.f, 'triangle', note.d, 0.2), i * 140);
      });
    }
  }

  // ------------------------------------------------------------------------
  // 2. BACKGROUND PARTICLES CANVAS
  // ------------------------------------------------------------------------
  class BgCanvas {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.resize();
      this.initParticles();
      window.addEventListener('resize', () => this.resize());
      this.animate();
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    initParticles() {
      this.particles = [];
      const count = Math.floor((this.canvas.width * this.canvas.height) / 22000);
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          radius: Math.random() * 3 + 1,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          alpha: Math.random() * 0.4 + 0.1
        });
      }
    }

    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const isLight = document.body.classList.contains('light-mode');
      const particleColor = isLight ? 'rgba(99, 102, 241, ' : 'rgba(168, 85, 247, ';

      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.strokeStyle = `${particleColor}${0.15 * (1 - dist / 90)})`;
            this.ctx.lineWidth = 0.6;
            this.ctx.stroke();
          }
        }
      }

      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;
        if (p.y < 0) p.y = this.canvas.height;
        if (p.y > this.canvas.height) p.y = 0;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `${particleColor}${p.alpha})`;
        this.ctx.fill();
      });
      requestAnimationFrame(() => this.animate());
    }
  }

  // ------------------------------------------------------------------------
  // 3. CONFETTI ENGINE
  // ------------------------------------------------------------------------
  class ConfettiEngine {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.active = false;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    trigger() {
      this.particles = [];
      this.active = true;
      const colors = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#22c55e', '#eab308', '#38bdf8'];
      for (let i = 0; i < 140; i++) {
        this.particles.push({
          x: this.canvas.width / 2,
          y: this.canvas.height / 2 + 20,
          vx: (Math.random() - 0.5) * 18,
          vy: (Math.random() - 0.8) * 20 - 4,
          size: Math.random() * 10 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.2,
          opacity: 1,
          gravity: 0.35
        });
      }
      this.animate();
    }

    animate() {
      if (!this.active) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      let aliveCount = 0;
      this.particles.forEach(p => {
        if (p.opacity <= 0) return;
        aliveCount++;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.opacity -= 0.008;

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.globalAlpha = Math.max(0, p.opacity);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        this.ctx.restore();
      });

      if (aliveCount > 0) {
        requestAnimationFrame(() => this.animate());
      } else {
        this.active = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  // ------------------------------------------------------------------------
  // 4. 20-LEVEL CAMPAIGN CONFIGURATION
  // ------------------------------------------------------------------------
  const LEVELS = [
    // Easy Tier (Levels 1-5)
    { level: 1, title: 'Novice Memory', pairs: 2, gridClass: 'grid-2x2', timeLimit: 25, tier: 'easy', wildcard: 0, bomb: 0, freeze: 0 },
    { level: 2, title: 'First Steps', pairs: 3, gridClass: 'grid-3x2', timeLimit: 30, tier: 'easy', wildcard: 0, bomb: 0, freeze: 0 },
    { level: 3, title: 'Warm Up', pairs: 4, gridClass: 'grid-4x2', timeLimit: 35, tier: 'easy', wildcard: 0, bomb: 0, freeze: 0 },
    { level: 4, title: 'Memory Builder', pairs: 5, gridClass: 'grid-5x2', timeLimit: 40, tier: 'easy', wildcard: 0, bomb: 0, freeze: 0 },
    { level: 5, title: 'Easy Boss Test', pairs: 6, gridClass: 'grid-4x3', timeLimit: 35, tier: 'easy', wildcard: 0, bomb: 0, freeze: 0 },

    // Mid Tier (Levels 6-10)
    { level: 6, title: 'Wildcard Intro', pairs: 5, gridClass: 'grid-4x3', timeLimit: 40, tier: 'medium', wildcard: 1, bomb: 0, freeze: 0 },
    { level: 7, title: 'Pattern Recognition', pairs: 7, gridClass: 'grid-4x4', timeLimit: 45, tier: 'medium', wildcard: 1, bomb: 0, freeze: 0 },
    { level: 8, title: 'Classic Grid', pairs: 8, gridClass: 'grid-4x4', timeLimit: 50, tier: 'medium', wildcard: 0, bomb: 0, freeze: 1 },
    { level: 9, title: 'Ice Age Challenge', pairs: 9, gridClass: 'grid-6x3', timeLimit: 50, tier: 'medium', wildcard: 1, bomb: 0, freeze: 1 },
    { level: 10, title: 'Mid Boss Challenge', pairs: 10, gridClass: 'grid-5x4', timeLimit: 55, tier: 'medium', wildcard: 1, bomb: 1, freeze: 1 },

    // Hard Tier (Levels 11-15)
    { level: 11, title: 'Mind Minefield', pairs: 10, gridClass: 'grid-5x4', timeLimit: 50, tier: 'hard', wildcard: 1, bomb: 1, freeze: 1 },
    { level: 12, title: 'Sharp Focus', pairs: 11, gridClass: 'grid-6x4', timeLimit: 60, tier: 'hard', wildcard: 1, bomb: 1, freeze: 1 },
    { level: 13, title: 'Speed Memory', pairs: 12, gridClass: 'grid-6x4', timeLimit: 50, tier: 'hard', wildcard: 1, bomb: 2, freeze: 1 },
    { level: 14, title: 'Wild Frozen Chaos', pairs: 12, gridClass: 'grid-6x4', timeLimit: 55, tier: 'hard', wildcard: 2, bomb: 1, freeze: 2 },
    { level: 15, title: 'Hard Boss: Warp Hazard', pairs: 13, gridClass: 'grid-6x5', timeLimit: 60, tier: 'hard', wildcard: 2, bomb: 2, freeze: 2, shuffleHazard: true },

    // Harder / Expert Tier (Levels 16-20)
    { level: 16, title: 'Grand Grid', pairs: 14, gridClass: 'grid-6x5', timeLimit: 65, tier: 'expert', wildcard: 2, bomb: 2, freeze: 2 },
    { level: 17, title: 'Memory Marathon', pairs: 15, gridClass: 'grid-6x5', timeLimit: 70, tier: 'expert', wildcard: 2, bomb: 2, freeze: 2 },
    { level: 18, title: 'Ultimate Grid', pairs: 16, gridClass: 'grid-6x6', timeLimit: 75, tier: 'expert', wildcard: 2, bomb: 3, freeze: 2 },
    { level: 19, title: 'Master Mind', pairs: 17, gridClass: 'grid-6x6', timeLimit: 70, tier: 'expert', wildcard: 3, bomb: 2, freeze: 3 },
    { level: 20, title: 'THE ULTIMATE BOSS', pairs: 17, gridClass: 'grid-6x6', timeLimit: 75, tier: 'expert', wildcard: 3, bomb: 3, freeze: 3, shuffleHazard: true }
  ];

  const EMOJI_CATEGORIES = {
    animals: ['🐶', '🐱', '🦊', '🦁', '🐯', '🐼', '🐨', '🦄', '🐸', '🐙', '🦋', '🦉', '🐝', '🦩', '🦔', '🐬', '🦥', '🦘'],
    food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🍦', '🍩', '🥑', '🍣', '🍓', '🌮', '🥐', '🍇', '🍉', '🧁', '🍩', '🍪', '🥞'],
    scifi: ['🚀', '🛸', '👾', '🤖', '🪐', '🌟', '👨‍🚀', '☄️', '🔮', '🧬', '📡', '🌌', '🛰️', '⚡', '🌙', '🌌', '🌠', '🔋'],
    emotions: ['🤩', '😎', '🥳', '🤯', '🎃', '👻', '🤖', '👽', '🤡', '🤠', '😇', '🤪', '😷', '🦄', '💖', '🔥', '✨', '⚡'],
    sports: ['⚽', '🏀', '🎾', '🥊', '🏎️', '🎨', '🎮', '🎯', '🎸', '🛹', '🏆', '🎳', '🏄‍♂️', '🎿', '🚴‍♂️', '🥇', '🧩', '🎳']
  };

  // ------------------------------------------------------------------------
  // 5. GAME MANAGER CLASS
  // ------------------------------------------------------------------------
  class MemoryGameManager {
    constructor() {
      this.audio = new AudioController();
      this.bg = new BgCanvas('bg-canvas');
      this.confetti = new ConfettiEngine('confetti-canvas');

      // SPA Views
      this.homeView = document.getElementById('home-view');
      this.gameView = document.getElementById('game-view');

      // Home View Elements
      this.homeDarkLightToggle = document.getElementById('home-dark-light-toggle');
      this.homeSoundBtn = document.getElementById('home-sound-btn');
      this.homeHelpBtn = document.getElementById('home-help-btn');
      this.startCampaignBtn = document.getElementById('start-campaign-btn');
      this.scrollLevelsBtn = document.getElementById('scroll-levels-btn');

      this.homeTotalStars = document.getElementById('home-total-stars');
      this.homeUnlockedCount = document.getElementById('home-unlocked-count');
      this.homeBestStreak = document.getElementById('home-best-streak');
      this.homeLevelGrid = document.getElementById('home-level-nodes-grid');
      this.heroTiltCard = document.getElementById('hero-tilt-card');
      this.orbsContainer = document.getElementById('orbs-container');

      // Game View Elements
      this.backToHomeBtn = document.getElementById('back-to-home-btn');
      this.gameDarkLightToggle = document.getElementById('game-dark-light-toggle');
      this.gameSoundBtn = document.getElementById('game-sound-btn');
      this.gameHelpBtn = document.getElementById('game-help-btn');
      this.gameMapBtn = document.getElementById('game-map-btn');

      this.cardGrid = document.getElementById('card-grid');
      this.statTime = document.getElementById('stat-time');
      this.statMoves = document.getElementById('stat-moves');
      this.statScore = document.getElementById('stat-score');
      this.statTotalStars = document.getElementById('stat-total-stars');

      this.currentLevelNum = document.getElementById('current-level-num');
      this.levelTierBadge = document.getElementById('level-tier-badge');
      this.levelTitleText = document.getElementById('level-title-text');
      this.campaignProgressText = document.getElementById('campaign-progress-text');
      this.campaignProgressFill = document.getElementById('campaign-progress-fill');

      this.gameCategorySelect = document.getElementById('game-category-select');
      this.restartBtn = document.getElementById('restart-btn');

      this.powerupPeek = document.getElementById('powerup-peek');
      this.powerupHint = document.getElementById('powerup-hint');
      this.peekCountBadge = document.getElementById('peek-count');
      this.hintCountBadge = document.getElementById('hint-count');
      this.comboBadge = document.getElementById('combo-badge');
      this.comboText = document.getElementById('combo-text');
      this.freezeIndicator = document.getElementById('freeze-indicator');

      // Modals
      this.levelMapModal = document.getElementById('level-map-modal');
      this.victoryModal = document.getElementById('victory-modal');
      this.gameoverModal = document.getElementById('gameover-modal');
      this.helpModal = document.getElementById('help-modal');

      this.closeMapBtn = document.getElementById('close-map-btn');
      this.nextLevelBtn = document.getElementById('next-level-btn');
      this.replayLevelBtn = document.getElementById('replay-level-btn');
      this.homeFromVictoryBtn = document.getElementById('home-from-victory-btn');
      this.tryAgainBtn = document.getElementById('try-again-btn');
      this.homeFromGameoverBtn = document.getElementById('home-from-gameover-btn');
      this.closeHelpBtn = document.getElementById('close-help-btn');
      this.gotItBtn = document.getElementById('got-it-btn');
      this.modalLevelNodesGrid = document.getElementById('modal-level-nodes-grid');

      // State Variables
      this.currentLevel = 1;
      this.selectedPack = 'animals';
      this.cards = [];
      this.flippedCards = [];
      this.matchedPairs = 0;
      this.totalPairs = 0;
      this.moves = 0;
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.timer = null;
      this.timeRemaining = 0;
      this.isFreezeActive = false;
      this.freezeTimer = null;
      this.isGameActive = false;
      this.isBoardLocked = false;
      this.peeksRemaining = 1;
      this.hintsRemaining = 1;
      this.shuffleHazardInterval = null;

      // Campaign Progress Storage
      this.unlockedLevels = parseInt(localStorage.getItem('emoji_memory_unlocked') || '1', 10);
      this.levelStars = JSON.parse(localStorage.getItem('emoji_memory_stars') || '{}');
      this.bestCombo = parseInt(localStorage.getItem('emoji_memory_bestcombo') || '0', 10);

      // Light/Dark Theme Storage
      this.isDarkMode = localStorage.getItem('emoji_memory_theme') !== 'light';
      this.applyTheme();

      this.bindEvents();
      this.initHeroTiltFX();
      this.initFloatingOrbs();
      this.renderHomeOverview();
    }

    applyTheme() {
      if (this.isDarkMode) {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        this.homeDarkLightToggle.querySelector('i').className = 'fa-solid fa-moon';
        this.gameDarkLightToggle.querySelector('i').className = 'fa-solid fa-moon';
      } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        this.homeDarkLightToggle.querySelector('i').className = 'fa-solid fa-sun';
        this.gameDarkLightToggle.querySelector('i').className = 'fa-solid fa-sun';
      }
    }

    toggleTheme() {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem('emoji_memory_theme', this.isDarkMode ? 'dark' : 'light');
      this.applyTheme();
    }

    bindEvents() {
      this.homeDarkLightToggle.addEventListener('click', () => this.toggleTheme());
      this.gameDarkLightToggle.addEventListener('click', () => this.toggleTheme());

      this.homeSoundBtn.addEventListener('click', () => this.toggleSound());
      this.gameSoundBtn.addEventListener('click', () => this.toggleSound());

      this.homeHelpBtn.addEventListener('click', () => this.openModal(this.helpModal));
      this.gameHelpBtn.addEventListener('click', () => this.openModal(this.helpModal));
      this.closeHelpBtn.addEventListener('click', () => this.closeModal(this.helpModal));
      this.gotItBtn.addEventListener('click', () => this.closeModal(this.helpModal));

      // View Switch Actions
      this.startCampaignBtn.addEventListener('click', () => {
        this.audio.playWhoosh();
        this.startLevel(1);
      });

      this.scrollLevelsBtn.addEventListener('click', () => {
        const el = document.getElementById('campaign-map-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });

      this.backToHomeBtn.addEventListener('click', () => {
        this.audio.playWhoosh();
        this.showHomeView();
      });

      this.gameMapBtn.addEventListener('click', () => this.openLevelMapModal());
      this.closeMapBtn.addEventListener('click', () => this.closeModal(this.levelMapModal));

      // Pack Cards Selector on Home View
      document.querySelectorAll('.pack-card').forEach(card => {
        card.addEventListener('click', () => {
          document.querySelectorAll('.pack-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          this.selectedPack = card.dataset.pack;
          this.gameCategorySelect.value = this.selectedPack;
          this.audio.playFlip();
        });
      });

      this.gameCategorySelect.addEventListener('change', (e) => {
        this.selectedPack = e.target.value;
        this.loadLevel(this.currentLevel);
      });

      this.restartBtn.addEventListener('click', () => this.loadLevel(this.currentLevel));

      this.powerupPeek.addEventListener('click', () => this.usePeekPowerup());
      this.powerupHint.addEventListener('click', () => this.useHintPowerup());

      // Modal Actions (Next Level, Retry, Home)
      this.nextLevelBtn.addEventListener('click', () => {
        this.closeModal(this.victoryModal);
        if (this.currentLevel < 20) {
          this.loadLevel(this.currentLevel + 1);
        } else {
          this.showHomeView();
        }
      });

      this.replayLevelBtn.addEventListener('click', () => {
        this.closeModal(this.victoryModal);
        this.loadLevel(this.currentLevel);
      });

      this.homeFromVictoryBtn.addEventListener('click', () => {
        this.closeModal(this.victoryModal);
        this.audio.playWhoosh();
        this.showHomeView();
      });

      this.tryAgainBtn.addEventListener('click', () => {
        this.closeModal(this.gameoverModal);
        this.loadLevel(this.currentLevel);
      });

      this.homeFromGameoverBtn.addEventListener('click', () => {
        this.closeModal(this.gameoverModal);
        this.audio.playWhoosh();
        this.showHomeView();
      });
    }

    initHeroTiltFX() {
      if (!this.heroTiltCard) return;
      document.addEventListener('mousemove', (e) => {
        if (!this.homeView.classList.contains('active')) return;
        const x = (window.innerWidth / 2 - e.pageX) / 35;
        const y = (window.innerHeight / 2 - e.pageY) / 35;
        this.heroTiltCard.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
      });
    }

    initFloatingOrbs() {
      if (!this.orbsContainer) return;
      this.orbsContainer.innerHTML = '';
      const emojis = ['🧠', '🦄', '⚡', '🌟', '🍕', '🚀', '🃏', '🧊', '💣', '🏆', '💎', '🎉'];
      for (let i = 0; i < 15; i++) {
        const orb = document.createElement('div');
        orb.className = 'orb';
        orb.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        orb.style.left = `${Math.random() * 95}%`;
        orb.style.animationDuration = `${8 + Math.random() * 10}s`;
        orb.style.animationDelay = `${Math.random() * 5}s`;
        this.orbsContainer.appendChild(orb);
      }
    }

    showHomeView() {
      this.stopTimer();
      this.stopFreeze();
      this.stopShuffleHazard();

      this.gameView.classList.remove('active');
      this.homeView.classList.add('active');
      this.renderHomeOverview();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    startLevel(lvlNum) {
      this.homeView.classList.remove('active');
      this.gameView.classList.add('active');
      this.loadLevel(lvlNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    toggleSound() {
      this.audio.isMuted = !this.audio.isMuted;
      const icon1 = this.homeSoundBtn.querySelector('i');
      const icon2 = this.gameSoundBtn.querySelector('i');
      if (this.audio.isMuted) {
        icon1.className = icon2.className = 'fa-solid fa-volume-xmark';
        this.homeSoundBtn.style.opacity = this.gameSoundBtn.style.opacity = '0.6';
      } else {
        icon1.className = icon2.className = 'fa-solid fa-volume-high';
        this.homeSoundBtn.style.opacity = this.gameSoundBtn.style.opacity = '1';
        this.audio.playFlip();
      }
    }

    renderHomeOverview() {
      let totalStars = 0;
      Object.values(this.levelStars).forEach(s => totalStars += s);

      this.homeTotalStars.textContent = `${totalStars} / 60`;
      this.homeUnlockedCount.textContent = `${Math.min(20, this.unlockedLevels)} / 20`;
      this.homeBestStreak.textContent = `${this.bestCombo}x`;

      this.homeLevelGrid.innerHTML = '';
      LEVELS.forEach(lvl => {
        const isUnlocked = lvl.level <= this.unlockedLevels;
        const stars = this.levelStars[lvl.level] || 0;

        const card = document.createElement('div');
        card.className = `home-level-card ${!isUnlocked ? 'locked' : ''} tier-${lvl.tier}`;

        let starsHtml = '';
        for (let i = 0; i < 3; i++) {
          starsHtml += `<i class="fa-solid fa-star" style="color: ${i < stars ? '#facc15' : 'rgba(125,125,125,0.3)'}"></i>`;
        }

        card.innerHTML = `
          <div class="hl-top">
            <span class="hl-num">Level ${lvl.level}</span>
            <span class="hl-tier-badge tier-${lvl.tier}">${lvl.tier.toUpperCase()}</span>
          </div>
          <div class="hl-title">${lvl.title}</div>
          <div class="hl-meta">
            <span>⏱️ ${lvl.timeLimit}s</span>
            <span>🧩 ${lvl.pairs} Pairs</span>
          </div>
          <div class="hl-stars">${starsHtml}</div>
          <div class="hl-action">${isUnlocked ? '▶ PLAY LEVEL' : '🔒 LOCKED'}</div>
        `;

        if (isUnlocked) {
          card.addEventListener('click', () => {
            this.audio.playWhoosh();
            this.startLevel(lvl.level);
          });
        }

        this.homeLevelGrid.appendChild(card);
      });
    }

    loadLevel(lvlNum) {
      this.currentLevel = lvlNum;
      const lvlConfig = LEVELS.find(l => l.level === lvlNum) || LEVELS[0];

      this.stopTimer();
      this.stopFreeze();
      this.stopShuffleHazard();

      this.moves = 0;
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.matchedPairs = 0;
      this.flippedCards = [];
      this.isBoardLocked = false;
      this.isGameActive = false;
      this.peeksRemaining = 1;
      this.hintsRemaining = 1;

      this.totalPairs = lvlConfig.pairs;
      this.timeRemaining = lvlConfig.timeLimit;

      this.currentLevelNum.textContent = lvlConfig.level;
      this.levelTitleText.textContent = `Level ${lvlConfig.level}: ${lvlConfig.title}`;
      this.levelTierBadge.textContent = lvlConfig.tier.toUpperCase();
      this.levelTierBadge.className = `tier-tag tier-${lvlConfig.tier}`;

      this.updateCampaignProgress();
      this.updateStatsUI();
      this.updatePowerupUI();
      this.hideComboBadge();
      this.formatTimerDisplay(this.timeRemaining);

      const categoryKey = this.selectedPack;
      const fullSet = [...EMOJI_CATEGORIES[categoryKey]];
      this.shuffleArray(fullSet);

      const normalPairsCount = lvlConfig.pairs - lvlConfig.wildcard - lvlConfig.bomb - lvlConfig.freeze;
      const normalEmojis = fullSet.slice(0, normalPairsCount);

      let cardList = [];
      normalEmojis.forEach(e => cardList.push({ type: 'normal', emoji: e }, { type: 'normal', emoji: e }));

      for (let i = 0; i < lvlConfig.wildcard; i++) cardList.push({ type: 'wildcard', emoji: '🃏' }, { type: 'wildcard', emoji: '🃏' });
      for (let i = 0; i < lvlConfig.freeze; i++) cardList.push({ type: 'freeze', emoji: '🧊' }, { type: 'freeze', emoji: '🧊' });
      for (let i = 0; i < lvlConfig.bomb; i++) cardList.push({ type: 'bomb', emoji: '💣' }, { type: 'bomb', emoji: '💣' });

      this.shuffleArray(cardList);

      this.cardGrid.className = `card-grid ${lvlConfig.gridClass}`;
      this.cardGrid.innerHTML = '';

      this.cards = cardList.map((cardData, idx) => {
        const cardEl = document.createElement('div');
        cardEl.className = `card card-${cardData.type}`;
        cardEl.dataset.type = cardData.type;
        cardEl.dataset.emoji = cardData.emoji;
        cardEl.dataset.index = idx;

        cardEl.innerHTML = `
          <div class="card-face card-back">?</div>
          <div class="card-face card-front">
            <span class="emoji-symbol">${cardData.emoji}</span>
          </div>
        `;

        cardEl.addEventListener('click', () => this.handleCardClick(cardEl));
        this.cardGrid.appendChild(cardEl);
        return cardEl;
      });

      if (lvlConfig.shuffleHazard) {
        this.startShuffleHazard();
      }
    }

    startTimer() {
      if (this.timer) return;
      this.isGameActive = true;

      this.timer = setInterval(() => {
        if (!this.isFreezeActive) {
          this.timeRemaining--;
          this.formatTimerDisplay(this.timeRemaining);
          if (this.timeRemaining <= 0) {
            this.handleGameOver();
          }
        }
      }, 1000);
    }

    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    triggerFreeze() {
      this.audio.playFreeze();
      this.isFreezeActive = true;
      this.freezeIndicator.classList.remove('hidden');

      if (this.freezeTimer) clearTimeout(this.freezeTimer);
      this.freezeTimer = setTimeout(() => {
        this.stopFreeze();
      }, 6000);
    }

    stopFreeze() {
      this.isFreezeActive = false;
      this.freezeIndicator.classList.add('hidden');
      if (this.freezeTimer) {
        clearTimeout(this.freezeTimer);
        this.freezeTimer = null;
      }
    }

    startShuffleHazard() {
      this.shuffleHazardInterval = setInterval(() => {
        if (this.isGameActive && !this.isBoardLocked) {
          this.performBoardShuffle();
        }
      }, 15000);
    }

    stopShuffleHazard() {
      if (this.shuffleHazardInterval) {
        clearInterval(this.shuffleHazardInterval);
        this.shuffleHazardInterval = null;
      }
    }

    performBoardShuffle() {
      const unmatched = this.cards.filter(c => !c.classList.contains('matched') && !c.classList.contains('flipped'));
      if (unmatched.length < 4) return;

      this.isBoardLocked = true;
      unmatched.forEach(c => c.style.transform = 'scale(0.8) rotate(15deg)');

      setTimeout(() => {
        for (let i = 0; i < unmatched.length; i++) {
          const j = Math.floor(Math.random() * unmatched.length);
          this.cardGrid.appendChild(unmatched[j]);
        }
        unmatched.forEach(c => c.style.transform = '');
        this.isBoardLocked = false;
      }, 400);
    }

    formatTimerDisplay(sec) {
      const s = Math.max(0, sec);
      const minutes = Math.floor(s / 60);
      const seconds = s % 60;
      this.statTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    handleCardClick(cardEl) {
      if (
        this.isBoardLocked ||
        cardEl.classList.contains('flipped') ||
        cardEl.classList.contains('matched')
      ) {
        return;
      }

      if (!this.isGameActive) {
        this.startTimer();
      }

      const cardType = cardEl.dataset.type;

      if (cardType === 'bomb') {
        this.audio.playBomb();
        cardEl.classList.add('flipped');
        this.timeRemaining = Math.max(1, this.timeRemaining - 5);
        this.score = Math.max(0, this.score - 100);
        this.combo = 0;
        this.hideComboBadge();
        this.updateStatsUI();

        this.isBoardLocked = true;
        setTimeout(() => cardEl.classList.add('shake'), 300);
        setTimeout(() => {
          cardEl.classList.remove('flipped', 'shake');
          this.isBoardLocked = false;
        }, 1000);
        return;
      }

      this.audio.playFlip();
      cardEl.classList.add('flipped');
      this.flippedCards.push(cardEl);

      if (this.flippedCards.length === 2) {
        this.moves++;
        this.updateStatsUI();
        this.checkMatch();
      }
    }

    checkMatch() {
      this.isBoardLocked = true;
      const [card1, card2] = this.flippedCards;
      const type1 = card1.dataset.type;
      const type2 = card2.dataset.type;
      const emoji1 = card1.dataset.emoji;
      const emoji2 = card2.dataset.emoji;

      const isWildcardMatch = (type1 === 'wildcard' || type2 === 'wildcard');
      const isNormalMatch = (emoji1 === emoji2);
      const isMatch = isNormalMatch || isWildcardMatch;

      if (isMatch) {
        setTimeout(() => {
          card1.classList.add('matched');
          card2.classList.add('matched');
          this.audio.playMatch();

          if (type1 === 'freeze' || type2 === 'freeze') {
            this.triggerFreeze();
          }

          this.matchedPairs++;
          this.combo++;
          if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
            if (this.maxCombo > this.bestCombo) {
              this.bestCombo = this.maxCombo;
              localStorage.setItem('emoji_memory_bestcombo', this.bestCombo.toString());
            }
          }

          const comboBonus = (this.combo - 1) * 50;
          this.score += 100 + comboBonus;

          if (this.combo >= 2) {
            this.showComboBadge(`${this.combo}x Combo! 🔥`);
          }

          this.flippedCards = [];
          this.isBoardLocked = false;
          this.updateStatsUI();

          if (this.matchedPairs === this.totalPairs) {
            this.handleVictory();
          }
        }, 350);
      } else {
        this.combo = 0;
        this.hideComboBadge();
        setTimeout(() => {
          card1.classList.add('shake');
          card2.classList.add('shake');
          this.audio.playMismatch();
        }, 350);

        setTimeout(() => {
          card1.classList.remove('flipped', 'shake');
          card2.classList.remove('flipped', 'shake');
          this.flippedCards = [];
          this.isBoardLocked = false;
        }, 900);
      }
    }

    usePeekPowerup() {
      if (this.peeksRemaining <= 0 || this.isBoardLocked || !this.isGameActive) return;
      this.peeksRemaining--;
      this.updatePowerupUI();
      this.audio.playPowerup();
      this.isBoardLocked = true;

      const unrevealed = this.cards.filter(c => !c.classList.contains('matched'));
      unrevealed.forEach(c => c.classList.add('flipped'));

      setTimeout(() => {
        unrevealed.forEach(c => {
          if (!this.flippedCards.includes(c)) {
            c.classList.remove('flipped');
          }
        });
        this.isBoardLocked = false;
      }, 1500);
    }

    useHintPowerup() {
      if (this.hintsRemaining <= 0 || this.isBoardLocked || !this.isGameActive) return;

      const unrevealed = this.cards.filter(c => !c.classList.contains('matched') && !c.classList.contains('flipped') && c.dataset.type !== 'bomb');
      const map = {};
      let matchPair = null;

      for (let c of unrevealed) {
        const em = c.dataset.emoji;
        if (map[em]) {
          matchPair = [map[em], c];
          break;
        }
        map[em] = c;
      }

      if (matchPair) {
        this.hintsRemaining--;
        this.updatePowerupUI();
        this.audio.playPowerup();

        matchPair[0].classList.add('hint-glow');
        matchPair[1].classList.add('hint-glow');

        setTimeout(() => {
          matchPair[0].classList.remove('hint-glow');
          matchPair[1].classList.remove('hint-glow');
        }, 1200);
      }
    }

    showComboBadge(text) {
      this.comboText.textContent = text;
      this.comboBadge.classList.remove('hidden');
    }

    hideComboBadge() {
      this.comboBadge.classList.add('hidden');
    }

    handleVictory() {
      this.stopTimer();
      this.stopFreeze();
      this.stopShuffleHazard();

      this.audio.playVictory();
      this.confetti.trigger();

      this.score += this.timeRemaining * 20;

      const lvlConfig = LEVELS.find(l => l.level === this.currentLevel);
      const minMoves = lvlConfig.pairs;
      let stars = 1;
      if (this.moves <= Math.floor(minMoves * 1.3)) stars = 3;
      else if (this.moves <= Math.floor(minMoves * 1.8)) stars = 2;

      this.saveLevelProgress(this.currentLevel, stars);

      document.getElementById('modal-score').textContent = this.score.toLocaleString();
      document.getElementById('modal-moves').textContent = this.moves;
      document.getElementById('modal-combo').textContent = `${this.maxCombo}x`;
      document.getElementById('modal-time').textContent = this.statTime.textContent;

      const starsContainer = document.getElementById('modal-stars');
      starsContainer.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const star = document.createElement('i');
        star.className = `fa-solid fa-star ${i < stars ? 'star-active' : ''}`;
        starsContainer.appendChild(star);
      }

      setTimeout(() => this.openModal(this.victoryModal), 400);
    }

    handleGameOver() {
      this.stopTimer();
      this.stopFreeze();
      this.stopShuffleHazard();

      this.audio.playMismatch();
      this.openModal(this.gameoverModal);
    }

    saveLevelProgress(level, stars) {
      const currentStars = this.levelStars[level] || 0;
      if (stars > currentStars) {
        this.levelStars[level] = stars;
        localStorage.setItem('emoji_memory_stars', JSON.stringify(this.levelStars));
      }

      if (level >= this.unlockedLevels && level < 20) {
        this.unlockedLevels = level + 1;
        localStorage.setItem('emoji_memory_unlocked', this.unlockedLevels.toString());
      }
      this.updateCampaignProgress();
    }

    updateCampaignProgress() {
      const completedCount = Math.min(20, this.unlockedLevels - 1);
      this.campaignProgressText.textContent = `${completedCount} / 20 Completed`;
      this.campaignProgressFill.style.width = `${(completedCount / 20) * 100}%`;

      let totalStars = 0;
      Object.values(this.levelStars).forEach(s => totalStars += s);
      this.statTotalStars.textContent = `${totalStars} / 60`;
    }

    openLevelMapModal() {
      this.modalLevelNodesGrid.innerHTML = '';
      LEVELS.forEach(lvl => {
        const isUnlocked = lvl.level <= this.unlockedLevels;
        const isCurrent = lvl.level === this.currentLevel;
        const stars = this.levelStars[lvl.level] || 0;

        const node = document.createElement('div');
        node.className = `level-node ${!isUnlocked ? 'locked' : ''} ${isCurrent ? 'current' : ''}`;

        let starsHtml = '';
        if (isUnlocked) {
          starsHtml = '<div class="node-stars">';
          for (let i = 0; i < 3; i++) {
            starsHtml += `<i class="fa-solid fa-star" style="color: ${i < stars ? '#facc15' : 'rgba(125,125,125,0.3)'}"></i>`;
          }
          starsHtml += '</div>';
        }

        node.innerHTML = `
          <span class="node-number">${lvl.level}</span>
          ${isUnlocked ? starsHtml : '<i class="fa-solid fa-lock node-lock"></i>'}
        `;

        if (isUnlocked) {
          node.addEventListener('click', () => {
            this.closeModal(this.levelMapModal);
            this.startLevel(lvl.level);
          });
        }

        this.modalLevelNodesGrid.appendChild(node);
      });

      this.openModal(this.levelMapModal);
    }

    updateStatsUI() {
      this.statMoves.textContent = this.moves;
      this.statScore.textContent = this.score.toLocaleString();
    }

    updatePowerupUI() {
      this.peekCountBadge.textContent = this.peeksRemaining;
      this.hintCountBadge.textContent = this.hintsRemaining;
      this.powerupPeek.disabled = this.peeksRemaining <= 0;
      this.powerupHint.disabled = this.hintsRemaining <= 0;
    }

    openModal(modal) { modal.classList.add('active'); }
    closeModal(modal) { modal.classList.remove('active'); }

    shuffleArray(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
  }

  // Initialize Application Engine
  window.gameApp = new MemoryGameManager();
});
