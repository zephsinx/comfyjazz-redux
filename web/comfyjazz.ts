import { Howl } from "howler";
import {
  ScaleName,
  ScaleProgressionItem,
  NoteItem,
  scaleProgression,
  scales,
  patterns,
  notes,
} from "./comfyjazz-constants";

// --- Interfaces ---

export interface ComfyJazzOptions {
  baseUrl?: string;
  instrument?: string;
  autoNotesDelay?: number;
  autoNotesChance?: number;
  playAutoNotes?: boolean;
  backgroundLoopUrl?: string;
  backgroundLoopDuration?: number;
  volume?: number;
}

// Represents the data structure returned by selectNextNote
interface SoundData extends NoteItem {
  playbackRate: number;
}

export interface ComfyJazzInstance {
  baseUrl: string;
  instrument: string;
  autoNotesDelay: number;
  autoNotesChance: number;
  playAutoNotes: boolean;
  backgroundLoopUrl: string;
  backgroundLoopDuration: number;
  volume: number;
  backgroundSound?: Howl | null;
  lastSound?: Howl | null;

  /** Sets the volume for background music and future notes. */
  setVolume: (vol: number) => void;
  /** Mutes the audio by setting volume to 0. */
  mute: () => void;
  /** Unmutes the audio by restoring the configured volume. */
  unmute: () => void;
  /** Checks if the current volume is muted (<= 0). */
  isMuted: () => boolean;
  /** Starts the background music loop and automatic note playing. */
  start: () => Promise<void>;
  /** Plays a sequence of notes with increasing delays. */
  playNoteProgression: (numNotes: number) => void;
  /** Plays a single random note with a random delay. */
  playNote: (minRandom?: number, maxRandom?: number) => Promise<void>;
}

/**
 * Creates a ComfyJazz instance for playing procedurally generated jazz music.
 * @param options Optional configuration to override defaults.
 * @returns A ComfyJazzInstance object with methods to control playback.
 */
const ComfyJazz = (options: ComfyJazzOptions = {}): ComfyJazzInstance => {
  // Default configuration
  const defaultOptions = {
    baseUrl: "web/sounds",
    instrument: "piano",
    autoNotesDelay: 300,
    autoNotesChance: 0.2,
    playAutoNotes: true,
    backgroundLoopUrl: "jazz_loop.ogg",
    backgroundLoopDuration: 27.428,
    volume: 1,
  };

  // Merge options first
  const config = { ...defaultOptions, ...options };

  const cj: ComfyJazzInstance = {
    ...config,
    backgroundSound: null,
    lastSound: null,

    /**
     * Sets the playback volume.
     * @param vol The desired volume (0.0 to 1.0).
     */
    setVolume: (vol: number): void => {
      cj.volume = vol;
      config.volume = vol;
      cj.backgroundSound?.volume(vol);
      cj.lastSound?.volume(vol);
    },
    /** Mutes the audio. */
    mute: (): void => {
      cj.setVolume(0);
    },
    /** Unmutes the audio. */
    unmute: (): void => {
      cj.setVolume(config.volume);
    },
    /** Checks if audio is muted. */
    isMuted: (): boolean => cj.volume <= 0,
    /** Starts the main ComfyJazz loop. */
    start: startComfyJazz,
    /** Plays a sequence of notes. */
    playNoteProgression: playSequentialNotesWithDelays,
    /** Plays a single note. */
    playNote: playNoteWithRandomDelay,
  };

  /////////////////////
  // Core Functionality
  /////////////////////

  /**
   * Initializes the background music loop and starts the automatic note player.
   */
  async function startComfyJazz(): Promise<void> {
    let startTime: number = performance.now();

    playBackgroundSound(`${cj.baseUrl}/${cj.backgroundLoopUrl}`, cj.volume, 1);

    /** Handles the loop for playing automatic notes and restarting background music. */
    const AutomaticPlayNote = async (): Promise<void> => {
      let currentTime: number = (performance.now() - startTime) / 1000;

      if (currentTime > cj.backgroundLoopDuration) {
        startTime = performance.now();
        currentTime = 0;
        playBackgroundSound(
          `${cj.baseUrl}/${cj.backgroundLoopUrl}`,
          cj.volume,
          1
        );
      }

      for (let i = 0; i < scaleProgression.length; i++) {
        if (
          scaleProgression[i].start <= currentTime &&
          currentTime <= scaleProgression[i].end
        ) {
          currentScaleProgression = i;
          break;
        }
      }

      if (cj.playAutoNotes && Math.random() < cj.autoNotesChance) {
        playNoteWithRandomDelay(0, 200);
      }

      setTimeout(AutomaticPlayNote, cj.autoNotesDelay);
    };

    AutomaticPlayNote();
  }

  /**
   * Selects the next note based on musical context and plays it after a random delay.
   * @param minRandom Minimum delay in milliseconds.
   * @param maxRandom Maximum additional random delay in milliseconds.
   */
  async function playNoteWithRandomDelay(
    minRandom: number = 0,
    maxRandom: number = 200
  ): Promise<void> {
    setTimeout(async () => {
      const sound: SoundData = selectNextNote();
      const instruments: string[] = cj.instrument
        .split(",")
        .map((x: string) => x.trim());
      const instrument: string = instruments[getRandomInt(instruments.length)];
      await playNoteSound(
        `${cj.baseUrl}/${instrument}/${sound.url}.ogg`,
        cj.volume,
        sound.playbackRate
      );
    }, minRandom + Math.random() * maxRandom);
  }

  /**
   * Plays a specified number of notes sequentially with increasing random delays.
   * @param numNotes The number of notes to play.
   */
  function playSequentialNotesWithDelays(numNotes: number): void {
    for (let i = 0; i < numNotes; i++) {
      playNoteWithRandomDelay(100, 200 * i);
    }
  }

  ////////////////////////////////
  // Music Theory & Audio Functions
  ////////////////////////////////

  /**
   * Converts a difference in semitones to a playback rate multiplier for Howler.
   * @param semitones The number of semitones difference.
   * @returns The playback rate multiplier.
   */
  function semitonesToPlaybackRate(semitones: number): number {
    const semitoneRatio: number = Math.pow(2, 1 / 12);
    return Math.pow(semitoneRatio, semitones);
  }

  /**
   * Generates a random floating-point number within a specified range.
   * Note: The `_tone` parameter is currently unused.
   * @param _tone Unused parameter.
   * @param startRange The minimum value (inclusive).
   * @param endRange The maximum value (exclusive).
   * @returns A random number within the range.
   */
  function getRandomValueInRange(
    _tone: number,
    startRange: number,
    endRange: number
  ): number {
    const minValue: number = startRange;
    const maxValue: number = endRange;
    const randomValue: number =
      minValue + Math.random() * (maxValue - minValue);
    return randomValue;
  }

  /**
   * Plays the background sound loop using Howler.
   * @param url The URL of the audio file.
   * @param volume Playback volume (0.0 to 1.0).
   * @param rate Playback rate multiplier.
   * @returns A Promise that resolves when the sound finishes playing (though loops might prevent this).
   */
  function playBackgroundSound(
    url: string,
    volume: number = 1,
    rate: number = 1
  ): Promise<void> {
    return new Promise<void>((resolve, _reject) => {
      const backgroundSound = new Howl({
        src: [url],
        volume: volume,
        onend: function () {
          resolve();
        },
      });
      backgroundSound.rate(rate);
      backgroundSound.play();
      cj.backgroundSound = backgroundSound;
    });
  }

  /**
   * Plays a single note sound using Howler, with a fade-out effect.
   * @param url The URL of the audio file.
   * @param volume Playback volume (0.0 to 1.0).
   * @param rate Playback rate multiplier.
   * @returns A Promise that resolves when the sound finishes playing and fading.
   */
  function playNoteSound(
    url: string,
    volume: number = 1,
    rate: number = 1
  ): Promise<void> {
    return new Promise<void>((resolve, _reject) => {
      const noteSound = new Howl({
        src: [url],
        volume: volume,
        onend: function () {
          resolve();
        },
      });
      noteSound.rate(rate);
      noteSound.play();
      noteSound.fade(volume, 0.0, 1000);
      cj.lastSound = noteSound;
    });
  }

  /**
   * Selects the next note to play based on the current musical pattern, scale, and progression.
   * Handles pattern changes and ensures notes fit the target scale.
   * @returns A SoundData object containing the note URL and calculated playback rate.
   */
  function selectNextNote(): SoundData {
    // Check if it's time to change the melodic pattern
    if (
      performance.now() - lastNoteTime > 900 ||
      noteCount > maxNNotesPerPattern
    ) {
      changePattern();
      noteCount = 0;
    }

    // Get the current segment of the song structure
    const progression: ScaleProgressionItem =
      scaleProgression[currentScaleProgression];
    scale = progression.scale; // Update the currently active scale

    // Get the next note based on the pattern and adjust it for the scale
    let noteNumber: number = getScaleAdjustedPatternNote(scale);

    // Avoid repeating the exact same note number immediately
    while (noteNumber === lastNoteNumber) {
      noteNumber = getScaleAdjustedPatternNote(scale);
    }

    // If the root note of the progression segment has changed, adjust the note to fit target notes
    if (progression.root !== lastRoot) {
      noteNumber = adjustNoteToScale(noteNumber, progression.targetNotes);
    }

    // Default to MIDI note 48 if calculation somehow fails (unlikely)
    const midiNote: number = noteNumber || 48;

    // Find the corresponding audio sample data based on the MIDI note range
    const soundDataBase: NoteItem | undefined = notes.find(
      (note: NoteItem) =>
        note.metaData.startRange <= midiNote &&
        midiNote <= note.metaData.endRange
    );

    // Handle cases where no matching sample is found (e.g., out of range MIDI note)
    if (!soundDataBase) {
      console.error(
        `Could not find note data for MIDI note: ${midiNote}. Using default.`
      );
      // Fallback to a default note (note_48 or the lowest note) to prevent errors
      const defaultNote =
        notes.find((n) => n.url === "note_48") || notes[notes.length - 1];
      const semitoneOffset = midiNote - defaultNote.metaData.root;
      return {
        ...defaultNote,
        playbackRate: semitonesToPlaybackRate(semitoneOffset),
      };
    }

    // Calculate the pitch shift required for the sample
    const semitoneOffset: number = midiNote - soundDataBase.metaData.root;
    const playbackRate: number = semitonesToPlaybackRate(semitoneOffset);

    // Combine sample data with calculated playback rate
    const soundData: SoundData = {
      ...soundDataBase,
      playbackRate: playbackRate,
    };

    // Update state variables
    noteCount++;
    lastNoteTime = performance.now();
    lastNoteNumber = noteNumber;
    lastRoot = progression.root;
    return soundData;
  }

  /**
   * Gets a note number from the current pattern, adjusts it based on the scale, and transposes it.
   * @param currentScale The scale currently active.
   * @returns The calculated MIDI note number.
   */
  function getScaleAdjustedPatternNote(currentScale: ScaleName): number {
    if (pattern < 0) {
      changePattern(); // Ensure a pattern is selected
    }
    const patternNote: number = patterns[pattern][currentStep];
    const scaleAdjustment: number = scales[currentScale][patternNote % 12];
    const scaleAdjustedNote: number = patternNote + scaleAdjustment;
    const transposedNote: number = transpose + scaleAdjustedNote;
    currentStep = (currentStep + 1) % patterns[pattern].length; // Move to the next step in the pattern
    return transposedNote;
  }

  /**
   * Generates a random integer between 0 (inclusive) and maxExclusive (exclusive).
   * @param maxExclusive The upper bound (exclusive).
   * @returns A random integer.
   */
  function getRandomInt(maxExclusive: number): number {
    return Math.floor(maxExclusive * Math.random());
  }

  /** Selects a new random pattern index and resets the step counter. */
  function changePattern(): void {
    pattern = getRandomInt(patterns.length);
    currentStep = 0;
  }

  /**
   * Finds the value in a target array that is numerically closest to a source value.
   * @param targetArray The array of numbers to search within.
   * @param sourceValue The value to find the closest match for.
   * @returns The value from the array closest to the source value.
   */
  function getClosestTarget(
    targetArray: number[],
    sourceValue: number
  ): number {
    return targetArray.reduce(
      (closestValue: number, currentValue: number): number => {
        return Math.abs(currentValue - sourceValue) <
          Math.abs(closestValue - sourceValue)
          ? currentValue
          : closestValue;
      }
    );
  }

  /**
   * Adjusts a given note value to fit within a set of target notes for the current scale,
   * if it doesn't already align with one.
   * @param noteValue The MIDI note number to adjust.
   * @param targetNotes An array of target note indices (0-11) for the scale.
   * @returns The adjusted MIDI note number.
   */
  function adjustNoteToScale(noteValue: number, targetNotes: number[]): number {
    const noteIndex: number = ((noteValue % 12) + 5) % 12; // Normalize to 0-11 range relative to a root
    // Check if the note's index is already one of the target notes
    if (
      targetNotes.find((targetValue: number) => targetValue === noteIndex) ===
      undefined
    ) {
      // If not, find the closest target note index
      const closestTarget: number = getClosestTarget(targetNotes, noteValue);
      // Adjust the note towards the closest target
      let adjustedNote: number = noteValue - (noteIndex - closestTarget);
      // Apply the scale adjustment based on the *new* adjusted note's position in the scale
      const scaleAdjustment: number =
        scales[scale][((adjustedNote % 12) + 5) % 12];
      noteValue = adjustedNote + scaleAdjustment;
    }
    return noteValue;
  }

  /**
   * Finds the NoteItem corresponding to a given MIDI tone number.
   * @param tone The MIDI tone number.
   * @returns The matching NoteItem, or undefined if not found.
   */
  function getNoteFromSemitone(tone: number): NoteItem | undefined {
    return notes.find(
      (note: NoteItem) =>
        note.metaData.startRange <= tone && tone <= note.metaData.endRange
    );
  }

  // --- Musical state variables ---
  let currentScaleProgression: number = 0;
  let lastRoot: number | undefined = undefined;
  let pattern: number = -1;
  let scale: ScaleName = ScaleName.Custom;
  let transpose: number = -5;
  let currentStep: number = 0;
  let lastNoteTime: number = 0;
  let lastNoteNumber: number = 0;
  let noteCount: number = 0;
  const maxNNotesPerPattern: number = 30;

  return cj;
};

export default ComfyJazz;
