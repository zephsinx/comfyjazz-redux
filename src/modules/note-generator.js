/**
 * Note Generator Module
 * Handles generation of musical notes and progressions
 */

import { generateRandomInteger, harmonizeNoteWithTargets } from './music-theory.js';

import { scales, patterns, notes, scaleProgression } from './config.js';

// Musical state
let currentScaleProgression = 0;
let lastRoot = undefined;
let pattern = -1;
let scale = 'custom';
let transpose = -5;
let currentStep = 0;
let lastNoteTime = 0;
let lastNoteNumber = 0;
let noteCount = 0;
const scaleAdjustmentCache = {};

/**
 * Initializes the note generator with scale adjustments
 */
export const initNoteGenerator = () => {
  // Pre-compute scale adjustments for all scales
  Object.keys(scales).forEach((scaleName) => {
    scaleAdjustmentCache[scaleName] = {};
    for (let i = 0; i < 12; i++) {
      scaleAdjustmentCache[scaleName][i] = scales[scaleName][i % 12];
    }
  });
};

/**
 * Selects a random pattern
 */
export const selectRandomPattern = () => {
  pattern = generateRandomInteger(patterns.length);
  currentStep = 0;
};

/**
 * Updates the current scale progression based on time position
 * @param {number} currentTime - Current time position in seconds
 */
export const updateCurrentScaleProgression = (currentTime) => {
  for (let i = 0; i < scaleProgression.length; i++) {
    if (scaleProgression[i].start <= currentTime && currentTime <= scaleProgression[i].end) {
      currentScaleProgression = i;
      break;
    }
  }
};

/**
 * Gets a note from the current pattern and applies scale adjustments
 * @returns {number} - Modified note value
 */
export const deriveNoteFromScaleAndPattern = () => {
  if (pattern < 0) {
    selectRandomPattern();
  }

  let patternNote = patterns[pattern][currentStep];

  let scaleAdjustedNote = patternNote;
  const mod12 = patternNote % 12;

  // Apply scale adjustment
  if (scaleAdjustmentCache[scale] && scaleAdjustmentCache[scale][mod12] !== undefined) {
    scaleAdjustedNote += scaleAdjustmentCache[scale][mod12];
  } else {
    scaleAdjustedNote += scales[scale][mod12];
  }

  // Apply global transposition
  const transposedNote = transpose + scaleAdjustedNote;

  // Move to next step in pattern
  currentStep = (currentStep + 1) % patterns[pattern].length;

  return transposedNote;
};

/**
 * Finds a note object for a semitone value
 * @param {number} semitone - Semitone value
 * @returns {Object} - Matching note object
 */
export const findSoundObjectForSemitone = (semitone) => {
  return (
    notes.find(
      (note) => note.metaData.startRange <= semitone && semitone <= note.metaData.endRange
    ) || notes[notes.length - 1]
  );
};

/**
 * Generates the next note based on current musical context
 * @returns {Object} - Note object with URL and playback rate
 */
export const generateNextMelodyNote = () => {
  // Reset pattern if needed
  if (performance.now() - lastNoteTime > 900 || noteCount > 30) {
    selectRandomPattern();
    noteCount = 0;
  }

  // Get current progression data
  const currentProgression = scaleProgression[currentScaleProgression];
  scale = currentProgression.scale;

  // Generate a note value
  let noteValue = deriveNoteFromScaleAndPattern();

  // Avoid repeating the same note
  while (noteValue === lastNoteNumber) {
    noteValue = deriveNoteFromScaleAndPattern();
  }

  // Harmonize with the current progression if root changed
  if (currentProgression.root !== lastRoot) {
    noteValue = harmonizeNoteWithTargets(
      noteValue,
      currentProgression.targetNotes,
      scale,
      scaleAdjustmentCache,
      scales
    );
  }

  // Find the appropriate sound object
  const midiNote = noteValue || 48;
  const noteObj = findSoundObjectForSemitone(midiNote);

  // Calculate playback rate
  const semitoneOffset = midiNote - noteObj.metaData.root;

  // Update state
  noteCount++;
  lastNoteTime = performance.now();
  lastNoteNumber = noteValue;
  lastRoot = currentProgression.root;

  // Return data needed to play the note
  return {
    url: noteObj.url,
    metaData: noteObj.metaData,
    semitoneOffset,
  };
};
