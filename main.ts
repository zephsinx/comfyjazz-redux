import ComfyJazz from "./web/comfyjazz";
import { ComfyJazzInstance, ComfyJazzOptions } from "./web/comfyjazz";
import ComfyJS from "comfy.js";

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
const STORAGE_KEY = "comfyJazzSettings";

function loadSettings(): Partial<ComfyJazzOptions> {
  const savedSettingsJSON = localStorage.getItem(STORAGE_KEY);
  if (savedSettingsJSON) {
    try {
      return JSON.parse(savedSettingsJSON);
    } catch (e) {
      console.error("Error parsing saved settings:", e);
      localStorage.removeItem(STORAGE_KEY); // Clear corrupted data
    }
  }
  return {}; // Return empty object if nothing saved or error
}

function saveSettings(settings: ComfyJazzOptions) {
  if (!settings) return;
  try {
    const settingsToSave: Partial<ComfyJazzOptions> = {
      instrument: settings.instrument,
      volume: settings.volume,
      playAutoNotes: settings.playAutoNotes,
      autoNotesChance: settings.autoNotesChance,
      autoNotesDelay: settings.autoNotesDelay,
      transpose: settings.transpose,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
  } catch (e) {
    console.error("Error saving settings:", e);
  }
}

// --- Initialization Logic ---

const params: URLSearchParams = new URLSearchParams(location.search);

// Load initial settings from localStorage and merge with defaults
const savedSettings = loadSettings();
const defaultComfyJazzSettings = {
  instrument: "piano", // Default is single piano
  volume: 1,
  playAutoNotes: true,
  autoNotesChance: 0.2,
  autoNotesDelay: 300,
  transpose: -5,
};
const initialComfyJazzSettings = {
  ...defaultComfyJazzSettings,
  ...savedSettings,
};

// Apply initial volume from combined settings
let initialVolume: number = initialComfyJazzSettings.volume;

// Override with URL params if present (URL params take highest priority)
const instrumentParam: string | null = params.get("instrument");
const volumeParam: string | null = params.get("volume");
if (volumeParam !== null) {
  const parsedVolume = parseFloat(volumeParam);
  if (!isNaN(parsedVolume)) {
    initialVolume = Math.max(0, Math.min(1, parsedVolume));
  }
}

// Type the options object for ComfyJazz initialization
const comfyJazzOptions: ComfyJazzOptions = {
  // Start with combined settings (defaults + localStorage)
  ...initialComfyJazzSettings,
  // Then override with URL params
  instrument: instrumentParam ?? initialComfyJazzSettings.instrument,
  volume: initialVolume,
};

//Start ComfyJazz - instance type is now inferred
const comfyJazz: ComfyJazzInstance = ComfyJazz(comfyJazzOptions);
comfyJazz.start();

// --- Control Panel UI Logic ---

// Get references to all control elements
const controlsPanel = document.querySelector<HTMLDivElement>("#comfy-controls");
const closeControlsBtn = document.querySelector<HTMLButtonElement>(
  "#close-controls-btn"
);

// Instrument controls
const toggleMultiInstrument = document.querySelector<HTMLInputElement>(
  "#toggleMultiInstrument"
);
const instrumentRadioContainer = document.querySelector<HTMLDivElement>(
  "#instrumentRadioContainer"
);
const instrumentCheckboxContainer = document.querySelector<HTMLDivElement>(
  "#instrumentCheckboxContainer"
);
const instrumentCheckboxes = document.querySelectorAll<HTMLInputElement>(
  'input[name="instrumentMulti"]'
);

// Other controls
const volumeSlider = document.querySelector<HTMLInputElement>("#volumeSlider");
const playAutoNotesCheckbox = document.querySelector<HTMLInputElement>(
  "#playAutoNotesCheckbox"
);
const autoNotesChanceSlider = document.querySelector<HTMLInputElement>(
  "#autoNotesChanceSlider"
);
const autoNotesDelaySlider = document.querySelector<HTMLInputElement>(
  "#autoNotesDelaySlider"
);
const transposeSlider =
  document.querySelector<HTMLInputElement>("#transposeSlider");
const resetSettingsBtn =
  document.querySelector<HTMLButtonElement>("#resetSettingsBtn");

// Get references to value display spans
const volumeValueSpan =
  document.querySelector<HTMLSpanElement>("#volumeValueSpan");
const autoNotesChanceValueSpan = document.querySelector<HTMLSpanElement>(
  "#autoNotesChanceValueSpan"
);
const autoNotesDelayValueSpan = document.querySelector<HTMLSpanElement>(
  "#autoNotesDelayValueSpan"
);
const transposeValueSpan = document.querySelector<HTMLSpanElement>(
  "#transposeValueSpan"
);

// --- Event Listeners for Controls ---

// Close Button
if (closeControlsBtn && controlsPanel) {
  closeControlsBtn.addEventListener("click", () => {
    controlsPanel.classList.add("hide");
  });
}

// Listener for the MULTI-INSTRUMENT TOGGLE checkbox
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
      // Switching TO multi-select
      // Check the box corresponding to the currently selected radio
      const currentSingle =
        document.querySelector<HTMLInputElement>(
          'input[name="instrumentSingle"]:checked'
        )?.value || defaultComfyJazzSettings.instrument;
      instrumentCheckboxes.forEach((cb) => {
        cb.checked = cb.value === currentSingle;
      });
    } else {
      // Switching TO single-select
      // Select the radio corresponding to the FIRST checked box (or default)
      const firstChecked =
        Array.from(instrumentCheckboxes).find((cb) => cb.checked)?.value ||
        defaultComfyJazzSettings.instrument;
      const radioToSelect = document.getElementById(
        `instr-radio-${firstChecked}`
      ) as HTMLInputElement | null;
      if (radioToSelect) {
        radioToSelect.checked = true;
      } else {
        // Fallback if first checked wasn't found (shouldn't happen often)
        const defaultRadio = document.getElementById(
          `instr-radio-${defaultComfyJazzSettings.instrument}`
        ) as HTMLInputElement | null;
        if (defaultRadio) defaultRadio.checked = true;
      }
    }
    // Update the instrument state after switching modes
    updateInstrumentState();
  });
}

// Listener for RADIO buttons (Single Select Mode)
if (instrumentRadioContainer) {
  instrumentRadioContainer.addEventListener("change", (e) => {
    if (
      !toggleMultiInstrument?.checked &&
      (e.target as HTMLInputElement).name === "instrumentSingle"
    ) {
      updateInstrumentState();
    }
  });
}

// Listener for CHECKBOXES (Multi Select Mode)
if (instrumentCheckboxContainer) {
  instrumentCheckboxContainer.addEventListener("change", (e) => {
    if (
      toggleMultiInstrument?.checked &&
      (e.target as HTMLInputElement).name === "instrumentMulti"
    ) {
      updateInstrumentState();
    }
  });
}

// Volume Slider (Using 'input' for real-time feedback)
if (volumeSlider && volumeValueSpan) {
  const debouncedSetVolume = debounce((value: number) => {
    if (!isNaN(value)) {
      comfyJazz.setVolume(value);
      saveSettings(comfyJazz); // Save after update
    }
  }, 100); // Debounce by 100ms

  volumeSlider.addEventListener("input", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const newVolume = parseFloat(target.value);
    volumeValueSpan.textContent = newVolume.toFixed(2); // Update display immediately
    debouncedSetVolume(newVolume); // Call debounced function
  });
}

// Play Auto Notes Checkbox
if (playAutoNotesCheckbox) {
  playAutoNotesCheckbox.addEventListener("change", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    comfyJazz.setPlayAutoNotes(target.checked);
    saveSettings(comfyJazz); // Save after update
  });
}

// Auto Notes Chance Slider (Using 'input')
if (autoNotesChanceSlider && autoNotesChanceValueSpan) {
  const debouncedSetAutoNotesChance = debounce((value: number) => {
    if (!isNaN(value)) {
      comfyJazz.setAutoNotesChance(value);
      saveSettings(comfyJazz); // Save after update
    }
  }, 100); // Debounce by 100ms

  autoNotesChanceSlider.addEventListener("input", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const newChance = parseFloat(target.value);
    autoNotesChanceValueSpan.textContent = newChance.toFixed(2); // Update display immediately
    debouncedSetAutoNotesChance(newChance); // Call debounced function
  });
}

// Auto Notes Delay Slider (Using 'input')
if (autoNotesDelaySlider && autoNotesDelayValueSpan) {
  const debouncedSetAutoNotesDelay = debounce((value: number) => {
    if (!isNaN(value)) {
      comfyJazz.setAutoNotesDelay(value);
      saveSettings(comfyJazz); // Save after update
    }
  }, 100); // Debounce by 100ms

  autoNotesDelaySlider.addEventListener("input", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const newDelay = parseInt(target.value, 10);
    autoNotesDelayValueSpan.textContent = String(newDelay); // Update display immediately
    debouncedSetAutoNotesDelay(newDelay); // Call debounced function
  });
}

// Transpose Slider (Using 'input')
if (transposeSlider && transposeValueSpan) {
  const debouncedSetTranspose = debounce((value: number) => {
    if (!isNaN(value)) {
      comfyJazz.setTranspose(value);
      saveSettings(comfyJazz); // Save after update
    }
  }, 100); // Debounce by 100ms

  transposeSlider.addEventListener("input", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const newTranspose = parseInt(target.value, 10);
    transposeValueSpan.textContent = String(newTranspose); // Update display immediately
    debouncedSetTranspose(newTranspose); // Call debounced function
  });
}

// Reset Settings Button
if (resetSettingsBtn) {
  resetSettingsBtn.addEventListener("click", () => {
    // Clear saved settings from localStorage first
    localStorage.removeItem(STORAGE_KEY);

    // Reset ALL comfyJazz internal state to defaults
    // (this will use the hardcoded defaults since localStorage is clear)
    comfyJazz.setInstrument(defaultComfyJazzSettings.instrument);
    comfyJazz.setVolume(defaultComfyJazzSettings.volume);
    comfyJazz.setPlayAutoNotes(defaultComfyJazzSettings.playAutoNotes);
    comfyJazz.setAutoNotesChance(defaultComfyJazzSettings.autoNotesChance);
    comfyJazz.setAutoNotesDelay(defaultComfyJazzSettings.autoNotesDelay);
    comfyJazz.setTranspose(defaultComfyJazzSettings.transpose);

    // Update the entire UI based on the reset state
    initializeControls();
  });
}

// --- Existing Logic (Twitch, Keydown) ---

//Integrate with Twitch Chat
const channel: string | null = params.get("channel");

if (channel) {
  ComfyJS.onChat = (
    _user: string,
    _message: string,
    _flags: any,
    _self: boolean,
    _extra: any
  ): void => {
    comfyJazz.playNoteProgression((Math.random() * 8) >> 0);
  };
  ComfyJS.Init(channel);
}

//Keydown triggers notes AND toggles panel
window.addEventListener("keydown", (e: KeyboardEvent): void => {
  // Toggle panel with 'C' - Use e.key instead of e.code
  if (e.key.toLowerCase() === "c") {
    // Check the character key 'c'
    if (controlsPanel) {
      controlsPanel.classList.toggle("hide");
      // Re-initialize controls every time panel is shown to reflect latest state
      if (!controlsPanel.classList.contains("hide")) {
        initializeControls();
      }
    }
    // Prevent falling through to the note playing logic
    e.preventDefault(); // Optional: Might help ensure only panel toggle happens
  }
  // Play note progression with other keys (if panel is hidden or focus isn't on an input)
  else if (
    controlsPanel?.classList.contains("hide") ||
    !(
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLSelectElement
    )
  ) {
    comfyJazz.playNoteProgression((Math.random() * 8) >> 0);
  }
});

// --- Banner Logic ---
const welcomeBanner = document.getElementById("welcome-banner");
const closeBannerBtn = document.getElementById("close-banner-btn");

// Use ReturnType to get the correct type for setTimeout in the environment
let fadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

function dismissBanner() {
  if (welcomeBanner) {
    welcomeBanner.classList.add("hide"); // Hide immediately
  }
  // Clear scheduled timeouts if dismissed manually
  if (fadeTimeoutId !== null) clearTimeout(fadeTimeoutId);
  if (hideTimeoutId !== null) clearTimeout(hideTimeoutId);
}

if (welcomeBanner && closeBannerBtn) {
  // Automatic dismissal
  fadeTimeoutId = setTimeout(() => {
    welcomeBanner.classList.add("fade-out");
    hideTimeoutId = setTimeout(() => {
      // Use dismissBanner to ensure cleanup
      dismissBanner();
    }, 800); // Match faster CSS transition
  }, 4000); // Keep initial delay or adjust as needed

  // Manual dismissal via button
  closeBannerBtn.addEventListener("click", dismissBanner);
}

// --- Storage Event Listener for Cross-Tab Sync ---
window.addEventListener("storage", (event) => {
  // Check if the changed key is our settings key and it happened in localStorage
  if (event.storageArea === localStorage && event.key === STORAGE_KEY) {
    console.log("Settings changed in another tab!");
    try {
      // Ensure newValue is not null before parsing
      const newSettings = event.newValue ? JSON.parse(event.newValue) : {};

      // Apply these new settings to the current tab's ComfyJazz instance
      // Merge with defaults to handle potentially missing keys in saved data
      const mergedSettings = { ...defaultComfyJazzSettings, ...newSettings };

      if (comfyJazz) {
        // Update internal state
        comfyJazz.setVolume(mergedSettings.volume);
        comfyJazz.setInstrument(mergedSettings.instrument);
        comfyJazz.setPlayAutoNotes(mergedSettings.playAutoNotes);
        comfyJazz.setAutoNotesChance(mergedSettings.autoNotesChance);
        comfyJazz.setAutoNotesDelay(mergedSettings.autoNotesDelay);
        comfyJazz.setTranspose(mergedSettings.transpose);

        // Re-sync UI based on the new state
        initializeControls();
      }
    } catch (e) {
      console.error("Error handling storage event:", e);
      // Optionally clear corrupted data from the triggering event
      // localStorage.removeItem(STORAGE_KEY);
    }
  }
});

// Function to update instrument state based on current mode and selections
function updateInstrumentState() {
  if (!toggleMultiInstrument || !comfyJazz) return;

  let instrumentString = "piano"; // Default

  if (toggleMultiInstrument.checked) {
    // Multi-select mode
    const checkedInstruments = Array.from(instrumentCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);
    instrumentString = checkedInstruments.join(",");
    // Ensure at least one is checked in multi-mode
    if (instrumentString.length === 0) {
      instrumentString = defaultComfyJazzSettings.instrument; // Fallback to default
      const defaultCheckbox = document.getElementById(
        `instr-check-${instrumentString}`
      ) as HTMLInputElement | null;
      if (defaultCheckbox) defaultCheckbox.checked = true;
    }
  } else {
    // Single-select mode
    const selectedRadio = document.querySelector<HTMLInputElement>(
      'input[name="instrumentSingle"]:checked'
    );
    if (selectedRadio) {
      instrumentString = selectedRadio.value;
    }
  }
  comfyJazz.setInstrument(instrumentString);
  saveSettings(comfyJazz); // Save after update
}

// Function to initialize control values from comfyJazz state
function initializeControls() {
  if (
    !comfyJazz ||
    !toggleMultiInstrument ||
    !instrumentRadioContainer ||
    !instrumentCheckboxContainer
  )
    return;

  // --- Initialize other controls ---
  if (volumeSlider) {
    volumeSlider.value = String(comfyJazz.volume);
    if (volumeValueSpan)
      volumeValueSpan.textContent = parseFloat(volumeSlider.value).toFixed(2); // Format volume
  }
  if (playAutoNotesCheckbox)
    playAutoNotesCheckbox.checked = comfyJazz.playAutoNotes;
  if (autoNotesChanceSlider) {
    autoNotesChanceSlider.value = String(comfyJazz.autoNotesChance);
    if (autoNotesChanceValueSpan)
      autoNotesChanceValueSpan.textContent = parseFloat(
        autoNotesChanceSlider.value
      ).toFixed(2); // Format chance
  }
  if (autoNotesDelaySlider) {
    autoNotesDelaySlider.value = String(comfyJazz.autoNotesDelay);
    if (autoNotesDelayValueSpan)
      autoNotesDelayValueSpan.textContent = autoNotesDelaySlider.value;
  }
  // Initialize Transpose slider and span
  if (transposeSlider) {
    transposeSlider.value = String(comfyJazz.transpose);
    if (transposeValueSpan)
      transposeValueSpan.textContent = transposeSlider.value;
  }

  // --- Initialize Instrument Controls ---
  // Determine initial mode based on whether instrument string contains commas
  const isMultiMode = comfyJazz.instrument.includes(",");
  toggleMultiInstrument.checked = isMultiMode;

  if (isMultiMode) {
    instrumentRadioContainer.classList.add("hide");
    instrumentCheckboxContainer.classList.remove("hide");
    // Initialize Checkboxes
    const activeInstruments = comfyJazz.instrument
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);
    instrumentCheckboxes.forEach((checkbox) => {
      checkbox.checked = activeInstruments.includes(checkbox.value);
    });
    // Ensure at least one is checked if loaded state was invalid multi-select
    if (activeInstruments.length === 0) {
      const defaultCheckbox = document.getElementById(
        `instr-check-${defaultComfyJazzSettings.instrument}`
      ) as HTMLInputElement | null;
      if (defaultCheckbox) defaultCheckbox.checked = true;
      comfyJazz.setInstrument(defaultComfyJazzSettings.instrument); // Correct internal state too
    }
  } else {
    instrumentRadioContainer.classList.remove("hide");
    instrumentCheckboxContainer.classList.add("hide");
    // Initialize Radio Buttons
    const activeInstrument =
      comfyJazz.instrument.trim() || defaultComfyJazzSettings.instrument;
    const radioToCheck = document.getElementById(
      `instr-radio-${activeInstrument}`
    ) as HTMLInputElement | null;
    if (radioToCheck) {
      radioToCheck.checked = true;
    } else {
      // Fallback if saved instrument isn't a valid radio option
      const defaultRadio = document.getElementById(
        `instr-radio-${defaultComfyJazzSettings.instrument}`
      ) as HTMLInputElement | null;
      if (defaultRadio) defaultRadio.checked = true;
      comfyJazz.setInstrument(defaultComfyJazzSettings.instrument); // Correct internal state too
    }
  }
}

// Initialize controls once the DOM is ready (or immediately if already loaded)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeControls);
} else {
  initializeControls();
}
