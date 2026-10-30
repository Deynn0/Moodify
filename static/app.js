/**
 * MOODIFY AI — CORE APPLICATION ENGINE
 * Deep Learning Emotion Intelligence & Sentiment Radar
 */

(function () {
  'use strict';

  // Emotion Metadata Configuration
  const EMOTIONS = {
    joy: {
      name: 'Joy',
      emoji: '😄',
      color: '#f59e0b',
      accentGlow: 'rgba(245, 158, 11, 0.4)',
      narrative: 'Radiates positivity, contentment, and vibrant energy. The model detected strong markers of cheerfulness, satisfaction, or celebration.',
      valence: 'Positive (+0.88)',
      arousal: 'High (+0.75)'
    },
    love: {
      name: 'Love',
      emoji: '❤️',
      color: '#ec4899',
      accentGlow: 'rgba(236, 72, 153, 0.4)',
      narrative: 'Infused with affection, deep bonding, gratitude, and empathy. The sentence exhibits emotional closeness and heartfelt warmth.',
      valence: 'Very Positive (+0.95)',
      arousal: 'Moderate (+0.55)'
    },
    sadness: {
      name: 'Sadness',
      emoji: '😢',
      color: '#3b82f6',
      accentGlow: 'rgba(59, 130, 246, 0.4)',
      narrative: 'Conveys melancholia, grief, regret, or quiet introspection. Lower linguistic arousal paired with downward emotional inflection.',
      valence: 'Negative (-0.82)',
      arousal: 'Low (-0.60)'
    },
    anger: {
      name: 'Anger',
      emoji: '😡',
      color: '#ef4444',
      accentGlow: 'rgba(239, 68, 68, 0.4)',
      narrative: 'High-friction emotional resonance characterized by frustration, confrontation, or perceived injustice and tension.',
      valence: 'Negative (-0.85)',
      arousal: 'Very High (+0.92)'
    },
    fear: {
      name: 'Fear',
      emoji: '😨',
      color: '#8b5cf6',
      accentGlow: 'rgba(139, 92, 246, 0.4)',
      narrative: 'Expresses apprehension, vulnerability, suspense, or perceived threat. Heightened sensory arousal coupled with anxious vigilance.',
      valence: 'Negative (-0.78)',
      arousal: 'High (+0.84)'
    },
    surprise: {
      name: 'Surprise',
      emoji: '😲',
      color: '#06b6d4',
      accentGlow: 'rgba(6, 182, 212, 0.4)',
      narrative: 'Spontaneous cognitive reorientation triggered by unexpected stimuli, astonishment, disbelief, or sudden revelation.',
      valence: 'Ambivalent (+0.35)',
      arousal: 'Very High (+0.88)'
    }
  };

  const EMOTION_KEYS = ['joy', 'love', 'sadness', 'anger', 'fear', 'surprise'];

  // DOM Elements
  const elements = {
    // Header & Status
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIcon: document.getElementById('soundIcon'),
    soundLabel: document.getElementById('soundLabel'),

    // Input Section
    textarea: document.getElementById('emotionTextInput'),
    charCount: document.getElementById('charCount'),
    wordCount: document.getElementById('wordCount'),
    tokenCount: document.getElementById('tokenCount'),
    tokenCapacityFill: document.getElementById('tokenCapacityFill'),
    voiceBtn: document.getElementById('voiceInputBtn'),
    pasteBtn: document.getElementById('pasteInputBtn'),
    clearBtn: document.getElementById('clearInputBtn'),
    randomPromptBtn: document.getElementById('randomPromptBtn'),
    chipsContainer: document.getElementById('chipsContainer'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    analyzeBtnText: document.getElementById('analyzeBtnText'),

    // Results
    dominantCard: document.getElementById('dominantMoodCard'),
    dominantEmoji: document.getElementById('dominantEmoji'),
    dominantName: document.getElementById('dominantEmotionName'),
    confidenceBadge: document.getElementById('confidenceBadge'),
    certaintyRating: document.getElementById('certaintyRating'),
    valenceVal: document.getElementById('valenceVal'),
    arousalVal: document.getElementById('arousalVal'),
    emotionNarrative: document.getElementById('emotionNarrative'),
    copyResultBtn: document.getElementById('copyResultBtn'),
    latencyStat: document.getElementById('latencyStat'),

    // Radar Canvas
    radarCanvas: document.getElementById('emotionRadarCanvas'),

    // History
    historyList: document.getElementById('historyList'),
    historyEmptyState: document.getElementById('historyEmptyState'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // State
  let state = {
    soundEnabled: true,
    isDarkTheme: true,
    isAnalyzing: false,
    isListening: false,
    lastAnalysis: null,
    currentProbabilities: {
      joy: 0,
      love: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0
    },
    targetProbabilities: {
      joy: 0,
      love: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0
    },
    history: []
  };

  // Audio Synthesis for Feedback
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playEmotionChime(emotion) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const chordFrequencies = {
        joy: [523.25, 659.25, 783.99, 1046.50],       // C Major chord (uplifting)
        love: [440.00, 554.37, 659.25, 880.00],      // A Major chord (warm)
        surprise: [587.33, 739.99, 880.00, 1174.66], // D Major / Lydian (bright sparkle)
        sadness: [392.00, 466.16, 587.33],           // G Minor chord (somber)
        fear: [311.13, 369.99, 440.00],              // Diminished (tense)
        anger: [220.00, 277.18, 329.63]              // Low distorted rumble
      };

      const notes = chordFrequencies[emotion] || [440, 554, 659];
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = (emotion === 'anger' || emotion === 'fear') ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.05 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6 + idx * 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + 0.7 + idx * 0.05);
      });
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  // Toast System
  function showToast(message, icon = '💡') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 2800);
  }

  // Server Health Checker
  async function checkServerHealth() {
    try {
      const response = await fetch('/health', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        if (data.model_loaded) {
          elements.statusDot.className = 'status-dot pulsing';
          elements.statusText.textContent = 'BiGRU Engine Live';
          elements.statusText.style.color = '#10b981';
          return true;
        } else {
          elements.statusDot.className = 'status-dot';
          elements.statusText.textContent = 'Model Loading...';
          elements.statusText.style.color = '#f59e0b';
          return false;
        }
      }
    } catch (err) {
      elements.statusDot.className = 'status-dot offline';
      elements.statusText.textContent = 'Backend Offline';
      elements.statusText.style.color = '#ef4444';
      return false;
    }
  }

  // Input Metrics Updater
  function updateInputMetrics() {
    const text = elements.textarea.value;
    const charLen = text.length;
    elements.charCount.textContent = charLen;

    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    elements.wordCount.textContent = words;

    // Sequence token approximation
    // BiGRU max sequence length is 50
    const approxTokens = trimmed ? trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).length : 0;
    elements.tokenCount.textContent = approxTokens;

    const percentage = Math.min(100, Math.round((approxTokens / 50) * 100));
    elements.tokenCapacityFill.style.width = `${percentage}%`;
    if (percentage > 90) {
      elements.tokenCapacityFill.style.backgroundColor = '#ef4444';
    } else if (percentage > 70) {
      elements.tokenCapacityFill.style.backgroundColor = '#f59e0b';
    } else {
      elements.tokenCapacityFill.style.backgroundColor = 'var(--mood-accent)';
    }
  }

  // Preprocess text preview
  function cleanText(text) {
    return text.toLowerCase()
      .replace(/'/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Analyze Emotion via API
  async function analyzeEmotion() {
    const rawText = elements.textarea.value.trim();
    if (!rawText) {
      showToast('Please type or select a sentence to analyze!', '⚠️');
      elements.textarea.focus();
      return;
    }

    if (state.isAnalyzing) return;
    state.isAnalyzing = true;
    elements.analyzeBtn.classList.add('loading');
    elements.analyzeBtnText.textContent = 'Predicting...';

    const startTime = performance.now();

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned ${response.status}`);
      }

      const data = await response.json();
      const elapsed = Math.round(performance.now() - startTime);
      elements.latencyStat.textContent = `${elapsed}ms (BiGRU)`;

      renderResults(data);
      saveToHistory(data);
      playEmotionChime(data.predicted_emotion);
      showToast(`Emotion identified as ${EMOTIONS[data.predicted_emotion]?.name || data.predicted_emotion}!`, EMOTIONS[data.predicted_emotion]?.emoji || '✨');

    } catch (err) {
      showToast(err.message || 'Error communicating with prediction server', '❌');
    } finally {
      state.isAnalyzing = false;
      elements.analyzeBtn.classList.remove('loading');
      elements.analyzeBtnText.textContent = 'Analyze Emotion';
    }
  }

  // Render Prediction Results
  function renderResults(data) {
    state.lastAnalysis = data;
    const dominantKey = data.predicted_emotion.toLowerCase();
    const meta = EMOTIONS[dominantKey] || {
      name: dominantKey,
      emoji: '✨',
      color: '#6366f1',
      narrative: 'Emotion detected by deep neural network classifier.',
      valence: 'Neutral',
      arousal: 'Moderate'
    };

    // Update body data-mood for global ambient illumination
    document.body.setAttribute('data-mood', dominantKey);

    // Dominant Card
    elements.dominantCard.classList.add('has-result');
    elements.dominantEmoji.textContent = meta.emoji;
    elements.dominantName.textContent = meta.name;
    elements.dominantName.style.color = meta.color;

    const confidencePct = (data.confidence * 100).toFixed(1);
    elements.confidenceBadge.textContent = `${confidencePct}%`;
    elements.confidenceBadge.style.borderColor = meta.color;

    let ratingText = 'Low Confidence';
    if (data.confidence >= 0.75) ratingText = 'Very High Confidence';
    else if (data.confidence >= 0.50) ratingText = 'Strong Signal';
    else if (data.confidence >= 0.35) ratingText = 'Moderate Signal';
    elements.certaintyRating.textContent = ratingText;

    elements.valenceVal.textContent = meta.valence;
    elements.arousalVal.textContent = meta.arousal;
    elements.emotionNarrative.textContent = meta.narrative;

    // Update Probability Bars
    const probs = data.all_probabilities;
    state.targetProbabilities = { ...probs };

    EMOTION_KEYS.forEach(key => {
      const prob = probs[key] || 0;
      const pct = (prob * 100).toFixed(1);
      const textElem = document.getElementById(`prob-${key}`);
      const fillElem = document.getElementById(`fill-${key}`);
      const itemElem = document.querySelector(`.spectrum-item[data-emotion="${key}"]`);

      if (textElem) textElem.textContent = `${pct}%`;
      if (fillElem) fillElem.style.width = `${pct}%`;

      if (itemElem) {
        if (key === dominantKey) {
          itemElem.classList.add('top-rank');
        } else {
          itemElem.classList.remove('top-rank');
        }
      }
    });

    // Start Radar Canvas Interpolation
    animateRadar();
  }

  // Canvas Radar / Polar Chart Renderer
  let radarAnimFrame = null;
  function animateRadar() {
    let needsAnother = false;
    EMOTION_KEYS.forEach(key => {
      const target = state.targetProbabilities[key] || 0;
      const current = state.currentProbabilities[key] || 0;
      const diff = target - current;
      if (Math.abs(diff) > 0.005) {
        state.currentProbabilities[key] += diff * 0.15;
        needsAnother = true;
      } else {
        state.currentProbabilities[key] = target;
      }
    });

    drawRadarChart();

    if (needsAnother) {
      if (radarAnimFrame) cancelAnimationFrame(radarAnimFrame);
      radarAnimFrame = requestAnimationFrame(animateRadar);
    }
  }

  function drawRadarChart() {
    const canvas = elements.radarCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 34;

    ctx.clearRect(0, 0, width, height);

    const numAxes = EMOTION_KEYS.length;
    const angleStep = (Math.PI * 2) / numAxes;

    // Determine current theme colors
    const isDark = !document.body.classList.contains('theme-light');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    // Draw Concentric Polygons
    const levels = 4;
    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      ctx.beginPath();
      for (let i = 0; i < numAxes; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw Spokes & Labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 11px Outfit, sans-serif';

    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Spoke line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Axis Label
      const labelX = centerX + Math.cos(angle) * (radius + 20);
      const labelY = centerY + Math.sin(angle) * (radius + 20);
      const key = EMOTION_KEYS[i];
      const meta = EMOTIONS[key];

      ctx.fillStyle = (state.lastAnalysis?.predicted_emotion === key) ? meta.color : textColor;
      ctx.fillText(`${meta.emoji} ${meta.name}`, labelX, labelY);
    }

    // Draw Emotion Probability Polygon
    ctx.beginPath();
    const dataPoints = [];
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const key = EMOTION_KEYS[i];
      const val = Math.max(0.04, state.currentProbabilities[key] || 0.04);
      const pointRadius = radius * val;
      const px = centerX + Math.cos(angle) * pointRadius;
      const py = centerY + Math.sin(angle) * pointRadius;
      dataPoints.push({ x: px, y: py, color: EMOTIONS[key].color });

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Fill with active mood gradient
    const activeKey = state.lastAnalysis?.predicted_emotion || 'joy';
    const activeColor = EMOTIONS[activeKey]?.color || '#6366f1';

    const fillGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
    fillGrad.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
    fillGrad.addColorStop(1, `${activeColor}22`);

    ctx.fillStyle = fillGrad;
    ctx.fill();

    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw Vertex Nodes
    dataPoints.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = pt.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  // Session History Management
  function loadHistory() {
    try {
      const saved = localStorage.getItem('moodify_history');
      if (saved) {
        state.history = JSON.parse(saved);
        renderHistory();
      }
    } catch (e) {
      console.warn('Failed to parse history:', e);
    }
  }

  function saveToHistory(item) {
    const entry = {
      id: Date.now(),
      text: item.text,
      predicted_emotion: item.predicted_emotion,
      confidence: item.confidence,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    state.history.unshift(entry);
    if (state.history.length > 20) state.history.pop();
    try {
      localStorage.setItem('moodify_history', JSON.stringify(state.history));
    } catch (e) {}
    renderHistory();
  }

  function renderHistory() {
    if (state.history.length === 0) {
      elements.historyEmptyState.style.display = 'block';
      elements.historyList.style.display = 'none';
      return;
    }

    elements.historyEmptyState.style.display = 'none';
    elements.historyList.style.display = 'flex';
    elements.historyList.innerHTML = '';

    state.history.forEach(item => {
      const meta = EMOTIONS[item.predicted_emotion] || { emoji: '✨', name: item.predicted_emotion };
      const row = document.createElement('div');
      row.className = 'history-item';
      row.title = 'Click to re-run this sentence';
      row.innerHTML = `
        <div class="history-content">
          <div class="history-text">${escapeHtml(item.text)}</div>
          <div class="history-time">${item.time}</div>
        </div>
        <div class="history-badge" style="border-color: ${meta.color || 'var(--border-subtle)'};">
          <span>${meta.emoji}</span>
          <span>${meta.name}</span>
          <span style="opacity: 0.7;">(${(item.confidence * 100).toFixed(0)}%)</span>
        </div>
      `;
      row.addEventListener('click', () => {
        elements.textarea.value = item.text;
        updateInputMetrics();
        analyzeEmotion();
      });
      elements.historyList.appendChild(row);
    });
  }

  function escapeHtml(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
  }

  // Voice Speech Recognition
  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      elements.voiceBtn.style.opacity = '0.5';
      elements.voiceBtn.title = 'Speech recognition not supported in this browser';
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    elements.voiceBtn.addEventListener('click', () => {
      if (state.isListening) {
        recognition.stop();
        return;
      }
      try {
        recognition.start();
        state.isListening = true;
        elements.voiceBtn.classList.add('recording');
        elements.voiceBtn.querySelector('#micText').textContent = 'Listening...';
        showToast('Listening... Speak now!', '🎙️');
      } catch (err) {
        state.isListening = false;
        elements.voiceBtn.classList.remove('recording');
        elements.voiceBtn.querySelector('#micText').textContent = 'Voice';
      }
    });

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      elements.textarea.value = transcript;
      updateInputMetrics();
      showToast('Voice transcription captured!', '✨');
      analyzeEmotion();
    };

    recognition.onerror = () => {
      state.isListening = false;
      elements.voiceBtn.classList.remove('recording');
      elements.voiceBtn.querySelector('#micText').textContent = 'Voice';
      showToast('Microphone error or access denied', '⚠️');
    };

    recognition.onend = () => {
      state.isListening = false;
      elements.voiceBtn.classList.remove('recording');
      elements.voiceBtn.querySelector('#micText').textContent = 'Voice';
    };
  }

  // Event Listeners Initialization
  function initEvents() {
    // Input live events
    elements.textarea.addEventListener('input', updateInputMetrics);

    // Keyboard shortcut: Ctrl + Enter / Cmd + Enter
    elements.textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        analyzeEmotion();
      }
    });

    // Analyze Button
    elements.analyzeBtn.addEventListener('click', analyzeEmotion);

    // Clear Button
    elements.clearBtn.addEventListener('click', () => {
      elements.textarea.value = '';
      updateInputMetrics();
      elements.textarea.focus();
    });

    // Paste Button
    elements.pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          elements.textarea.value = text;
          updateInputMetrics();
          showToast('Text pasted from clipboard!', '📋');
        }
      } catch (e) {
        showToast('Clipboard access was blocked by browser', '⚠️');
      }
    });

    // Random Presets Button
    const samplePool = [
      "I was completely speechless when they presented the surprise birthday gift!",
      "I have never been so infuriated in my life, everything went terribly wrong.",
      "Cuddling with our rescue puppy by the warm fireplace makes me feel so safe and cherished.",
      "The dark basement steps started squeaking right behind me and I froze in terror.",
      "Everything feels heavy, gray, and distant today. I just want to disappear into my bed.",
      "We finally conquered our fears and celebrated reaching the peak of Mount Rainier!"
    ];

    elements.randomPromptBtn.addEventListener('click', () => {
      const randomSentence = samplePool[Math.floor(Math.random() * samplePool.length)];
      elements.textarea.value = randomSentence;
      updateInputMetrics();
      analyzeEmotion();
    });

    // Preset Chip Clicks
    elements.chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.preset-chip');
      if (chip && chip.dataset.text) {
        elements.textarea.value = chip.dataset.text;
        updateInputMetrics();
        analyzeEmotion();
      }
    });

    // Copy Result Report
    elements.copyResultBtn.addEventListener('click', () => {
      if (!state.lastAnalysis) {
        showToast('Run an analysis first to copy results!', 'ℹ️');
        return;
      }
      const data = state.lastAnalysis;
      const report = `[Moodify AI Emotion Report]\n` +
        `Text: "${data.text}"\n` +
        `Dominant Emotion: ${data.predicted_emotion.toUpperCase()} (${(data.confidence * 100).toFixed(1)}% confidence)\n\n` +
        `Probabilities Breakdown:\n` +
        Object.entries(data.all_probabilities)
          .map(([k, v]) => `• ${k.padEnd(9)}: ${(v * 100).toFixed(2)}%`)
          .join('\n');

      navigator.clipboard.writeText(report).then(() => {
        showToast('Emotion analysis report copied to clipboard!', '📋');
      });
    });

    // Theme Toggle
    elements.themeToggleBtn.addEventListener('click', () => {
      state.isDarkTheme = !state.isDarkTheme;
      if (state.isDarkTheme) {
        document.body.classList.remove('theme-light');
        elements.themeIcon.textContent = '🌙';
      } else {
        document.body.classList.add('theme-light');
        elements.themeIcon.textContent = '☀️';
      }
      drawRadarChart();
      try {
        localStorage.setItem('moodify_theme', state.isDarkTheme ? 'dark' : 'light');
      } catch (e) {}
    });

    // Sound Toggle
    elements.soundToggleBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      elements.soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
      elements.soundLabel.textContent = state.soundEnabled ? 'Sound On' : 'Muted';
      showToast(state.soundEnabled ? 'Audio feedback enabled' : 'Audio feedback muted', state.soundEnabled ? '🔊' : '🔇');
    });

    // Clear History Button
    elements.clearHistoryBtn.addEventListener('click', () => {
      state.history = [];
      try {
        localStorage.removeItem('moodify_history');
      } catch (e) {}
      renderHistory();
      showToast('Session history cleared', '🗑️');
    });

    // Window Resize -> Redraw Radar
    window.addEventListener('resize', () => {
      drawRadarChart();
    });
  }

  // Load Saved Preferences
  function loadPreferences() {
    try {
      const savedTheme = localStorage.getItem('moodify_theme');
      if (savedTheme === 'light') {
        state.isDarkTheme = false;
        document.body.classList.add('theme-light');
        elements.themeIcon.textContent = '☀️';
      }
    } catch (e) {}
  }

  // Initialize Application
  function init() {
    loadPreferences();
    loadHistory();
    initEvents();
    setupSpeechRecognition();
    checkServerHealth();
    drawRadarChart();

    // Initial default prompt for instant beauty
    elements.textarea.value = "I'm so thrilled and grateful for all the wonderful support on this journey!";
    updateInputMetrics();
    // Auto run first analysis after a brief delay
    setTimeout(() => {
      analyzeEmotion();
    }, 450);

    // Periodic health ping every 30s
    setInterval(checkServerHealth, 30000);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
