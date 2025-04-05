/**
 * ComfyJazz - Main Entry Point
 * A modular, modern implementation of ComfyJazz using Web Audio API
 */

import { defaultOptions } from './modules/config.js';
import {
  initAudioContext,
  playNote,
  playAudio,
  loadAudio,
  setMasterVolume,
} from './modules/audio-engine.js';
import {
  initNoteGenerator,
  generateNextMelodyNote,
  updateCurrentScaleProgression,
} from './modules/note-generator.js';
import { generateRandomInteger } from './modules/music-theory.js';

class ComfyJazz {
  constructor(options = {}) {
    // Initialize with merged options
    this.options = { ...defaultOptions, ...options };

    // State variables
    this.isPlaying = true;
    this.backgroundSound = null;
    this.lastFrameTime = 0;
    this.currentLoopPosition = 0;
    this.previousVolume = this.options.volume;

    // Initialize subsystems
    initAudioContext();
    initNoteGenerator();

    // Setup DOM event listeners
    this.setupEventListeners();

    // Connect to Twitch if channel provided
    this.connectTwitch();
  }

  /**
   * Sets up DOM event listeners
   */
  setupEventListeners() {
    // Volume control
    const volumeControl = document.getElementById('volume-control-adv');
    if (volumeControl) {
      volumeControl.value = this.options.volume;
      volumeControl.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        this.setVolume(volume);
        this.updateSliderValue(e.target, 'volume-value');
      });
    }

    // Mute button
    const muteButton = document.getElementById('mute-button');
    if (muteButton) {
      muteButton.addEventListener('click', () => {
        this.toggleMute();
      });
    }

    // Instrument selector
    const instrumentSelect = document.getElementById('instrument-select');
    if (instrumentSelect) {
      instrumentSelect.value = this.options.instrument;
      instrumentSelect.addEventListener('change', (e) => {
        this.changeInstrument(e.target.value);
      });
    }

    // Note density control
    const noteDensity = document.getElementById('note-density');
    if (noteDensity) {
      noteDensity.value = this.options.autoNotesChance;
      noteDensity.addEventListener('input', (e) => {
        this.adjustNoteDensity(parseFloat(e.target.value));
        this.updateSliderValue(e.target, 'density-value');
      });
    }

    // Note delay control
    const noteDelay = document.getElementById('auto-notes-delay');
    if (noteDelay) {
      noteDelay.value = this.options.autoNotesDelay;
      noteDelay.addEventListener('input', (e) => {
        this.adjustNoteDelay(parseInt(e.target.value));
        this.updateSliderValue(e.target, 'delay-value', false);
      });
    }

    // Play/pause button
    const togglePlay = document.getElementById('toggle-play');
    if (togglePlay) {
      togglePlay.addEventListener('click', () => {
        this.togglePlayback();
      });
    }

    // Reset button
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        this.resetToDefaults();
      });
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // 'C' key toggles control panel
      if (e.code === 'KeyC') {
        this.toggleControlPanel();
      } else {
        // Any other key plays a note progression
        this.playNoteProgression(Math.floor(Math.random() * 8) + 1);
      }
    });

    // Set initial value displays
    this.updateSliderValue(volumeControl, 'volume-value');
    this.updateSliderValue(noteDensity, 'density-value');
    this.updateSliderValue(noteDelay, 'delay-value', false);
  }

  /**
   * Updates the displayed value for a slider
   * @param {HTMLElement} slider - The slider element
   * @param {string} valueDisplayId - ID of the value display element
   * @param {boolean} useDecimals - Whether to show decimal values
   */
  updateSliderValue(slider, valueDisplayId, useDecimals = true) {
    const displayElement = document.getElementById(valueDisplayId);
    if (displayElement && slider) {
      displayElement.textContent = useDecimals ? parseFloat(slider.value).toFixed(2) : slider.value;
    }
  }

  /**
   * Toggles the control panel visibility
   */
  toggleControlPanel() {
    const controls = document.getElementById('comfy-controls');
    if (controls) {
      controls.classList.toggle('hide');
    }
  }

  /**
   * Toggles audio mute state
   */
  toggleMute() {
    const muteButton = document.getElementById('mute-button');
    const volumeControl = document.getElementById('volume-control-adv');

    if (this.options.volume <= 0) {
      // Unmute
      this.setVolume(this.previousVolume || 1);
      if (volumeControl) volumeControl.value = this.options.volume;
      if (muteButton) muteButton.textContent = 'Mute';
      this.updateSliderValue(volumeControl, 'volume-value');
    } else {
      // Mute
      this.previousVolume = this.options.volume;
      this.setVolume(0);
      if (volumeControl) volumeControl.value = 0;
      if (muteButton) muteButton.textContent = 'Unmute';
      this.updateSliderValue(volumeControl, 'volume-value');
    }
  }

  /**
   * Changes the instrument
   * @param {string} instrument - Instrument name
   */
  changeInstrument(instrument) {
    this.options.instrument = instrument;
  }

  /**
   * Adjusts the note density (probability)
   * @param {number} density - Note density value (0-1)
   */
  adjustNoteDensity(density) {
    this.options.autoNotesChance = density;
  }

  /**
   * Adjusts the delay between note checks
   * @param {number} delay - Delay in milliseconds
   */
  adjustNoteDelay(delay) {
    this.options.autoNotesDelay = delay;
  }

  /**
   * Toggles the playback state (play/pause)
   */
  togglePlayback() {
    const toggleButton = document.getElementById('toggle-play');

    this.options.playAutoNotes = !this.options.playAutoNotes;

    if (toggleButton) {
      toggleButton.textContent = this.options.playAutoNotes ? 'Pause' : 'Resume';
    }
  }

  /**
   * Resets all settings to default values
   */
  resetToDefaults() {
    // Reset volume
    this.setVolume(defaultOptions.volume);
    const volumeControl = document.getElementById('volume-control-adv');
    if (volumeControl) {
      volumeControl.value = defaultOptions.volume;
      this.updateSliderValue(volumeControl, 'volume-value');
    }

    // Reset mute button
    const muteButton = document.getElementById('mute-button');
    if (muteButton) {
      muteButton.textContent = 'Mute';
    }

    // Reset instrument
    this.changeInstrument(defaultOptions.instrument);
    const instrumentSelect = document.getElementById('instrument-select');
    if (instrumentSelect) {
      instrumentSelect.value = defaultOptions.instrument;
    }

    // Reset note density
    this.adjustNoteDensity(defaultOptions.autoNotesChance);
    const noteDensity = document.getElementById('note-density');
    if (noteDensity) {
      noteDensity.value = defaultOptions.autoNotesChance;
      this.updateSliderValue(noteDensity, 'density-value');
    }

    // Reset delay
    this.adjustNoteDelay(defaultOptions.autoNotesDelay);
    const noteDelay = document.getElementById('auto-notes-delay');
    if (noteDelay) {
      noteDelay.value = defaultOptions.autoNotesDelay;
      this.updateSliderValue(noteDelay, 'delay-value', false);
    }

    // Reset playback state
    this.options.playAutoNotes = defaultOptions.playAutoNotes;
    const togglePlay = document.getElementById('toggle-play');
    if (togglePlay) {
      togglePlay.textContent = this.options.playAutoNotes ? 'Pause' : 'Resume';
    }
  }

  /**
   * Connect to Twitch chat if a channel is specified
   */
  connectTwitch() {
    // Get the channel from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const channel = urlParams.get('channel');

    // Connect to Twitch chat if channel is specified
    if (channel && window.ComfyJS) {
      window.ComfyJS.onChat = (user, message) => {
        // Play a note progression on chat messages
        this.playNoteProgression(Math.floor(Math.random() * 8) + 1);
      };
      window.ComfyJS.Init(channel);
      console.log(`Connected to Twitch channel: ${channel}`);
    }
  }

  /**
   * Starts the music generator
   */
  start() {
    // Start audio context if it was suspended
    const audioContext = initAudioContext();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.currentLoopPosition = 0;

    // Start background loop
    this.playBackgroundLoop();

    // Start the animation loop
    requestAnimationFrame(this.update.bind(this));
  }

  /**
   * Stops the music generator
   */
  stop() {
    this.isPlaying = false;
    if (this.backgroundSound) {
      this.backgroundSound.stop();
      this.backgroundSound = null;
    }
  }

  /**
   * Sets the volume for all audio
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.options.volume = volume;
    setMasterVolume(volume);

    if (this.backgroundSound) {
      this.backgroundSound.setVolume(volume);
    }
  }

  /**
   * Animation loop update function
   * @param {number} timestamp - Current time from requestAnimationFrame
   */
  update(timestamp) {
    if (!this.isPlaying) return;

    const currentTime = timestamp || performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;

    // Update loop position
    this.currentLoopPosition += deltaTime;
    if (this.currentLoopPosition > this.options.backgroundLoopDuration) {
      this.currentLoopPosition = this.currentLoopPosition % this.options.backgroundLoopDuration;
      this.playBackgroundLoop();
    }

    // Update scale progression based on current time
    updateCurrentScaleProgression(this.currentLoopPosition);

    // Randomly generate notes based on configured chance
    if (this.options.playAutoNotes && Math.random() < this.options.autoNotesChance) {
      this.playNote();
    }

    this.lastFrameTime = currentTime;

    // Continue the loop with the configured delay
    setTimeout(() => {
      requestAnimationFrame(this.update.bind(this));
    }, this.options.autoNotesDelay);
  }

  /**
   * Plays the background loop
   */
  async playBackgroundLoop() {
    try {
      const url = `${this.options.baseUrl}/${this.options.backgroundLoopUrl}`;
      const buffer = await loadAudio(url);

      if (this.backgroundSound) {
        this.backgroundSound.stop();
      }

      this.backgroundSound = playAudio(buffer, {
        volume: this.options.volume,
        rate: 1,
        loop: true,
      });
    } catch (error) {
      console.error('Error playing background loop:', error);
    }
  }

  /**
   * Plays a single random note
   * @param {number} minDelay - Minimum delay before playing (ms)
   * @param {number} maxRandomDelay - Maximum additional random delay (ms)
   */
  async playNote(minDelay = 0, maxRandomDelay = 200) {
    const delay = minDelay + Math.random() * maxRandomDelay;

    setTimeout(async () => {
      // Generate next note based on musical theory
      const noteData = generateNextMelodyNote();

      // Select random instrument if multiple are defined
      const instruments = this.options.instrument.split(',').map((i) => i.trim());
      const instrument = instruments[generateRandomInteger(instruments.length)];

      // Construct URL and play the note
      const url = `${this.options.baseUrl}/${instrument}/${noteData.url}.ogg`;
      await playNote(url, this.options.volume, noteData.semitoneOffset);
    }, delay);
  }

  /**
   * Plays a progression of multiple notes
   * @param {number} numNotes - Number of notes to play
   */
  playNoteProgression(numNotes) {
    for (let i = 0; i < numNotes; i++) {
      this.playNote(100, 200 * i);
    }
  }
}

// Load ComfyJS for Twitch integration
function loadComfyJS() {
  return new Promise((resolve) => {
    if (window.ComfyJS) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = '/comfy.min.js';
    script.onload = () => resolve();
    script.onerror = () => {
      console.error('Failed to load ComfyJS');
      resolve(); // Resolve anyway so app can continue
    };
    document.head.appendChild(script);
  });
}

// Start the application after ensuring dependencies are loaded
async function init() {
  // Load dependencies
  await loadComfyJS();

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const instrument = urlParams.get('instrument') || defaultOptions.instrument;
  const volume = urlParams.get('volume')
    ? parseFloat(urlParams.get('volume'))
    : defaultOptions.volume;

  // Initialize ComfyJazz
  const comfyJazz = new ComfyJazz({
    instrument,
    volume,
    baseUrl: '/sounds', // URL path for sounds directory
  });

  // Start playing
  comfyJazz.start();

  // Expose to window for debugging
  window.comfyJazz = comfyJazz;
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', init);
