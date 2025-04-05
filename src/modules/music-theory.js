/**
 * Music Theory Module
 * Functions for calculating and transforming musical notes
 */

// Cache for pre-computed values
const playbackRateCache = {};

/**
 * Converts semitone differences to playback rate
 * @param {number} semitones - Semitones to shift
 * @returns {number} - Playback rate multiplier
 */
export const calculatePlaybackRateFromSemitones = (semitones) => {
  if (playbackRateCache[semitones] === undefined) {
    const semitoneRatio = Math.pow(2, 1 / 12);
    playbackRateCache[semitones] = Math.pow(semitoneRatio, semitones);
  }
  return playbackRateCache[semitones];
};

/**
 * Adds variation to a note within a range
 * @param {number} tone - Base tone
 * @param {number} startRange - Lower bound
 * @param {number} endRange - Upper bound
 * @returns {number} - Varied note value
 */
export const addRandomVariationToNote = (tone, startRange, endRange) => {
  const minValue = startRange;
  const maxValue = endRange;

  const shiftedValue = minValue + Math.random() * (maxValue - minValue);
  return shiftedValue;
};

/**
 * Generates a random integer
 * @param {number} number - Upper bound (exclusive)
 * @returns {number} - Random integer
 */
export const generateRandomInteger = (number) => {
  return Math.floor(number * Math.random());
};

/**
 * Finds the target note closest to a given note
 * @param {Array<number>} targetNotes - Target notes
 * @param {number} referenceNote - Reference note
 * @returns {number} - Closest target note
 */
export const findClosestTargetNote = (targetNotes, referenceNote) => {
  return targetNotes.reduce((closestSoFar, currentTarget) => {
    return Math.abs(currentTarget - referenceNote) < Math.abs(closestSoFar - referenceNote)
      ? currentTarget
      : closestSoFar;
  });
};

/**
 * Adjusts a note to fit target notes in the scale
 * @param {number} noteValue - Note to modify
 * @param {Array<number>} targetNotes - Target notes
 * @param {string} scale - Scale name
 * @param {Object} scaleAdjustmentCache - Cache of scale adjustments
 * @param {Object} scales - Scale definitions
 * @returns {number} - Modified note value
 */
export const harmonizeNoteWithTargets = (
  noteValue,
  targetNotes,
  scale,
  scaleAdjustmentCache,
  scales
) => {
  const normalizedNote = ((noteValue % 12) + 5) % 12;

  // Check if note is not in target notes
  if (targetNotes.findIndex((target) => target === normalizedNote) === -1) {
    const closestTarget = findClosestTargetNote(targetNotes, noteValue);
    let adjustedNote = noteValue - (normalizedNote - closestTarget);

    // Apply scale adjustment
    if (
      scaleAdjustmentCache[scale] &&
      scaleAdjustmentCache[scale][((adjustedNote % 12) + 5) % 12] !== undefined
    ) {
      noteValue = adjustedNote + scaleAdjustmentCache[scale][((adjustedNote % 12) + 5) % 12];
    } else {
      noteValue = adjustedNote + scales[scale][((adjustedNote % 12) + 5) % 12];
    }
  }

  return noteValue;
};
