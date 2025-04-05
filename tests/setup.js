// Vitest setup file

// Mock AudioContext and related audio APIs for testing
class MockGainNode {
  constructor() {
    this.gain = { value: 1 };
  }
  connect() {
    return this;
  }
  disconnect() {}
}

class MockBufferSourceNode {
  constructor() {
    this.buffer = null;
    this.loop = false;
    this.playbackRate = { value: 1 };
    this.onended = null;
  }
  connect() {
    return this;
  }
  disconnect() {}
  start() {}
  stop() {}
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.destination = {};
  }

  createGain() {
    return new MockGainNode();
  }

  createBufferSource() {
    return new MockBufferSourceNode();
  }

  decodeAudioData(arrayBuffer) {
    return Promise.resolve({
      duration: 10,
      numberOfChannels: 2,
      sampleRate: 44100,
      length: 441000,
    });
  }

  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
}

// Create mock performance object
const mockPerformance = {
  now: () => Date.now(),
};

// Set up global mocks
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;
global.AudioBufferSourceNode = MockBufferSourceNode;
global.performance = mockPerformance;

// Mock fetch for audio loading tests
global.fetch = (url) => {
  // Return a successful response unless explicitly testing error cases
  if (url.includes('error')) {
    return Promise.reject(new Error('Network error'));
  }

  return Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
  });
};
