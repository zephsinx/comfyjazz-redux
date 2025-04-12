// --- Enums ---

export enum ScaleName {
  Diatonic = "diatonic",
  Dorian = "dorian",
  Phrygian = "phrygian",
  Lydian = "lydian",
  Mixolydian = "mixolydian",
  Aeolian = "aeolian",
  Locrian = "locrian",
  HarmonicMinor = "harmonicMinor",
  MelodicMinor = "melodicMinor",
  MajorPentatonic = "majorPentatonic",
  MinorPentatonic = "minorPentatonic",
  DoubleHarmonic = "doubleHarmonic",
  HalfDim = "halfDim",
  Chromatic = "chromatic",
  Custom = "custom",
  Custom2 = "custom2",
}

// --- Interfaces (Needed by constants below) ---

export interface ScaleProgressionItem {
  start: number;
  end: number;
  scale: ScaleName;
  targetNotes: number[];
  root: number;
}

export interface NoteMetaData {
  root: number;
  startRange: number;
  endRange: number;
}

export interface NoteItem {
  url: string;
  metaData: NoteMetaData;
}

// --- Constant Data ---

export const scaleProgression: ScaleProgressionItem[] = [
  {
    start: 0,
    end: 3.428,
    scale: ScaleName.Custom,
    targetNotes: [2, 4, 7],
    root: 7,
  },
  {
    start: 3.428,
    end: 6.857,
    scale: ScaleName.Diatonic,
    targetNotes: [2, 4, 7],
    root: 2,
  },
  {
    start: 6.857,
    end: 10.285,
    scale: ScaleName.Custom,
    targetNotes: [2, 4, 7],
    root: 7,
  },
  {
    start: 10.285,
    end: 12,
    scale: ScaleName.Diatonic,
    targetNotes: [4, 5, 9],
    root: 9,
  },
  {
    start: 12,
    end: 13.714,
    scale: ScaleName.Custom2,
    targetNotes: [2, 4, 11],
    root: 2,
  },
  {
    start: 13.714,
    end: 17.142,
    scale: ScaleName.Custom,
    targetNotes: [4, 7, 11],
    root: 11,
  },
  {
    start: 17.142,
    end: 20.571,
    scale: ScaleName.Custom,
    targetNotes: [0, 2, 4],
    root: 4,
  },
  {
    start: 20.571,
    end: 24,
    scale: ScaleName.Diatonic,
    targetNotes: [4, 5, 9],
    root: 9,
  },
  {
    start: 24,
    end: 27.428,
    scale: ScaleName.Custom2,
    targetNotes: [2, 4, 11],
    root: 2,
  },
];

export const scales: Record<ScaleName, number[]> = {
  [ScaleName.Diatonic]: [0, -1, 0, -1, 0, 0, -1, 0, -1, 0, -1, 0],
  [ScaleName.Dorian]: [0, 1, 0, 0, -1, 0, 1, 0, 1, 0, 0, -1],
  [ScaleName.Phrygian]: [0, 0, -1, 0, -1, 0, 1, 0, 0, -1, 0, -1],
  [ScaleName.Lydian]: [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
  [ScaleName.Mixolydian]: [0, 1, 0, 1, 0, 0, -1, 0, -1, 0, 0, -1],
  [ScaleName.Aeolian]: [0, -1, 0, 0, -1, 0, -1, 0, 0, -1, 0, -1],
  [ScaleName.Locrian]: [0, 0, -1, 0, -1, 0, 0, -1, 0, -1, 0, -1],
  [ScaleName.HarmonicMinor]: [0, 1, 0, 0, -1, 0, 1, 0, 0, -1, 1, 0],
  [ScaleName.MelodicMinor]: [0, 1, 0, 0, -1, 0, 1, 0, -1, 0, 1, 0],
  [ScaleName.MajorPentatonic]: [0, 1, 0, 1, 0, -1, 1, 0, 1, 0, -1, 1],
  [ScaleName.MinorPentatonic]: [0, -1, 1, 0, -1, 0, 1, 0, -1, 1, 0, -1],
  [ScaleName.DoubleHarmonic]: [0, 0, -1, 1, 0, 0, 1, 0, 0, -1, 1, 0],
  [ScaleName.HalfDim]: [0, 1, 0, 0, -1, 0, 0, -1, 0, -1, 0, -1],
  [ScaleName.Chromatic]: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [ScaleName.Custom]: [0, -1, 0, -1, 0, -1, -1, 0, -1, 0, -1, 0],
  [ScaleName.Custom2]: [-1, 0, 0, -1, 0, 0, 1, 0, 0, -1, 0, 0],
};

export const patterns: number[][] = [
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

export const notes: NoteItem[] = [
  { url: "note_96", metaData: { root: 96, startRange: 95, endRange: 127 } },
  { url: "note_93", metaData: { root: 93, startRange: 92, endRange: 94 } },
  { url: "note_90", metaData: { root: 90, startRange: 89, endRange: 91 } },
  { url: "note_87", metaData: { root: 87, startRange: 86, endRange: 88 } },
  { url: "note_84", metaData: { root: 84, startRange: 83, endRange: 85 } },
  { url: "note_81", metaData: { root: 81, startRange: 80, endRange: 82 } },
  { url: "note_77", metaData: { root: 77, startRange: 76, endRange: 78 } },
  { url: "note_74", metaData: { root: 74, startRange: 73, endRange: 75 } },
  { url: "note_71", metaData: { root: 71, startRange: 70, endRange: 72 } },
  { url: "note_69", metaData: { root: 69, startRange: 68, endRange: 70 } },
  { url: "note_66", metaData: { root: 66, startRange: 65, endRange: 67 } },
  { url: "note_63", metaData: { root: 63, startRange: 62, endRange: 64 } },
  { url: "note_60", metaData: { root: 60, startRange: 59, endRange: 61 } },
  { url: "note_57", metaData: { root: 57, startRange: 56, endRange: 58 } },
  { url: "note_54", metaData: { root: 54, startRange: 53, endRange: 55 } },
  { url: "note_51", metaData: { root: 51, startRange: 50, endRange: 52 } },
  { url: "note_48", metaData: { root: 48, startRange: 0, endRange: 49 } },
]; 