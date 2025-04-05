/**
 * This file contains mock audio data and fixtures for testing the audio functionality
 * without needing actual audio files or browser audio API access.
 */

// Mock audio buffer factory function
export function createMockAudioBuffer(options = {}) {
  const {
    duration = 10,
    numberOfChannels = 2,
    sampleRate = 44100,
    // Optional raw audio data
    channelData = null,
  } = options;

  // Create a basic AudioBuffer-like object
  return {
    duration,
    length: Math.floor(duration * sampleRate),
    numberOfChannels,
    sampleRate,
    // Add methods similar to AudioBuffer
    getChannelData: (channel) => {
      if (channel >= numberOfChannels) {
        throw new Error(`Channel ${channel} does not exist`);
      }

      if (channelData && channelData[channel]) {
        return channelData[channel];
      }

      // Return mock channel data (flat line)
      return new Float32Array(Math.floor(duration * sampleRate)).fill(0.5);
    },
    // For simulating AudioBuffer copying
    copyFromChannel: (destination, channelNumber, startInChannel = 0) => {
      const source =
        channelData && channelData[channelNumber]
          ? channelData[channelNumber]
          : new Float32Array(Math.floor(duration * sampleRate)).fill(0.5);

      for (let i = 0; i < destination.length; i++) {
        if (i + startInChannel < source.length) {
          destination[i] = source[i + startInChannel];
        }
      }
    },
  };
}

// Create a collection of mock audio buffers for different notes
export const mockNoteBuffers = {
  C4: createMockAudioBuffer({ duration: 2.0 }),
  E4: createMockAudioBuffer({ duration: 1.8 }),
  G4: createMockAudioBuffer({ duration: 1.5 }),
  A4: createMockAudioBuffer({ duration: 1.2 }),
  // Add more notes as needed
};

// Mock sound effect buffers
export const mockSoundEffects = {
  kick: createMockAudioBuffer({ duration: 0.5 }),
  snare: createMockAudioBuffer({ duration: 0.3 }),
  hihat: createMockAudioBuffer({ duration: 0.2 }),
};

// Mock background audio buffer with longer duration
export const mockBackgroundLoop = createMockAudioBuffer({
  duration: 30.0,
  // Create some simple "waveform" data for visualization testing
  channelData: [new Float32Array(30 * 44100).map((_, i) => Math.sin(i / 100) * 0.5 + 0.5)],
});

// Frequency data for notes (in Hz)
export const noteFrequencies = {
  C4: 261.63,
  'C#4': 277.18,
  D4: 293.66,
  'D#4': 311.13,
  E4: 329.63,
  F4: 349.23,
  'F#4': 369.99,
  G4: 392.0,
  'G#4': 415.3,
  A4: 440.0,
  'A#4': 466.16,
  B4: 493.88,
  C5: 523.25,
};

// Mock scales for testing
export const mockScales = {
  major: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  minor: ['C4', 'D4', 'D#4', 'F4', 'G4', 'G#4', 'A#4', 'C5'],
  pentatonic: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
  blues: ['C4', 'D#4', 'F4', 'F#4', 'G4', 'A#4', 'C5'],
};

// Export a function to simulate audio decoding delay
export function simulateAudioDecoding(buffer, delay = 100) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(buffer), delay);
  });
}
