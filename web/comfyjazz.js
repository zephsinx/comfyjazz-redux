//dependent on Howler.js https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js

/**
 * ComfyJazz - A generator for easy-listening jazz music
 * Dependent on Howler.js
 * @param {Object} options - Configuration options
 * @returns {Object} - ComfyJazz interface
 */
const ComfyJazz = (options = {}) => {
  // Default configuration options
  const defaultOptions = {
    baseUrl: "web/sounds",
    instrument: "piano",
    autoNotesDelay: 300, // Milliseconds between note generation attempts
    autoNotesChance: 0.2, // Probability (0-1) to play a note
    playAutoNotes: true,
    backgroundLoopUrl: "jazz_loop.ogg",
    backgroundLoopDuration: 27.428,
    volume: 1,
  };

  const cj = { ...defaultOptions, ...options };

  // Cache for pre-loaded audio resources
  const audioCache = {};
  const playbackRateCache = {};
  const noteRangeMap = {};
  const scaleAdjustmentCache = {};
  let lastFrameTime = 0;
  let currentLoopPosition = 0;
  let staticPlayNote = null;

  /////////////////////
  // Public API Methods

  /**
   * Sets the volume for all audio
   * @param {number} vol - Volume level (0-1)
   */
  cj.setVolume = (vol) => {
    cj.volume = vol;

    if (cj.backgroundSound) {
      cj.backgroundSound.volume(vol);
    }
    if (cj.lastSound) {
      cj.lastSound.volume(vol);
    }

    Object.values(audioCache).forEach((sound) => {
      sound.volume(vol);
    });
  };

  /**
   * Mutes all audio
   */
  cj.mute = () => cj.setVolume(0);

  /**
   * Unmutes audio
   */
  cj.unmute = () => cj.setVolume(1);

  /**
   * Checks if audio is muted
   * @returns {boolean} - True if muted
   */
  cj.isMuted = () => cj.volume <= 0;

  /**
   * Starts the music generator
   */
  cj.start = () => startComfyJazz();

  cj.playNoteProgression = playNoteProgression;
  cj.playNote = playNoteRandomly;

  /////////////////////
  // Core Implementation

  /**
   * Initialize and start the music generator
   */
  async function startComfyJazz() {
    // Pre-load and cache audio resources
    initializeAudioResources();
    buildNoteRangeMap();
    initializeScaleAdjustments();

    lastFrameTime = performance.now();
    currentLoopPosition = 0;

    playBackgroundLoop(`${cj.baseUrl}/${cj.backgroundLoopUrl}`, cj.volume, 1);
    requestAnimationFrame(automaticNotePlayer);
  }

  /**
   * Handles automatic note generation and loop management
   * @param {number} timestamp - Current animation frame timestamp
   */
  function automaticNotePlayer(timestamp) {
    const currentTime = timestamp || performance.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000;

    currentLoopPosition += deltaTime;
    if (currentLoopPosition > cj.backgroundLoopDuration) {
      currentLoopPosition = currentLoopPosition % cj.backgroundLoopDuration;
      playBackgroundLoop(`${cj.baseUrl}/${cj.backgroundLoopUrl}`, cj.volume, 1);
    }

    updateCurrentScaleProgression(currentLoopPosition);

    if (cj.playAutoNotes && Math.random() < cj.autoNotesChance) {
      playNoteRandomly(0, 200);
    }

    lastFrameTime = currentTime;

    setTimeout(() => {
      requestAnimationFrame(automaticNotePlayer);
    }, cj.autoNotesDelay);
  }

  /**
   * Updates the current scale progression based on time position
   * @param {number} currentTime - Current time position in seconds
   */
  function updateCurrentScaleProgression(currentTime) {
    for (let i = 0; i < scaleProgression.length; i++) {
      if (
        scaleProgression[i].start <= currentTime &&
        currentTime <= scaleProgression[i].end
      ) {
        currentScaleProgression = i;
        break;
      }
    }
  }

  /**
   * Pre-load and cache audio resources
   */
  function initializeAudioResources() {
    if (Object.keys(audioCache).length > 0) return;

    const instruments = cj.instrument.split(",").map((x) => x.trim());
    notes.forEach((note) => {
      instruments.forEach((instrument) => {
        const url = `${cj.baseUrl}/${instrument}/${note.url}.ogg`;
        if (!audioCache[url]) {
          audioCache[url] = new Howl({
            src: [url],
            preload: true,
            volume: cj.volume,
          });
        }
      });
    });

    const bgUrl = `${cj.baseUrl}/${cj.backgroundLoopUrl}`;
    if (!audioCache[bgUrl]) {
      audioCache[bgUrl] = new Howl({
        src: [bgUrl],
        preload: true,
        volume: cj.volume,
      });
    }
  }

  /**
   * Build a lookup map for notes by MIDI number
   */
  function buildNoteRangeMap() {
    if (Object.keys(noteRangeMap).length > 0) return;

    for (let i = 0; i < 128; i++) {
      const matchingNote = notes.find(
        (note) => note.metaData.startRange <= i && i <= note.metaData.endRange
      );
      if (matchingNote) {
        noteRangeMap[i] = matchingNote;
      }
    }
  }

  /**
   * Pre-compute scale adjustments for common patterns
   */
  function initializeScaleAdjustments() {
    if (Object.keys(scaleAdjustmentCache).length > 0) return;

    Object.keys(scales).forEach((scaleName) => {
      scaleAdjustmentCache[scaleName] = {};
      for (let i = 0; i < 12; i++) {
        scaleAdjustmentCache[scaleName][i] = scales[scaleName][i % 12];
      }
    });
  }

  /**
   * Plays a single note with a random delay
   * @param {number} minRandom - Minimum delay (ms)
   * @param {number} maxRandom - Maximum delay (ms)
   */
  async function playNoteRandomly(minRandom = 0, maxRandom = 200) {
    setTimeout(async () => {
      let sound = generateNextMelodyNote();
      const instruments = cj.instrument.split(",").map((x) => x.trim());
      let instrument = instruments[generateRandomInteger(instruments.length)];

      const soundUrl = `${cj.baseUrl}/${instrument}/${sound.url}.ogg`;
      await playMelodyNote(soundUrl, cj.volume, sound.playbackRate);
    }, minRandom + Math.random() * maxRandom);
  }

  /**
   * Plays multiple notes with increasing delays
   * @param {number} numNotes - Number of notes to play
   */
  function playNoteProgression(numNotes) {
    for (var i = 0; i < numNotes; i++) {
      playNoteRandomly(100, 200 * i);
    }
  }

  ////////////////////////////////
  // Music Theory Functions
  ////////////////////////////////

  /**
   * Converts semitone differences to playback rate
   * @param {number} semitones - Semitones to shift
   * @returns {number} - Playback rate multiplier
   */
  function calculatePlaybackRateFromSemitones(semitones) {
    if (playbackRateCache[semitones] === undefined) {
      const semitoneRatio = Math.pow(2, 1 / 12);
      playbackRateCache[semitones] = Math.pow(semitoneRatio, semitones);
    }
    return playbackRateCache[semitones];
  }

  /**
   * Adds variation to a note within a range
   * @param {number} tone - Base tone
   * @param {number} startRange - Lower bound
   * @param {number} endRange - Upper bound
   * @returns {number} - Varied note value
   */
  function addRandomVariationToNote(tone, startRange, endRange) {
    let minValue = startRange,
      maxValue = endRange;

    let shiftedValue = minValue + Math.random() * (maxValue - minValue);
    return shiftedValue;
  }

  /**
   * Plays the background loop
   * @param {string} url - Audio file URL
   * @param {number} volume - Volume level (0-1)
   * @param {number} rate - Playback rate
   * @returns {Promise} - Resolves when finished
   */
  function playBackgroundLoop(url, volume = 1, rate = 1) {
    return new Promise((resolve, reject) => {
      let sound = audioCache[url];

      if (!sound) {
        sound = new Howl({
          src: [url],
          volume: volume,
          onend: function () {
            resolve();
          },
        });
        audioCache[url] = sound;
      } else {
        sound.volume(volume);
        sound.on("end", resolve);
      }

      sound.rate(rate);
      sound.play();
      cj.backgroundSound = sound;
    });
  }

  /**
   * Plays a melody note
   * @param {string} url - Audio file URL
   * @param {number} volume - Volume level (0-1)
   * @param {number} rate - Playback rate
   * @returns {Promise} - Resolves when finished
   */
  function playMelodyNote(url, volume = 1, rate = 1) {
    return new Promise((resolve, reject) => {
      let sound = audioCache[url];

      if (!sound) {
        sound = new Howl({
          src: [url],
          volume: volume,
          onend: function () {
            resolve();
          },
        });
        audioCache[url] = sound;
      } else {
        sound.volume(volume);
        sound.on("end", resolve);
      }

      sound.rate(rate);
      sound.play();
      sound.fade(volume, 0.0, 1000);
      cj.lastSound = sound;
    });
  }

  /**
   * Gets the next note based on current musical context
   * @returns {Object} - Note object with URL and playback rate
   */
  function generateNextMelodyNote() {
    if (performance.now() - lastNoteTime > 900 || this.noteCount > 30) {
      selectRandomPattern();
      noteCount = 0;
    }

    let currentProgression = scaleProgression[currentScaleProgression];
    scale = currentProgression.scale;
    let noteValue = deriveNoteFromScaleAndPattern(scale);
    while (noteValue === lastNoteNumber) {
      noteValue = deriveNoteFromScaleAndPattern(scale);
    }

    if (currentProgression.root !== lastRoot) {
      noteValue = harmonizeNoteWithTargets(
        noteValue,
        currentProgression.targetNotes
      );
    }

    var midiNote = noteValue || 48;
    let noteObj = findSoundObjectForSemitone(midiNote);

    let semitoneOffset = midiNote - noteObj.metaData.root;
    let playbackRate = calculatePlaybackRateFromSemitones(semitoneOffset);

    if (!staticPlayNote) {
      staticPlayNote = {
        url: "",
        metaData: {},
        playbackRate: 1.0,
      };
    }

    staticPlayNote.url = noteObj.url;
    staticPlayNote.metaData = noteObj.metaData;
    staticPlayNote.playbackRate = playbackRate;

    noteCount++;
    lastNoteTime = performance.now();
    lastNoteNumber = noteValue;
    lastRoot = currentProgression.root;
    return staticPlayNote;
  }

  /**
   * Gets a note value from pattern and scale
   * @param {string} scaleName - Scale name
   * @returns {number} - Modified note value
   */
  function deriveNoteFromScaleAndPattern(scaleName) {
    if (pattern < 0) {
      selectRandomPattern();
    }

    let patternNote = patterns[pattern][currentStep];

    let scaleAdjustedNote = patternNote;
    const mod12 = patternNote % 12;
    if (
      scaleAdjustmentCache[scaleName] &&
      scaleAdjustmentCache[scaleName][mod12] !== undefined
    ) {
      scaleAdjustedNote += scaleAdjustmentCache[scaleName][mod12];
    } else {
      scaleAdjustedNote += scales[scaleName][mod12];
    }

    let transposedNote = transpose + scaleAdjustedNote;
    currentStep = (currentStep + 1) % patterns[pattern].length;
    return transposedNote;
  }

  /**
   * Generates a random integer
   * @param {number} number - Upper bound (exclusive)
   * @returns {number} - Random integer
   */
  function generateRandomInteger(number) {
    return Math.floor(number * Math.random());
  }

  /**
   * Selects a random pattern
   */
  function selectRandomPattern() {
    pattern = generateRandomInteger(patterns.length);
    currentStep = 0;
  }

  /**
   * Finds the target note closest to a given note
   * @param {Array<number>} targetNotes - Target notes
   * @param {number} referenceNote - Reference note
   * @returns {number} - Closest target note
   */
  function findClosestTargetNote(targetNotes, referenceNote) {
    return targetNotes.reduce(function (closestSoFar, currentTarget) {
      return Math.abs(currentTarget - referenceNote) <
        Math.abs(closestSoFar - referenceNote)
        ? currentTarget
        : closestSoFar;
    });
  }

  /**
   * Adjusts a note to fit target notes in the scale
   * @param {number} noteValue - Note to modify
   * @param {Array<number>} targetNotes - Target notes
   * @returns {number} - Modified note value
   */
  function harmonizeNoteWithTargets(noteValue, targetNotes) {
    var normalizedNote = ((noteValue % 12) + 5) % 12;
    if (
      void 0 ==
      targetNotes.filter(function (target) {
        return target === normalizedNote;
      })[0]
    ) {
      var closestTarget = findClosestTargetNote(targetNotes, noteValue),
        adjustedNote = (noteValue -= normalizedNote - closestTarget);

      if (
        scaleAdjustmentCache[scale] &&
        scaleAdjustmentCache[scale][((adjustedNote % 12) + 5) % 12] !==
          undefined
      ) {
        noteValue =
          adjustedNote +
          scaleAdjustmentCache[scale][((adjustedNote % 12) + 5) % 12];
      } else {
        noteValue =
          adjustedNote + scales[scale][((adjustedNote % 12) + 5) % 12];
      }
    }
    return noteValue;
  }

  /**
   * Finds a note object for a semitone value
   * @param {number} semitone - Semitone value
   * @returns {Object} - Matching note object
   */
  function findSoundObjectForSemitone(semitone) {
    return (
      noteRangeMap[semitone] ||
      notes.filter(
        (note) =>
          note.metaData.startRange <= semitone &&
          semitone <= note.metaData.endRange
      )[0] ||
      notes[notes.length - 1]
    );
  }

  // Musical state variables
  let currentScaleProgression = 0;
  let lastRoot = undefined;
  let pattern = -1;
  let scale = "custom";
  let transpose = -5;
  let currentStep = 0;
  let lastNoteTime = 0;
  let lastNoteNumber = 0;
  let noteCount = 0;

  // Musical definitions
  const scaleProgression = [
    {
      start: 0,
      end: 3.428,
      scale: "custom",
      targetNotes: [2, 4, 7],
      root: 7,
    },
    {
      start: 3.428,
      end: 6.857,
      scale: "diatonic",
      targetNotes: [2, 4, 7],
      root: 2,
    },
    {
      start: 6.857,
      end: 10.285,
      scale: "custom",
      targetNotes: [2, 4, 7],
      root: 7,
    },
    {
      start: 10.285,
      end: 12,
      scale: "diatonic",
      targetNotes: [4, 5, 9],
      root: 9,
    },
    {
      start: 12,
      end: 13.714,
      scale: "custom2",
      targetNotes: [2, 4, 11],
      root: 2,
    },
    {
      start: 13.714,
      end: 17.142,
      scale: "custom",
      targetNotes: [4, 7, 11],
      root: 11,
    },
    {
      start: 17.142,
      end: 20.571,
      scale: "custom",
      targetNotes: [0, 2, 4],
      root: 4,
    },
    {
      start: 20.571,
      end: 24,
      scale: "diatonic",
      targetNotes: [4, 5, 9],
      root: 9,
    },
    {
      start: 24,
      end: 27.428,
      scale: "custom2",
      targetNotes: [2, 4, 11],
      root: 2,
    },
  ];

  const scales = {
    diatonic: [0, -1, 0, -1, 0, 0, -1, 0, -1, 0, -1, 0],
    dorian: [0, 1, 0, 0, -1, 0, 1, 0, 1, 0, 0, -1],
    phrygian: [0, 0, -1, 0, -1, 0, 1, 0, 0, -1, 0, -1],
    lydian: [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
    mixolydian: [0, 1, 0, 1, 0, 0, -1, 0, -1, 0, 0, -1],
    aeolian: [0, -1, 0, 0, -1, 0, -1, 0, 0, -1, 0, -1],
    locrian: [0, 0, -1, 0, -1, 0, 0, -1, 0, -1, 0, -1],
    harmonicMinor: [0, 1, 0, 0, -1, 0, 1, 0, 0, -1, 1, 0],
    melodicMinor: [0, 1, 0, 0, -1, 0, 1, 0, -1, 0, 1, 0],
    majorPentatonic: [0, 1, 0, 1, 0, -1, 1, 0, 1, 0, -1, 1],
    minorPentatonic: [0, -1, 1, 0, -1, 0, 1, 0, -1, 1, 0, -1],
    doubleHarmonic: [0, 0, -1, 1, 0, 0, 1, 0, 0, -1, 1, 0],
    halfDim: [0, 1, 0, 0, -1, 0, 0, -1, 0, -1, 0, -1],
    chromatic: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    custom: [0, -1, 0, -1, 0, -1, -1, 0, -1, 0, -1, 0],
    custom2: [-1, 0, 0, -1, 0, 0, 1, 0, 0, -1, 0, 0],
  };

  const patterns = [
    [
      71, 72, 69, 71, 67, 69, 64, 67, 62, 64, 62, 60, 59, 60, 62, 64, 65, 67,
      69, 71, 67, 64, 62, 60, 59, 60, 57, 59, 55,
    ],
    [83, 88, 86, 81, 79, 83, 81, 76, 74, 79, 76, 72, 71, 72, 69, 67],
    [
      74, 72, 70, 69, 70, 67, 69, 65, 67, 62, 65, 63, 67, 70, 74, 77, 74, 77,
      74, 72, 70, 69, 70, 67, 69, 65,
    ],
    [
      69, 74, 72, 67, 64, 69, 67, 62, 60, 64, 62, 57, 55, 60, 57, 53, 55, 57,
      60, 62, 64, 65, 67, 62, 65, 64, 62, 64, 62, 60, 59,
    ],
    [
      59, 60, 64, 67, 71, 72, 76, 79, 83, 84, 88, 91, 95, 98, 95, 98, 95, 91,
      88, 91, 88, 84, 83, 86, 83, 79, 76, 79, 76, 72, 71, 74, 71, 67, 64, 67,
      64, 60, 59, 55,
    ],
    [
      91, 86, 88, 84, 83, 86, 83, 79, 76, 79, 76, 72, 71, 74, 71, 67, 64, 67,
      64, 60, 59, 60, 64, 67, 71, 72, 74, 76, 79, 74, 76, 71, 72, 67,
    ],
    [
      67, 65, 64, 65, 69, 72, 76, 79, 77, 76, 74, 76, 72, 71, 74, 71, 72, 67,
      64, 67, 62, 60,
    ],
    [
      65, 67, 65, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84, 86, 88,
      89, 91, 93, 91, 88, 86, 88, 86, 84, 83, 84, 79, 81, 76, 79, 74, 76, 72,
      71, 71, 72, 67,
    ],
    [
      55, 59, 60, 62, 67, 71, 72, 76, 79, 83, 86, 88, 93, 91, 88, 84, 81, 79,
      77, 76, 74, 72, 71,
    ],
  ];

  const notes = [
    {
      url: "note_96",
      metaData: {
        root: 96,
        startRange: 95,
        endRange: 127,
      },
    },
    {
      url: "note_93",
      metaData: {
        root: 93,
        startRange: 92,
        endRange: 94,
      },
    },
    {
      url: "note_90",
      metaData: {
        root: 90,
        startRange: 89,
        endRange: 91,
      },
    },
    {
      url: "note_87",
      metaData: {
        root: 87,
        startRange: 86,
        endRange: 88,
      },
    },
    {
      url: "note_84",
      metaData: {
        root: 84,
        startRange: 83,
        endRange: 85,
      },
    },
    {
      url: "note_81",
      metaData: {
        root: 81,
        startRange: 80,
        endRange: 82,
      },
    },
    {
      url: "note_77",
      metaData: {
        root: 78,
        startRange: 77,
        endRange: 79,
      },
    },
    {
      url: "note_74",
      metaData: {
        root: 75,
        startRange: 74,
        endRange: 76,
      },
    },
    {
      url: "note_71",
      metaData: {
        root: 72,
        startRange: 71,
        endRange: 73,
      },
    },
    {
      url: "note_69",
      metaData: {
        root: 69,
        startRange: 68,
        endRange: 70,
      },
    },
    {
      url: "note_66",
      metaData: {
        root: 66,
        startRange: 65,
        endRange: 67,
      },
    },
    {
      url: "note_63",
      metaData: {
        root: 63,
        startRange: 62,
        endRange: 64,
      },
    },
    {
      url: "note_60",
      metaData: {
        root: 60,
        startRange: 59,
        endRange: 61,
      },
    },
    {
      url: "note_57",
      metaData: {
        root: 57,
        startRange: 56,
        endRange: 58,
      },
    },
    {
      url: "note_54",
      metaData: {
        root: 54,
        startRange: 53,
        endRange: 55,
      },
    },
    {
      url: "note_51",
      metaData: {
        root: 51,
        startRange: 50,
        endRange: 52,
      },
    },
    {
      url: "note_48",
      metaData: {
        root: 48,
        startRange: 0,
        endRange: 49,
      },
    },
  ];

  return cj;
};
