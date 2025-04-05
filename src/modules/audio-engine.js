/**
 * Audio Engine Module
 * Handles all audio functionality using Web Audio API
 */

import { calculatePlaybackRateFromSemitones } from './music-theory.js';

// Audio context singleton
let audioContext = null;

// Caches for audio resources
const audioBufferCache = {};
const activeAudioNodes = new Set();

/**
 * Initializes the audio context
 * @returns {AudioContext} - The initialized audio context
 */
export const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Loads an audio file and caches the buffer
 * @param {string} url - URL of the audio file
 * @returns {Promise<AudioBuffer>} - Promise resolving to the audio buffer
 */
export const loadAudio = async (url) => {
  // Return from cache if available
  if (audioBufferCache[url]) {
    return audioBufferCache[url];
  }

  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Cache the loaded buffer
    audioBufferCache[url] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Error loading audio from ${url}:`, error);
    throw error;
  }
};

/**
 * Preloads a collection of audio files
 * @param {Array<string>} urls - List of audio URLs to preload
 * @returns {Promise<void>} - Promise that resolves when all files are loaded
 */
export const preloadAudios = async (urls) => {
  const loadPromises = urls.map((url) => loadAudio(url));
  await Promise.all(loadPromises);
};

/**
 * Creates and configures a GainNode for volume control
 * @param {number} volume - Initial volume (0-1)
 * @returns {GainNode} - Configured gain node
 */
export const createVolumeNode = (volume = 1) => {
  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume;
  return gainNode;
};

/**
 * Plays an audio buffer with specified parameters
 * @param {AudioBuffer} buffer - Audio buffer to play
 * @param {Object} options - Playback options
 * @param {number} options.volume - Volume level (0-1)
 * @param {number} options.rate - Playback rate
 * @param {boolean} options.loop - Whether to loop the audio
 * @param {Function} options.onended - Callback when playback ends
 * @returns {Object} - Audio node and control functions
 */
export const playAudio = (buffer, options = {}) => {
  const { volume = 1, rate = 1, loop = false, onended = null } = options;

  // Create source node
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = buffer;
  sourceNode.playbackRate.value = rate;
  sourceNode.loop = loop;

  // Create volume control
  const gainNode = createVolumeNode(volume);

  // Connect nodes
  sourceNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Start playback
  sourceNode.start(0);

  // Track this node for cleanup
  activeAudioNodes.add(sourceNode);

  // Handle ended event
  if (onended) {
    sourceNode.onended = () => {
      activeAudioNodes.delete(sourceNode);
      onended();
    };
  } else {
    sourceNode.onended = () => {
      activeAudioNodes.delete(sourceNode);
    };
  }

  // Return control interface
  return {
    sourceNode,
    gainNode,

    // Volume control function
    setVolume: (newVolume) => {
      gainNode.gain.value = newVolume;
    },

    // Stop function
    stop: () => {
      try {
        sourceNode.stop(0);
      } catch (e) {
        // Ignore errors if already stopped
      }
      activeAudioNodes.delete(sourceNode);
    },

    // Fade function
    fade: (fromVolume, toVolume, duration) => {
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(fromVolume, now);
      gainNode.gain.linearRampToValueAtTime(toVolume, now + duration / 1000);
    },
  };
};

/**
 * Plays a note with the specified playback rate
 * @param {string} url - URL of the note audio file
 * @param {number} volume - Volume level (0-1)
 * @param {number} semitones - Semitone adjustment for the note
 * @returns {Promise<Object>} - Promise resolving to the audio control object
 */
export const playNote = async (url, volume = 1, semitones = 0) => {
  try {
    // Initialize context if not yet created
    if (!audioContext) {
      initAudioContext();
    }

    // Load audio
    const buffer = await loadAudio(url);

    // Calculate rate from semitones if provided
    const rate = semitones ? calculatePlaybackRateFromSemitones(semitones) : 1;

    // Play the note
    return playAudio(buffer, {
      volume,
      rate,
      onended: () => {},
    });
  } catch (error) {
    console.error('Error playing note:', error);
    return null;
  }
};

/**
 * Stops all currently playing audio
 */
export const stopAllAudio = () => {
  activeAudioNodes.forEach((node) => {
    try {
      node.stop(0);
    } catch (e) {
      // Ignore errors if already stopped
    }
  });
  activeAudioNodes.clear();
};

/**
 * Sets master volume for all active sounds
 * @param {number} volume - Volume level (0-1)
 */
export const setMasterVolume = (volume) => {
  // This would need a more sophisticated implementation
  // with a master volume node in a real-world scenario
  console.log(`Master volume set to ${volume}`);
};

/**
 * Suspends the audio context (useful for saving resources)
 */
export const suspend = () => {
  if (audioContext) {
    audioContext.suspend();
  }
};

/**
 * Resumes the audio context (after suspension)
 */
export const resume = () => {
  if (audioContext) {
    audioContext.resume();
  }
};
