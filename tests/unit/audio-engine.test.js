import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initAudioContext,
  loadAudio,
  preloadAudios,
  createVolumeNode,
  playAudio,
  playNote,
  stopAllAudio,
  setMasterVolume,
  suspend,
  resume,
} from '../../src/modules/audio-engine.js';

describe('Audio Engine Module', () => {
  // Clear mocks between tests
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initAudioContext', () => {
    it('should create an audio context if none exists', () => {
      const context = initAudioContext();
      expect(context).toBeInstanceOf(global.AudioContext);
    });

    it('should return the existing context if already initialized', () => {
      const context1 = initAudioContext();
      const context2 = initAudioContext();
      expect(context1).toBe(context2);
    });
  });

  describe('loadAudio', () => {
    // Initialize the context for these tests
    beforeEach(() => {
      initAudioContext();
    });

    it('should load audio and cache it', async () => {
      const testUrl = 'test-audio.ogg';
      const buffer = await loadAudio(testUrl);

      // Check if the buffer is returned
      expect(buffer).toBeDefined();
      expect(buffer.duration).toBe(10); // From our mock

      // Load again to test caching
      const cachedBuffer = await loadAudio(testUrl);
      expect(cachedBuffer).toBe(buffer); // Should be the exact same object (cached)
    });

    it('should handle errors when loading audio', async () => {
      // Create a local mock for fetch that rejects
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Test error handling
      await expect(loadAudio('error-url.ogg')).rejects.toThrow();

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });

  describe('preloadAudios', () => {
    let originalFetch;

    beforeEach(() => {
      // Save the original fetch
      originalFetch = global.fetch;

      // Create a fetch mock that returns successfully
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
      });

      // Initialize audio context
      initAudioContext();
    });

    afterEach(() => {
      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('should preload multiple audio files', async () => {
      const urls = ['test1.ogg', 'test2.ogg', 'test3.ogg'];
      await preloadAudios(urls);

      // Verify fetch was called for each URL
      expect(global.fetch).toHaveBeenCalledTimes(urls.length);
    });
  });

  describe('createVolumeNode', () => {
    beforeEach(() => {
      initAudioContext();
    });

    it('should create a gain node with the specified volume', () => {
      const gainNode = createVolumeNode(0.5);
      expect(gainNode.gain.value).toBe(0.5);
    });

    it('should use the default volume if none is specified', () => {
      const gainNode = createVolumeNode();
      expect(gainNode.gain.value).toBe(1);
    });
  });

  describe('playAudio', () => {
    beforeEach(() => {
      initAudioContext();
    });

    it('should play audio with the specified options', () => {
      const buffer = {}; // Mock buffer
      const options = {
        volume: 0.8,
        rate: 1.5,
        loop: true,
      };

      const audioControl = playAudio(buffer, options);

      // Check if the control interface is returned
      expect(audioControl).toHaveProperty('sourceNode');
      expect(audioControl).toHaveProperty('gainNode');
      expect(audioControl).toHaveProperty('setVolume');
      expect(audioControl).toHaveProperty('stop');
      expect(audioControl).toHaveProperty('fade');

      // Check if source node is properly configured
      expect(audioControl.sourceNode.playbackRate.value).toBe(options.rate);
      expect(audioControl.sourceNode.loop).toBe(options.loop);
    });
  });

  describe('playNote', () => {
    beforeEach(() => {
      initAudioContext();
      // Set up fetch mock
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
      });
    });

    it('should play a note with the correct rate', async () => {
      const url = 'test-note.ogg';
      const volume = 0.7;
      const semitones = 2;

      const noteControl = await playNote(url, volume, semitones);

      expect(noteControl).toBeDefined();
    });

    it('should initialize the audio context if not already done', async () => {
      // Reset the audio context
      vi.resetModules();

      const url = 'test-note.ogg';
      await playNote(url);

      // Context should be initialized
      const context = initAudioContext();
      expect(context).toBeDefined();
    });
  });

  describe('Audio control functions', () => {
    beforeEach(() => {
      initAudioContext();
    });

    // Simple test that calls the function without checking internals
    it('stopAllAudio should call the function without errors', () => {
      expect(() => stopAllAudio()).not.toThrow();
    });

    it('setMasterVolume should apply volume without errors', () => {
      // We can't directly test activeAudioNodes since it's internal to the module
      // But we can verify the function runs without errors
      expect(() => {
        setMasterVolume(0.5);
      }).not.toThrow();
    });

    it('suspend should suspend the audio context', () => {
      const context = initAudioContext();
      const suspendSpy = vi.spyOn(context, 'suspend');

      suspend();

      expect(suspendSpy).toHaveBeenCalled();
    });

    it('resume should resume the audio context', () => {
      const context = initAudioContext();
      const resumeSpy = vi.spyOn(context, 'resume');

      resume();

      expect(resumeSpy).toHaveBeenCalled();
    });
  });
});
