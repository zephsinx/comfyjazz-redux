import {
  ScaleName,
  ScaleProgressionItem,
  NoteItem,
  scaleProgression,
  scales,
  patterns,
  notes,
} from "./comfyjazz-constants";

// --- Interfaces (Subset needed for worker) ---

// Represents the data structure returned by the worker
interface WorkerSoundData {
  url: string;
  playbackRate: number;
}

// Message types for communication
interface WorkerMessage {
  type: "generateNote" | "setState";
  payload?: any;
}

interface WorkerState {
  transpose: number;
  // Add other state elements if needed later
}

// --- Worker State ---
let workerState: WorkerState = {
  transpose: -5, // Default transpose
};

// --- Musical state variables (managed within the worker) ---
let currentScaleProgression: number = 0;
let lastRoot: number | undefined = undefined;
let pattern: number = -1;
let scale: ScaleName = ScaleName.Custom; // Initial value, will be updated
let currentStep: number = 0;
let lastNoteTime: number = 0;
let lastNoteNumber: number = 0;
let noteCount: number = 0;
const maxNNotesPerPattern: number = 30;

// --- Utility Functions (Copied from comfyjazz.ts) ---

function semitonesToPlaybackRate(semitones: number): number {
  const semitoneRatio: number = Math.pow(2, 1 / 12);
  return Math.pow(semitoneRatio, semitones);
}

function getRandomInt(maxExclusive: number): number {
  return Math.floor(maxExclusive * Math.random());
}

function changePattern(): void {
  pattern = getRandomInt(patterns.length);
  currentStep = 0;
}

function getClosestTarget(targetArray: number[], sourceValue: number): number {
  return targetArray.reduce(
    (closestValue: number, currentValue: number): number => {
      return Math.abs(currentValue - sourceValue) <
        Math.abs(closestValue - sourceValue)
        ? currentValue
        : closestValue;
    }
  );
}

// --- Core Note Logic Functions (Adapted for Worker) ---

function getScaleAdjustedPatternNote(currentScale: ScaleName): number {
  if (pattern < 0) {
    changePattern(); // Ensure a pattern is selected
  }
  // Ensure pattern index is valid
  if (pattern >= patterns.length) pattern = patterns.length - 1;
  const currentPattern = patterns[pattern];
  if (!currentPattern) {
    console.error("Worker: Invalid pattern selected", pattern);
    changePattern(); // Try selecting a new pattern
    return 60; // Default to C4 if pattern fails
  }
  if (currentStep >= currentPattern.length) currentStep = 0; // Reset step if out of bounds

  const patternNote: number = currentPattern[currentStep];

  // Ensure scale exists
  const currentScaleData = scales[currentScale];
  if (!currentScaleData) {
      console.error("Worker: Invalid scale selected", currentScale);
      // Potentially default to a known scale or handle error
      return 60; // Default to C4
  }
  const scaleAdjustment: number = currentScaleData[patternNote % 12];
  const scaleAdjustedNote: number = patternNote + scaleAdjustment;
  // Use worker's internal transpose state
  const transposedNote: number = workerState.transpose + scaleAdjustedNote;
  currentStep = (currentStep + 1) % currentPattern.length;
  return transposedNote;
}

function adjustNoteToScale(noteValue: number, targetNotes: number[]): number {
  const noteIndex: number = ((noteValue % 12) + 12) % 12; // Ensure positive modulo

  if (!targetNotes.includes(noteIndex)) {
    const closestTargetIndex: number = getClosestTarget(targetNotes, noteIndex);
    // Calculate difference carefully, considering wrap-around (e.g., diff between 11 and 0)
    let diff = noteIndex - closestTargetIndex;
    if (Math.abs(diff) > 6) {
        diff = diff > 0 ? diff - 12 : diff + 12;
    }
    let adjustedNote: number = noteValue - diff; // Adjust towards the closest target

    // Recalculate scale adjustment based on the *new* note's position
    const newNoteIndex = ((adjustedNote % 12) + 12) % 12;
     const scaleAdjustment: number = scales[scale] ? scales[scale][newNoteIndex] : 0;
    noteValue = adjustedNote + scaleAdjustment;

  }
  return noteValue;
}

function getNoteFromSemitone(tone: number): NoteItem | undefined {
    return notes.find(
      (note: NoteItem) =>
        note.metaData.startRange <= tone && tone <= note.metaData.endRange
    );
  }


function selectNextNoteWorker(): WorkerSoundData {
  // Check if it's time to change the melodic pattern
  // Use worker's internal state
  if (
    performance.now() - lastNoteTime > 900 ||
    noteCount > maxNNotesPerPattern
  ) {
    changePattern();
    noteCount = 0;
  }

  // Update current scale based on progression (needs current time)
  // TODO: Need to pass current time from main thread or manage time differently
  // For now, let's assume we can derive currentScaleProgression somehow
  // Placeholder: Using the worker's state directly - might need refinement
  const progression: ScaleProgressionItem = scaleProgression[currentScaleProgression];
  if (!progression) {
    console.error("Worker: Invalid currentScaleProgression", currentScaleProgression);
    currentScaleProgression = 0; // Reset to default
    return { url: "note_48", playbackRate: 1 }; // Default
  }
  scale = progression.scale; // Update the currently active scale

  let noteNumber: number = getScaleAdjustedPatternNote(scale);

  while (noteNumber === lastNoteNumber) {
    noteNumber = getScaleAdjustedPatternNote(scale);
  }

  if (progression.root !== lastRoot) {
      if (progression.targetNotes && progression.targetNotes.length > 0) {
          noteNumber = adjustNoteToScale(noteNumber, progression.targetNotes);
      } else {
          console.warn("Worker: targetNotes missing or empty for progression", currentScaleProgression);
      }
  }

  const midiNote: number = noteNumber || 48;
  const soundDataBase: NoteItem | undefined = getNoteFromSemitone(midiNote);

  if (!soundDataBase) {
    console.error(
      `Worker: Could not find note data for MIDI note: ${midiNote}. Using default.`
    );
    const defaultNote = notes.find((n) => n.url === "note_48") || notes[notes.length - 1];
    const semitoneOffset = midiNote - defaultNote.metaData.root;
    return {
      url: defaultNote.url,
      playbackRate: semitonesToPlaybackRate(semitoneOffset),
    };
  }

  const semitoneOffset: number = midiNote - soundDataBase.metaData.root;
  const playbackRate: number = semitonesToPlaybackRate(semitoneOffset);

  const soundData: WorkerSoundData = {
    url: soundDataBase.url,
    playbackRate: playbackRate,
  };

  // Update worker's internal state
  noteCount++;
  lastNoteTime = performance.now();
  lastNoteNumber = noteNumber;
  lastRoot = progression.root;

  return soundData;
}

// --- Message Handler ---

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case "generateNote":
      // TODO: Update currentScaleProgression based on payload.currentTime if provided
      const soundData = selectNextNoteWorker();
      self.postMessage(soundData);
      break;
    case "setState":
      if (payload && typeof payload.transpose === 'number') {
        workerState.transpose = payload.transpose;
      }
      // Update other state elements as needed
      break;
    default:
      console.warn("Worker received unknown message type:", type);
  }
};

console.log("Note worker initialized."); 