import { ComfyJazzOptions } from "./web/comfyjazz";

// --- Utility Functions ---
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null;
  return (...args: Parameters<T>): void => {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// --- localStorage Helpers ---
const STORAGE_KEY = "comfyJazzSettings_v2";

interface SavedSettings extends Partial<ComfyJazzOptions> {
  enableStreamerBot?: boolean;
  maxNotesPerEvent?: number;
}

function loadSettings(): SavedSettings {
  const savedSettingsJSON = localStorage.getItem(STORAGE_KEY);
  if (savedSettingsJSON) {
    try {
      const parsed = JSON.parse(savedSettingsJSON);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch (e) {
      console.error("Error parsing saved settings:", e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  return {};
}

function saveSettings(
  cjSettings: ComfyJazzOptions,
  sbEnabled: boolean,
  maxNotes: number
) {
  if (!cjSettings) return;
  try {
    const settingsToSave: SavedSettings = {
      instrument: cjSettings.instrument,
      volume: cjSettings.volume,
      playAutoNotes: cjSettings.playAutoNotes,
      autoNotesChance: cjSettings.autoNotesChance,
      autoNotesDelay: cjSettings.autoNotesDelay,
      transpose: cjSettings.transpose,
      enableStreamerBot: sbEnabled,
      maxNotesPerEvent: maxNotes,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
  } catch (e) {
    console.error("Error saving settings:", e);
  }
}

// --- Default Settings ---
const defaultSettings: Required<SavedSettings> = {
  instrument: "piano",
  volume: 1,
  playAutoNotes: true,
  autoNotesChance: 0.2,
  autoNotesDelay: 300,
  transpose: -5,
  enableStreamerBot: false,
  maxNotesPerEvent: 7,
  baseUrl: "web/sounds",
  backgroundLoopUrl: "jazz_loop.ogg",
  backgroundLoopDuration: 27.428,
};

// --- State Management ---
let currentSettings: SavedSettings = loadSettings();
let enableStreamerBot =
  currentSettings.enableStreamerBot ?? defaultSettings.enableStreamerBot;
let maxNotesPerEvent =
  currentSettings.maxNotesPerEvent ?? defaultSettings.maxNotesPerEvent;

// Create a mock ComfyJazz instance for settings management
const mockComfyJazz: ComfyJazzOptions = {
  instrument: currentSettings.instrument ?? defaultSettings.instrument,
  volume: currentSettings.volume ?? defaultSettings.volume,
  playAutoNotes: currentSettings.playAutoNotes ?? defaultSettings.playAutoNotes,
  autoNotesChance:
    currentSettings.autoNotesChance ?? defaultSettings.autoNotesChance,
  autoNotesDelay:
    currentSettings.autoNotesDelay ?? defaultSettings.autoNotesDelay,
  transpose: currentSettings.transpose ?? defaultSettings.transpose,
  baseUrl: currentSettings.baseUrl ?? defaultSettings.baseUrl,
  backgroundLoopUrl:
    currentSettings.backgroundLoopUrl ?? defaultSettings.backgroundLoopUrl,
  backgroundLoopDuration:
    currentSettings.backgroundLoopDuration ??
    defaultSettings.backgroundLoopDuration,
};

// --- Control Element References ---
const toggleMultiInstrument = document.querySelector<HTMLInputElement>(
  "#obs-toggleMultiInstrument"
);
const instrumentRadioContainer = document.querySelector<HTMLDivElement>(
  "#obs-instrumentRadioContainer"
);
const instrumentCheckboxContainer = document.querySelector<HTMLDivElement>(
  "#obs-instrumentCheckboxContainer"
);
const instrumentCheckboxes = document.querySelectorAll<HTMLInputElement>(
  'input[name="obs-instrumentMulti"]'
);
const instrumentRadios = document.querySelectorAll<HTMLInputElement>(
  'input[name="obs-instrumentSingle"]'
);

const volumeSlider =
  document.querySelector<HTMLInputElement>("#obs-volumeSlider");
const volumeValueSpan = document.querySelector<HTMLSpanElement>(
  "#obs-volumeValueSpan"
);

const playAutoNotesCheckbox = document.querySelector<HTMLInputElement>(
  "#obs-playAutoNotesCheckbox"
);
const autoNotesChanceSlider = document.querySelector<HTMLInputElement>(
  "#obs-autoNotesChanceSlider"
);
const autoNotesChanceValueSpan = document.querySelector<HTMLSpanElement>(
  "#obs-autoNotesChanceValueSpan"
);
const autoNotesDelaySlider = document.querySelector<HTMLInputElement>(
  "#obs-autoNotesDelaySlider"
);
const autoNotesDelayValueSpan = document.querySelector<HTMLSpanElement>(
  "#obs-autoNotesDelayValueSpan"
);

const transposeSlider = document.querySelector<HTMLInputElement>(
  "#obs-transposeSlider"
);
const transposeValueSpan = document.querySelector<HTMLSpanElement>(
  "#obs-transposeValueSpan"
);

const maxNotesInput =
  document.querySelector<HTMLInputElement>("#obs-maxNotesInput");
const enableStreamerBotCheckbox = document.querySelector<HTMLInputElement>(
  "#obs-enableStreamerBotCheckbox"
);
const resetSettingsBtn = document.querySelector<HTMLButtonElement>(
  "#obs-resetSettingsBtn"
);
const autoNotesToggle = document.querySelector<HTMLButtonElement>(
  "#obs-autoNotesToggle"
);
const autoNotesContent = document.querySelector<HTMLDivElement>(
  "#obs-autoNotesContent"
);

// --- Helper Functions ---
function saveCurrentSettings() {
  saveSettings(mockComfyJazz, enableStreamerBot, maxNotesPerEvent);
}

function updateInstrumentState() {
  if (!toggleMultiInstrument) return;

  let instrumentString = defaultSettings.instrument;

  if (toggleMultiInstrument.checked) {
    // Multi-select mode
    const checkedInstruments = Array.from(instrumentCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);
    instrumentString = checkedInstruments.join(",");

    // Ensure at least one is checked in multi-mode
    if (instrumentString.length === 0) {
      instrumentString = defaultSettings.instrument;
      const defaultCheckbox = document.getElementById(
        `obs-instr-check-${instrumentString}`
      ) as HTMLInputElement | null;
      if (defaultCheckbox) defaultCheckbox.checked = true;
    }
  } else {
    // Single-select mode
    const selectedRadio = document.querySelector<HTMLInputElement>(
      'input[name="obs-instrumentSingle"]:checked'
    );
    if (selectedRadio) {
      instrumentString = selectedRadio.value;
    }
  }

  mockComfyJazz.instrument = instrumentString;
  saveCurrentSettings();
}

function initializeControls() {
  if (
    !toggleMultiInstrument ||
    !instrumentRadioContainer ||
    !instrumentCheckboxContainer
  )
    return;

  // Initialize Streamer.bot checkbox
  if (enableStreamerBotCheckbox) {
    enableStreamerBotCheckbox.checked = enableStreamerBot;
  }

  // Initialize volume slider
  if (volumeSlider) {
    volumeSlider.value = String(mockComfyJazz.volume);
    if (volumeValueSpan) {
      volumeValueSpan.textContent = parseFloat(volumeSlider.value).toFixed(2);
    }
  }

  // Initialize auto-notes controls
  if (playAutoNotesCheckbox) {
    playAutoNotesCheckbox.checked = mockComfyJazz.playAutoNotes ?? false;
  }
  if (autoNotesChanceSlider) {
    autoNotesChanceSlider.value = String(mockComfyJazz.autoNotesChance);
    if (autoNotesChanceValueSpan) {
      autoNotesChanceValueSpan.textContent = parseFloat(
        autoNotesChanceSlider.value
      ).toFixed(2);
    }
  }
  if (autoNotesDelaySlider) {
    autoNotesDelaySlider.value = String(mockComfyJazz.autoNotesDelay);
    if (autoNotesDelayValueSpan) {
      autoNotesDelayValueSpan.textContent = autoNotesDelaySlider.value;
    }
  }

  // Initialize transpose slider
  if (transposeSlider) {
    transposeSlider.value = String(mockComfyJazz.transpose);
    if (transposeValueSpan) {
      transposeValueSpan.textContent = transposeSlider.value;
    }
  }

  // Initialize max notes input
  if (maxNotesInput) {
    maxNotesInput.value = String(maxNotesPerEvent);
  }

  // Initialize instrument controls
  const currentInstrument =
    mockComfyJazz.instrument ?? defaultSettings.instrument;
  const isMultiMode = currentInstrument.includes(",");
  toggleMultiInstrument.checked = isMultiMode;

  if (isMultiMode) {
    instrumentRadioContainer.classList.add("hide");
    instrumentCheckboxContainer.classList.remove("hide");

    // Set checkboxes based on current instrument string
    const instruments = currentInstrument.split(",");
    instrumentCheckboxes.forEach((checkbox) => {
      checkbox.checked = instruments.includes(checkbox.value);
    });
  } else {
    instrumentRadioContainer.classList.remove("hide");
    instrumentCheckboxContainer.classList.add("hide");

    // Set radio button based on current instrument
    const radioToCheck = document.getElementById(
      `obs-instr-radio-${currentInstrument}`
    ) as HTMLInputElement | null;
    if (radioToCheck) {
      radioToCheck.checked = true;
    }
  }
}

// --- Event Listeners ---

// Multi-instrument toggle
if (
  toggleMultiInstrument &&
  instrumentRadioContainer &&
  instrumentCheckboxContainer
) {
  toggleMultiInstrument.addEventListener("change", () => {
    const isMulti = toggleMultiInstrument.checked;
    instrumentRadioContainer.classList.toggle("hide", isMulti);
    instrumentCheckboxContainer.classList.toggle("hide", !isMulti);

    if (isMulti) {
      // Switching to multi-select - check the box corresponding to currently selected radio
      const currentSingle = document.querySelector<HTMLInputElement>(
        'input[name="obs-instrumentSingle"]:checked'
      );
      if (currentSingle) {
        const correspondingCheckbox = document.getElementById(
          `obs-instr-check-${currentSingle.value}`
        ) as HTMLInputElement | null;
        if (correspondingCheckbox) {
          correspondingCheckbox.checked = true;
        }
      }
    } else {
      // Switching to single-select - select radio corresponding to first checked checkbox
      const firstChecked = Array.from(instrumentCheckboxes).find(
        (cb) => cb.checked
      );
      if (firstChecked) {
        const correspondingRadio = document.getElementById(
          `obs-instr-radio-${firstChecked.value}`
        ) as HTMLInputElement | null;
        if (correspondingRadio) {
          correspondingRadio.checked = true;
        }
      }
    }

    updateInstrumentState();
  });
}

// Instrument radio buttons
instrumentRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    if (!toggleMultiInstrument?.checked) {
      updateInstrumentState();
    }
  });
});

// Instrument checkboxes
instrumentCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    if (toggleMultiInstrument?.checked) {
      updateInstrumentState();
    }
  });
});

// Volume slider
if (volumeSlider && volumeValueSpan) {
  const debouncedSetVolume = debounce((value: number) => {
    if (!isNaN(value)) {
      mockComfyJazz.volume = value;
      saveCurrentSettings();
    }
  }, 100);

  volumeSlider.addEventListener("input", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const newVolume = parseFloat(target.value);
    volumeValueSpan.textContent = newVolume.toFixed(2);
    debouncedSetVolume(newVolume);
  });
}

// Auto-notes checkbox
if (playAutoNotesCheckbox) {
  playAutoNotesCheckbox.addEventListener("change", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    mockComfyJazz.playAutoNotes = target.checked;
    saveCurrentSettings();
  });
}

// Auto-notes chance slider
if (autoNotesChanceSlider && autoNotesChanceValueSpan) {
  const debouncedSetAutoNotesChance = debounce((value: number) => {
    if (!isNaN(value)) {
      mockComfyJazz.autoNotesChance = value;
      saveCurrentSettings();
    }
  }, 100);

  autoNotesChanceSlider.addEventListener("input", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const newChance = parseFloat(target.value);
    autoNotesChanceValueSpan.textContent = newChance.toFixed(2);
    debouncedSetAutoNotesChance(newChance);
  });
}

// Auto-notes delay slider
if (autoNotesDelaySlider && autoNotesDelayValueSpan) {
  const debouncedSetAutoNotesDelay = debounce((value: number) => {
    if (!isNaN(value)) {
      mockComfyJazz.autoNotesDelay = value;
      saveCurrentSettings();
    }
  }, 100);

  autoNotesDelaySlider.addEventListener("input", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const newDelay = parseInt(target.value, 10);
    autoNotesDelayValueSpan.textContent = String(newDelay);
    debouncedSetAutoNotesDelay(newDelay);
  });
}

// Transpose slider
if (transposeSlider && transposeValueSpan) {
  const debouncedSetTranspose = debounce((value: number) => {
    if (!isNaN(value)) {
      mockComfyJazz.transpose = value;
      saveCurrentSettings();
    }
  }, 100);

  transposeSlider.addEventListener("input", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const newTranspose = parseInt(target.value, 10);
    transposeValueSpan.textContent = String(newTranspose);
    debouncedSetTranspose(newTranspose);
  });
}

// Max notes input
if (maxNotesInput) {
  const debouncedSetMaxNotes = debounce((value: number) => {
    maxNotesPerEvent = value;
    saveCurrentSettings();
  }, 100);

  maxNotesInput.addEventListener("input", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    let newValue = parseInt(target.value, 10);

    if (isNaN(newValue)) {
      newValue = defaultSettings.maxNotesPerEvent;
    }
    newValue = Math.max(0, Math.min(20, newValue));

    if (String(newValue) !== target.value) {
      target.value = String(newValue);
    }

    debouncedSetMaxNotes(newValue);
  });
}

// Streamer.bot checkbox
if (enableStreamerBotCheckbox) {
  enableStreamerBotCheckbox.addEventListener("change", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    enableStreamerBot = target.checked;
    saveCurrentSettings();
  });
}

// Reset button
if (resetSettingsBtn) {
  resetSettingsBtn.addEventListener("click", () => {
    // Show confirmation dialog
    const confirmed = confirm(
      "Are you sure you want to reset all settings? This action cannot be undone."
    );

    if (confirmed) {
      const currentSettings = loadSettings();
      const settingsToKeep: SavedSettings = {
        enableStreamerBot:
          currentSettings.enableStreamerBot ??
          defaultSettings.enableStreamerBot,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToKeep));

      // Reset mock ComfyJazz settings
      mockComfyJazz.instrument = defaultSettings.instrument;
      mockComfyJazz.volume = defaultSettings.volume;
      mockComfyJazz.playAutoNotes = defaultSettings.playAutoNotes;
      mockComfyJazz.autoNotesChance = defaultSettings.autoNotesChance;
      mockComfyJazz.autoNotesDelay = defaultSettings.autoNotesDelay;
      mockComfyJazz.transpose = defaultSettings.transpose;

      maxNotesPerEvent = defaultSettings.maxNotesPerEvent;
      enableStreamerBot = settingsToKeep.enableStreamerBot ?? false;

      // Re-initialize controls
      initializeControls();
    }
  });
}

// Auto-notes toggle
if (autoNotesToggle && autoNotesContent) {
  autoNotesToggle.addEventListener("click", () => {
    const isExpanded = autoNotesToggle.getAttribute("aria-expanded") === "true";
    const newExpanded = !isExpanded;

    autoNotesToggle.setAttribute("aria-expanded", String(newExpanded));
    autoNotesContent.classList.toggle("hide", !newExpanded);

    // Add collapsed class to fieldset
    const fieldset = autoNotesToggle.closest("fieldset");
    fieldset?.classList.toggle("obs-collapsed", !newExpanded);
  });
}

// --- Cross-tab Synchronization ---
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY && e.newValue) {
    try {
      const newSettings = JSON.parse(e.newValue);
      if (typeof newSettings === "object" && newSettings !== null) {
        // Update local state
        currentSettings = newSettings;
        enableStreamerBot =
          newSettings.enableStreamerBot ?? defaultSettings.enableStreamerBot;
        maxNotesPerEvent =
          newSettings.maxNotesPerEvent ?? defaultSettings.maxNotesPerEvent;

        // Update mock ComfyJazz settings
        mockComfyJazz.instrument =
          newSettings.instrument ?? defaultSettings.instrument;
        mockComfyJazz.volume = newSettings.volume ?? defaultSettings.volume;
        mockComfyJazz.playAutoNotes =
          newSettings.playAutoNotes ?? defaultSettings.playAutoNotes;
        mockComfyJazz.autoNotesChance =
          newSettings.autoNotesChance ?? defaultSettings.autoNotesChance;
        mockComfyJazz.autoNotesDelay =
          newSettings.autoNotesDelay ?? defaultSettings.autoNotesDelay;
        mockComfyJazz.transpose =
          newSettings.transpose ?? defaultSettings.transpose;

        // Re-sync UI
        initializeControls();
      }
    } catch (e) {
      console.error("Error handling storage event:", e);
    }
  }
});

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  initializeControls();
});
