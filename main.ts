import ComfyJazz from "./web/comfyjazz";
import { ComfyJazzInstance, ComfyJazzOptions } from "./web/comfyjazz";
import ComfyJS from "comfy.js";
import { StreamerbotClient } from "@streamerbot/client";

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

function saveSettings(cjSettings: ComfyJazzOptions, sbEnabled: boolean) {
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
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
  } catch (e) {
    console.error("Error saving settings:", e);
  }
}

// --- Initialization Logic ---

const params: URLSearchParams = new URLSearchParams(location.search);

// Load initial settings from localStorage and merge with defaults
const savedSettings: SavedSettings = loadSettings();

// Define defaults for *all* settings, including the new one
const defaultSettings: Required<SavedSettings> = {
  instrument: "piano",
  volume: 1,
  playAutoNotes: true,
  autoNotesChance: 0.2,
  autoNotesDelay: 300,
  transpose: -5,
  enableStreamerBot: false,
  baseUrl: "web/sounds",
  backgroundLoopUrl: "jazz_loop.ogg",
  backgroundLoopDuration: 27.428,
};

// Combine defaults with loaded settings
const initialSettings = {
  ...defaultSettings,
  ...savedSettings,
};

// State variable for streamer.bot toggle
let enableStreamerBot = initialSettings.enableStreamerBot;

// Separate comfyJazz options from the combined settings
const comfyJazzOptions: ComfyJazzOptions = {
  instrument: initialSettings.instrument,
  volume: initialSettings.volume,
  playAutoNotes: initialSettings.playAutoNotes,
  autoNotesChance: initialSettings.autoNotesChance,
  autoNotesDelay: initialSettings.autoNotesDelay,
  transpose: initialSettings.transpose,
  baseUrl: initialSettings.baseUrl,
  backgroundLoopUrl: initialSettings.backgroundLoopUrl,
  backgroundLoopDuration: initialSettings.backgroundLoopDuration,
};

// Apply initial volume from combined settings AFTER potentially reading from URL param
let initialVolume: number = comfyJazzOptions.volume ?? defaultSettings.volume;
// Override with URL params if present (URL params take highest priority for relevant settings)
const instrumentParam: string | null = params.get("instrument");
const volumeParam: string | null = params.get("volume");
if (volumeParam !== null) {
  const parsedVolume = parseFloat(volumeParam);
  if (!isNaN(parsedVolume)) {
    initialVolume = Math.max(0, Math.min(1, parsedVolume));
  }
}
// Assign URL params to the options passed to ComfyJazz
comfyJazzOptions.instrument = instrumentParam ?? comfyJazzOptions.instrument;
comfyJazzOptions.volume = initialVolume;

// Start ComfyJazz
const comfyJazz: ComfyJazzInstance = ComfyJazz(comfyJazzOptions);
comfyJazz.start();

// --- Streamer.bot Client Initialization & Management ---
let sbClient: StreamerbotClient | null = null;
let isStreamerBotConnected = false;

// Handler function for YouTube messages via Streamer.bot
function handleYouTubeMessage(/* data: any */) { // data parameter available if needed later
    comfyJazz.playNoteProgression(1);
}

function connectStreamerBot() {
  if (!enableStreamerBot) {
      return; // Don't connect if the setting is off
  }

  if (sbClient && isStreamerBotConnected) {
    return; // Already connected
  }

  if (sbClient) {
      // Instance exists but not connected
      console.log("Streamer.bot client exists, attempting connection...");
      sbClient.connect();
      return;
  }

  // Instance doesn't exist, create it
  console.log("Initializing and connecting Streamer.bot client...");
  try {
      sbClient = new StreamerbotClient({
          immediate: false, // We control connection timing
          onConnect: (data) => {
              if (!enableStreamerBot) {
                  disconnectStreamerBot();
                  return;
              }
              isStreamerBotConnected = true;
              console.log("Streamer.bot client connected successfully.", data);
              console.log("Subscribing to YouTube.Message via Streamer.bot...");
              sbClient?.on('YouTube.Message', handleYouTubeMessage);
          },
          onError: (error) => {
              if (isStreamerBotConnected) {
                  console.error("Streamer.bot client connection error:", error);
              }
              isStreamerBotConnected = false;
              if (!enableStreamerBot) {
                  disconnectStreamerBot(); // Ensure cleanup if disabled during error
              }
          },
          onDisconnect: () => {
              if (isStreamerBotConnected) {
                  console.log("Streamer.bot client connection closed.");
              }
              isStreamerBotConnected = false;
              sbClient = null; // Nullify on disconnect to allow re-creation
          }
      });

      // *** TODO: Add desired event listeners here using sbClient.on(...) ***

      // Attempt the explicit connection for the newly created instance
      sbClient.connect();

  } catch (error) {
    console.error("Failed to initialize Streamer.bot client instance:", error);
    sbClient = null;
    isStreamerBotConnected = false;
    const sbCheckbox = document.querySelector<HTMLInputElement>("#enableStreamerBotCheckbox");
    if (sbCheckbox && enableStreamerBot) {
        enableStreamerBot = false;
        sbCheckbox.checked = false;
        saveCurrentSettings();
    }
  }
}

function disconnectStreamerBot() {
    if (sbClient) {
        sbClient.disconnect();
        sbClient = null; // Ensure instance is removed
    } else {
        // console.log("Streamer.bot client instance does not exist or already disconnected.");
    }
    isStreamerBotConnected = false; // Ensure state reflects disconnected
}

// Initial connection attempt on page load IF setting is enabled
if (enableStreamerBot) {
  connectStreamerBot();
}

// --- Control Panel UI Logic ---

// Get references to all control elements
const controlsPanel = document.querySelector<HTMLDivElement>("#comfy-controls");
const closeControlsBtn = document.querySelector<HTMLButtonElement>(
  "#close-controls-btn"
);
const enableStreamerBotCheckbox = document.querySelector<HTMLInputElement>(
    "#enableStreamerBotCheckbox"
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

// Helper to save current state
function saveCurrentSettings() {
    saveSettings(comfyJazz, enableStreamerBot);
}

// --- Event Listeners for Controls ---

// Close Button
if (closeControlsBtn && controlsPanel) {
  closeControlsBtn.addEventListener("click", () => {
    controlsPanel.classList.add("hide");
  });
}

// Streamer.bot Enable Checkbox Listener
if (enableStreamerBotCheckbox) {
    enableStreamerBotCheckbox.addEventListener('change', (e) => {
        const target = e.currentTarget as HTMLInputElement;
        enableStreamerBot = target.checked;
        saveCurrentSettings(); // Save the new state

        if (enableStreamerBot) {
            // Explicitly try to connect when toggled on
            connectStreamerBot();
        } else {
            // Explicitly disconnect when toggled off
            disconnectStreamerBot();
        }
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
        )?.value || defaultSettings.instrument;
      instrumentCheckboxes.forEach((cb) => {
        cb.checked = cb.value === currentSingle;
      });
    } else {
      // Switching TO single-select
      // Select the radio corresponding to the FIRST checked box (or default)
      const firstChecked =
        Array.from(instrumentCheckboxes).find((cb) => cb.checked)?.value ||
        defaultSettings.instrument;
      const radioToSelect = document.getElementById(
        `instr-radio-${firstChecked}`
      ) as HTMLInputElement | null;
      if (radioToSelect) {
        radioToSelect.checked = true;
      } else {
        // Fallback if first checked wasn't found (shouldn't happen often)
        const defaultRadio = document.getElementById(
          `instr-radio-${defaultSettings.instrument}`
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

// Play Auto Notes Checkbox
if (playAutoNotesCheckbox) {
  playAutoNotesCheckbox.addEventListener("change", (e) => {
    const target = e.currentTarget as HTMLInputElement;
    comfyJazz.setPlayAutoNotes(target.checked);
    saveCurrentSettings();
  });
}

// Auto Notes Chance Slider (Using 'input')
if (autoNotesChanceSlider && autoNotesChanceValueSpan) {
  const debouncedSetAutoNotesChance = debounce((value: number) => {
    if (!isNaN(value)) {
      comfyJazz.setAutoNotesChance(value);
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

// Auto Notes Delay Slider (Using 'input')
if (autoNotesDelaySlider && autoNotesDelayValueSpan) {
  const debouncedSetAutoNotesDelay = debounce((value: number) => {
    if (!isNaN(value)) {
      comfyJazz.setAutoNotesDelay(value);
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

// Transpose Slider (Using 'input')
if (transposeSlider && transposeValueSpan) {
  const debouncedSetTranspose = debounce((value: number) => {
    if (!isNaN(value)) {
      comfyJazz.setTranspose(value);
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

// Reset Settings Button
if (resetSettingsBtn) {
  resetSettingsBtn.addEventListener("click", () => {
    // Only clear comfyJazz related settings from localStorage
    // We need to load existing settings, clear the comfy ones, then save back.
    const currentSettings = loadSettings();
    const settingsToKeep: SavedSettings = {
        enableStreamerBot: currentSettings.enableStreamerBot ?? defaultSettings.enableStreamerBot,
        // Potentially keep other non-comfyJazz settings here if any existed
    };
    // Overwrite localStorage with only the settings we want to keep
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToKeep));

    // Reset ONLY comfyJazz internal state to defaults using defaultSettings
    comfyJazz.setInstrument(defaultSettings.instrument);
    comfyJazz.setVolume(defaultSettings.volume);
    comfyJazz.setPlayAutoNotes(defaultSettings.playAutoNotes);
    comfyJazz.setAutoNotesChance(defaultSettings.autoNotesChance);
    comfyJazz.setAutoNotesDelay(defaultSettings.autoNotesDelay);
    comfyJazz.setTranspose(defaultSettings.transpose);

    // Update the UI based on the reset state
    // Note: This will NOT reset the Streamer.bot checkbox UI, as intended
    initializeControls();

    // Do NOT reset the enableStreamerBot state variable
    // Do NOT disconnect streamerbot
  });
}

// --- Existing Logic (Twitch, Keydown) ---

//Integrate with Twitch Chat
const channel: string | null = params.get("channel");

if (channel) {
  console.log(`Connecting ComfyJS to Twitch channel: ${channel}`);
  ComfyJS.Init(channel);
} else {
  console.log("No Twitch channel specified, ComfyJS not initialized.");
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
      const newSettings: SavedSettings = event.newValue ? JSON.parse(event.newValue) : {};

      // Merge with defaults to handle potentially missing keys
      const mergedSettings = { ...defaultSettings, ...newSettings };

      // Update the streamerbot state variable
      const sbSettingChanged = enableStreamerBot !== mergedSettings.enableStreamerBot;
      enableStreamerBot = mergedSettings.enableStreamerBot;

      if (comfyJazz) {
        // Update internal comfyJazz state
        comfyJazz.setVolume(mergedSettings.volume ?? defaultSettings.volume);
        comfyJazz.setInstrument(mergedSettings.instrument ?? defaultSettings.instrument);
        comfyJazz.setPlayAutoNotes(mergedSettings.playAutoNotes ?? defaultSettings.playAutoNotes);
        comfyJazz.setAutoNotesChance(mergedSettings.autoNotesChance ?? defaultSettings.autoNotesChance);
        comfyJazz.setAutoNotesDelay(mergedSettings.autoNotesDelay ?? defaultSettings.autoNotesDelay);
        comfyJazz.setTranspose(mergedSettings.transpose ?? defaultSettings.transpose);

        // Re-sync UI based on the new state
        initializeControls();

        // Connect/disconnect streamerbot if its state changed
        if (sbSettingChanged) {
            if (enableStreamerBot) {
                connectStreamerBot();
            } else {
                disconnectStreamerBot();
            }
        }
      }
    } catch (e) {
      console.error("Error handling storage event:", e);
    }
  }
});

// Function to update instrument state based on current mode and selections
function updateInstrumentState() {
  if (!toggleMultiInstrument || !comfyJazz) return;

  let instrumentString = defaultSettings.instrument; // Use default from central object

  if (toggleMultiInstrument.checked) {
    // Multi-select mode
    const checkedInstruments = Array.from(instrumentCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);
    instrumentString = checkedInstruments.join(",");
    // Ensure at least one is checked in multi-mode
    if (instrumentString.length === 0) {
      instrumentString = defaultSettings.instrument; // Fallback to default
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
  saveCurrentSettings();
}

// Function to initialize control values from current state
function initializeControls() {
  if (
    !comfyJazz ||
    !toggleMultiInstrument ||
    !instrumentRadioContainer ||
    !instrumentCheckboxContainer ||
    !enableStreamerBotCheckbox
  )
    return;

  // --- Initialize Streamer.bot checkbox ---
  enableStreamerBotCheckbox.checked = enableStreamerBot;

  // --- Initialize other controls ---
  if (volumeSlider) {
    volumeSlider.value = String(comfyJazz.volume);
    if (volumeValueSpan)
      volumeValueSpan.textContent = parseFloat(volumeSlider.value).toFixed(2);
  }
  if (playAutoNotesCheckbox)
    playAutoNotesCheckbox.checked = comfyJazz.playAutoNotes;
  if (autoNotesChanceSlider) {
    autoNotesChanceSlider.value = String(comfyJazz.autoNotesChance);
    if (autoNotesChanceValueSpan)
      autoNotesChanceValueSpan.textContent = parseFloat(
        autoNotesChanceSlider.value
      ).toFixed(2);
  }
  if (autoNotesDelaySlider) {
    autoNotesDelaySlider.value = String(comfyJazz.autoNotesDelay);
    if (autoNotesDelayValueSpan)
      autoNotesDelayValueSpan.textContent = autoNotesDelaySlider.value;
  }
  if (transposeSlider) {
    transposeSlider.value = String(comfyJazz.transpose);
    if (transposeValueSpan)
      transposeValueSpan.textContent = transposeSlider.value;
  }

  // --- Initialize Instrument Controls ---
  // Determine initial mode based on whether instrument string contains commas
  const currentInstrument = comfyJazz.instrument ?? defaultSettings.instrument;
  const isMultiMode = currentInstrument.includes(",");
  toggleMultiInstrument.checked = isMultiMode;

  if (isMultiMode) {
    instrumentRadioContainer.classList.add("hide");
    instrumentCheckboxContainer.classList.remove("hide");
    // Initialize Checkboxes
    const activeInstruments = currentInstrument
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);
    instrumentCheckboxes.forEach((checkbox) => {
      checkbox.checked = activeInstruments.includes(checkbox.value);
    });
    if (activeInstruments.length === 0) {
      const defaultCheckbox = document.getElementById(
        `instr-check-${defaultSettings.instrument}`
      ) as HTMLInputElement | null;
      if (defaultCheckbox) defaultCheckbox.checked = true;
      // Correct internal state only if it was invalid
      if (comfyJazz.instrument !== defaultSettings.instrument) {
          comfyJazz.setInstrument(defaultSettings.instrument);
          saveCurrentSettings(); // Persist correction
      }
    }
  } else {
    instrumentRadioContainer.classList.remove("hide");
    instrumentCheckboxContainer.classList.add("hide");
    // Initialize Radio Buttons
    const activeInstrument =
      currentInstrument.trim() || defaultSettings.instrument;
    const radioToCheck = document.getElementById(
      `instr-radio-${activeInstrument}`
    ) as HTMLInputElement | null;
    if (radioToCheck) {
      radioToCheck.checked = true;
    } else {
      const defaultRadio = document.getElementById(
        `instr-radio-${defaultSettings.instrument}`
      ) as HTMLInputElement | null;
      if (defaultRadio) defaultRadio.checked = true;
      // Correct internal state only if it was invalid
      if (comfyJazz.instrument !== defaultSettings.instrument) {
          comfyJazz.setInstrument(defaultSettings.instrument);
          saveCurrentSettings(); // Persist correction
      }
    }
  }
}

// Initialize controls once the DOM is ready (or immediately if already loaded)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeControls);
} else {
  initializeControls();
}

// --- ComfyJS Event Handlers ---
ComfyJS.onChat = (_user, _message, _flags, _self, extra) => {
  if (comfyJazz && extra.customRewardId) {
    // Play a note progression for channel point rewards
    // console.log("Reward redeemed:", extra.customRewardId);
    comfyJazz.playNoteProgression(1);
  } else if (comfyJazz) {
    // Play a note progression for regular chat messages
    comfyJazz.playNoteProgression(1);
  }
};

ComfyJS.onError = (err) => {
  console.error("ComfyJS Error:", err);
};
