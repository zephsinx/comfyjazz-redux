import { Howl } from "howler";
import {
  ScaleName,
  ScaleProgressionItem,
  NoteItem,
  scaleProgression,
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
  transpose?: number;
}

// Represents the data structure returned by selectNextNote
interface SoundData extends NoteItem {
  playbackRate: number;
}

// Represents the data structure received from the worker
interface WorkerSoundData {
  url: string;
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
  transpose: number;
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

  // --- Add new setters ---
  /** Sets the instrument(s) to use for playing notes. */
  setInstrument: (instrument: string) => void;
  /** Enables or disables the automatic playing of notes. */
  setPlayAutoNotes: (play: boolean) => void;
  /** Sets the probability (0-1) of an automatic note playing during a check cycle. */
  setAutoNotesChance: (chance: number) => void;
  /** Sets the delay (in ms) between automatic note playing checks. */
  setAutoNotesDelay: (delay: number) => void;
  /** Sets the overall pitch transposition in semitones. */
  setTranspose: (semitones: number) => void;
}

// --- Global Audio Cache & State ---
const noteSoundCache = new Map<string, Howl>();
let globalInstanceRef: ComfyJazzInstance | null = null; // Reference to the current instance for context

// --- Audio Playback Functions (Module Scope) ---

/**
 * Plays a single note sound using Howler, with caching and fade-out effect.
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
    let noteSound: Howl | undefined = noteSoundCache.get(url);

    if (noteSound) {
      // Reuse cached sound
      noteSound.volume(volume);
      noteSound.rate(rate);
      noteSound.seek(0); // Restart sound if playing
      noteSound.play();
      noteSound.fade(volume, 0.0, 1000); // Apply fade
      if (globalInstanceRef) globalInstanceRef.lastSound = noteSound;
      resolve();
    } else {
      // Create and cache new sound
      noteSound = new Howl({
        src: [url],
        volume: volume,
        rate: rate,
        onend: function () {
          resolve();
        },
        onloaderror: function (_id, err) {
          console.error(`Error loading sound ${url}:`, err);
          noteSoundCache.delete(url); // Remove from cache on error
          resolve(); // Resolve anyway to not block execution
        },
        onplayerror: function (_id, err) {
          console.error(`Error playing sound ${url}:`, err);
          resolve(); // Resolve anyway
        }
      });
      noteSoundCache.set(url, noteSound);
      noteSound.play();
      noteSound.fade(volume, 0.0, 1000); // Apply fade
      if (globalInstanceRef) globalInstanceRef.lastSound = noteSound;
    }
  });
}

/**
 * Plays the background sound loop using Howler.
 */
function playBackgroundSound(
  url: string,
  volume: number = 1,
  rate: number = 1
): Promise<void> {
    return new Promise<void>((resolve, _reject) => {
      // Stop and unload previous background sound if it exists
      globalInstanceRef?.backgroundSound?.stop();
      globalInstanceRef?.backgroundSound?.unload();

      const backgroundSound = new Howl({
        src: [url],
        volume: volume,
        rate: rate, // Apply rate
        loop: true, // Ensure it loops
        onend: function () { // Should not trigger if loop: true, but good practice
          resolve();
        },
        onloaderror: function (_id, err) {
          console.error(`Error loading background sound ${url}:`, err);
          resolve();
        },
        onplayerror: function (_id, err) {
           console.error(`Error playing background sound ${url}:`, err);
           resolve();
        }
      });
      // backgroundSound.rate(rate); // Rate set in constructor now
      backgroundSound.play();
      if (globalInstanceRef) globalInstanceRef.backgroundSound = backgroundSound;
    });
  }


// --- Worker Setup ---
let noteWorker: Worker | null = null;
if (window.Worker) {
  noteWorker = new Worker(new URL('./note-worker.ts', import.meta.url), {
    type: 'module'
  });
  console.log("Note worker created.");

  noteWorker.onmessage = (event: MessageEvent<WorkerSoundData>) => {
    const { url, playbackRate } = event.data;
    if (url && playbackRate && globalInstanceRef) { // Check globalInstanceRef
      const instrument = globalInstanceRef.instrument.split(",").map(x => x.trim())[0] || 'piano';
      const baseUrl = globalInstanceRef.baseUrl || 'web/sounds';
      const fullUrl = `${baseUrl}/${instrument}/${url}.ogg`;
      const volume = globalInstanceRef.volume ?? 1;
      playNoteSound(fullUrl, volume, playbackRate); // Call module-scoped function
    } else {
      console.error("Main thread received invalid data from worker or instance not ready:", event.data);
    }
  };

  noteWorker.onerror = (error) => {
    console.error("Error in note worker:", error);
  };

} else {
  console.error("Web Workers are not supported in this browser.");
}

// --- ComfyJazz Factory Function ---
const ComfyJazz = (options: ComfyJazzOptions = {}): ComfyJazzInstance => {
  const defaultOptions = {
    baseUrl: "web/sounds",
    instrument: "piano",
    autoNotesDelay: 300,
    autoNotesChance: 0.2,
    playAutoNotes: true,
    backgroundLoopUrl: "jazz_loop.ogg",
    backgroundLoopDuration: 27.428,
    volume: 1,
    transpose: -5,
  };
  const config = { ...defaultOptions, ...options };

  const cj: ComfyJazzInstance = {
    ...config,
    backgroundSound: null,
    lastSound: null,

    setVolume: (vol: number): void => {
      const clampedVol = Math.max(0, Math.min(1, vol));
      cj.volume = clampedVol;
      config.volume = clampedVol;
      cj.backgroundSound?.volume(clampedVol);
      // Note: Volume for note sounds is applied in playNoteSound
    },
    mute: (): void => {
      cj.setVolume(0);
    },
    unmute: (): void => {
      cj.setVolume(config.volume);
    },
    isMuted: (): boolean => cj.volume <= 0,
    start: startComfyJazz,
    playNoteProgression: playSequentialNotesWithDelays,
    playNote: playNoteWithRandomDelay,

    setInstrument: (instrumentName: string): void => {
        if (typeof instrumentName === 'string' && instrumentName.trim().length > 0) {
            const newInstrument = instrumentName.trim();
            if (newInstrument !== cj.instrument) {
                noteSoundCache.forEach((sound) => sound.unload());
                noteSoundCache.clear();
                cj.instrument = newInstrument;
            }
        } else {
            console.warn(
                `Invalid instrument name provided: ${instrumentName}. Using previous: ${cj.instrument}`
            );
        }
    },
    setPlayAutoNotes: (play: boolean): void => {
      cj.playAutoNotes = !!play;
    },
    setAutoNotesChance: (chance: number): void => {
      if (typeof chance === 'number' && !isNaN(chance)) {
         cj.autoNotesChance = Math.max(0, Math.min(1, chance));
      } else {
         console.warn(`Invalid autoNotesChance provided: ${chance}. Using previous: ${cj.autoNotesChance}`);
      }
    },
    setAutoNotesDelay: (delay: number): void => {
      if (typeof delay === 'number' && !isNaN(delay) && delay >= 0) {
         cj.autoNotesDelay = Math.max(50, Math.round(delay));
      } else {
         console.warn(`Invalid autoNotesDelay provided: ${delay}. Using previous: ${cj.autoNotesDelay}`);
      }
    },
    setTranspose: (semitones: number): void => {
      if (typeof semitones === 'number' && !isNaN(semitones)) {
        const newTranspose = Math.round(semitones);
        cj.transpose = newTranspose;
        noteWorker?.postMessage({ type: "setState", payload: { transpose: newTranspose } });
      } else {
        console.warn(
          `Invalid transpose value provided: ${semitones}. Using previous: ${cj.transpose}`
        );
      }
    },
  };

  globalInstanceRef = cj; // Update the global reference when a new instance is created

  // --- State and Functions within Instance Scope ---
  let currentScaleProgression: number = 0;

  async function startComfyJazz(): Promise<void> {
    noteWorker?.postMessage({ type: "setState", payload: { transpose: cj.transpose } });

    // let startTime: number = performance.now(); // startTime no longer needed for loop logic
    // Use module-scoped playBackgroundSound - it will loop automatically
    playBackgroundSound(`${cj.baseUrl}/${cj.backgroundLoopUrl}`, cj.volume, 1);

    const AutomaticPlayNote = async (): Promise<void> => {
      // Determine current scale progression index based on elapsed time within the loop
      // We still need a way to track time relative to *something* if scaleProgression depends on it.
      // Let's use the Howler instance's seek time if available.
      const bgSound = globalInstanceRef?.backgroundSound;
      let currentTime = 0;
      if (bgSound && bgSound.playing()) {
          currentTime = bgSound.seek() as number; // Get current playback position
      } else {
          // Fallback or initial state if sound isn't playing yet
          // This part might need refinement depending on desired behavior before loop starts
          currentTime = (performance.now() % (cj.backgroundLoopDuration * 1000)) / 1000;
      }

      // Determine current scale progression index
      let foundProgression = false;
      for (let i = 0; i < scaleProgression.length; i++) {
        if (
          scaleProgression[i].start <= currentTime &&
          currentTime <= scaleProgression[i].end
        ) {
          currentScaleProgression = i;
          foundProgression = true;
          break;
        }
      }
      if (!foundProgression) {
          // If seek time is beyond the last progression end, loop back or default
          currentScaleProgression = 0; 
      }

      // Request note from worker if auto-play enabled
      if (cj.playAutoNotes && Math.random() < cj.autoNotesChance) {
        playNoteWithRandomDelay(0, 200);
      }

      setTimeout(AutomaticPlayNote, cj.autoNotesDelay);
    };

    AutomaticPlayNote();
  }

  async function playNoteWithRandomDelay(
    minRandom: number = 0,
    maxRandom: number = 200
  ): Promise<void> {
    setTimeout(() => {
        if (!noteWorker) {
            console.error("Note worker not available.");
            return;
        }
        noteWorker.postMessage({ 
            type: "generateNote", 
            // Send current progression index to worker
            payload: { currentScaleProgression: currentScaleProgression } 
        });
    }, minRandom + Math.random() * maxRandom);
  }

  function playSequentialNotesWithDelays(numNotes: number): void {
    for (let i = 0; i < numNotes; i++) {
      playNoteWithRandomDelay(100, 200 * i);
    }
  }

  return cj;
};

export default ComfyJazz;
