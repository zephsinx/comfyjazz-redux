import ComfyJazz from "./web/comfyjazz";
import { ComfyJazzInstance, ComfyJazzOptions } from "./web/comfyjazz";
import ComfyJS from "comfy.js";

const params: URLSearchParams = new URLSearchParams(location.search);

const instrumentParam: string | null = params.get("instrument");
const volumeParam: string | null = params.get("volume");

// Parse volume parameter, defaulting to 1 if invalid or missing
let initialVolume: number = 1;
if (volumeParam !== null) {
  const parsedVolume = parseFloat(volumeParam);
  if (!isNaN(parsedVolume)) {
    initialVolume = Math.max(0, Math.min(1, parsedVolume)); // Clamp between 0 and 1
  }
}

// Type the options object
const comfyJazzOptions: ComfyJazzOptions = {
  instrument: instrumentParam ?? "piano", // Use param for initial value
  volume: initialVolume,
};

//Start ComfyJazz - instance type is now inferred
const comfyJazz: ComfyJazzInstance = ComfyJazz(comfyJazzOptions);
comfyJazz.start();

// --- Control Panel UI Logic ---

// Get references to all control elements
const controlsPanel = document.querySelector<HTMLDivElement>('#comfy-controls');
const closeControlsBtn = document.querySelector<HTMLButtonElement>('#close-controls-btn');

// Instrument controls
const toggleMultiInstrument = document.querySelector<HTMLInputElement>('#toggleMultiInstrument');
const instrumentRadioContainer = document.querySelector<HTMLDivElement>('#instrumentRadioContainer');
const instrumentCheckboxContainer = document.querySelector<HTMLDivElement>('#instrumentCheckboxContainer');
const instrumentCheckboxes = document.querySelectorAll<HTMLInputElement>('input[name="instrumentMulti"]');

// Other controls
const volumeSlider = document.querySelector<HTMLInputElement>('#volumeSlider');
const playAutoNotesCheckbox = document.querySelector<HTMLInputElement>('#playAutoNotesCheckbox');
const autoNotesChanceSlider = document.querySelector<HTMLInputElement>('#autoNotesChanceSlider');
const autoNotesDelaySlider = document.querySelector<HTMLInputElement>('#autoNotesDelaySlider');
const transposeSlider = document.querySelector<HTMLInputElement>('#transposeSlider');
const resetSettingsBtn = document.querySelector<HTMLButtonElement>('#resetSettingsBtn');

// Get references to value display spans
const volumeValueSpan = document.querySelector<HTMLSpanElement>('#volumeValueSpan');
const autoNotesChanceValueSpan = document.querySelector<HTMLSpanElement>('#autoNotesChanceValueSpan');
const autoNotesDelayValueSpan = document.querySelector<HTMLSpanElement>('#autoNotesDelayValueSpan');
const transposeValueSpan = document.querySelector<HTMLSpanElement>('#transposeValueSpan');

// --- Default Settings Object ---
const defaultComfyJazzSettings = {
  instrument: "piano", // Default is single piano
  volume: 1,
  playAutoNotes: true,
  autoNotesChance: 0.2,
  autoNotesDelay: 300,
  transpose: -5
};

// Function to update instrument state based on current mode and selections
function updateInstrumentState() {
  if (!toggleMultiInstrument || !comfyJazz) return;

  let instrumentString = "piano"; // Default

  if (toggleMultiInstrument.checked) {
    // Multi-select mode
    const checkedInstruments = Array.from(instrumentCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    instrumentString = checkedInstruments.join(",");
    // Ensure at least one is checked in multi-mode
    if (instrumentString.length === 0) {
        instrumentString = defaultComfyJazzSettings.instrument; // Fallback to default
        const defaultCheckbox = document.getElementById(`instr-check-${instrumentString}`) as HTMLInputElement | null;
        if (defaultCheckbox) defaultCheckbox.checked = true;
    }
  } else {
    // Single-select mode
    const selectedRadio = document.querySelector<HTMLInputElement>('input[name="instrumentSingle"]:checked');
    if (selectedRadio) {
      instrumentString = selectedRadio.value;
    }
  }
  comfyJazz.setInstrument(instrumentString);
}

// Function to initialize control values from comfyJazz state
function initializeControls() {
  if (!comfyJazz || !toggleMultiInstrument || !instrumentRadioContainer || !instrumentCheckboxContainer) return;

  // --- Initialize other controls --- 
  if (volumeSlider) {
     volumeSlider.value = String(comfyJazz.volume);
     if (volumeValueSpan) volumeValueSpan.textContent = parseFloat(volumeSlider.value).toFixed(2); // Format volume
  }
  if (playAutoNotesCheckbox) playAutoNotesCheckbox.checked = comfyJazz.playAutoNotes;
  if (autoNotesChanceSlider) {
    autoNotesChanceSlider.value = String(comfyJazz.autoNotesChance);
    if (autoNotesChanceValueSpan) autoNotesChanceValueSpan.textContent = parseFloat(autoNotesChanceSlider.value).toFixed(2); // Format chance
  }
  if (autoNotesDelaySlider) {
    autoNotesDelaySlider.value = String(comfyJazz.autoNotesDelay);
    if (autoNotesDelayValueSpan) autoNotesDelayValueSpan.textContent = autoNotesDelaySlider.value;
  }
  // Initialize Transpose slider and span
  if (transposeSlider) {
    transposeSlider.value = String(comfyJazz.transpose);
    if (transposeValueSpan) transposeValueSpan.textContent = transposeSlider.value;
  }

  // --- Initialize Instrument Controls --- 
  // Determine initial mode based on whether instrument string contains commas
  const isMultiMode = comfyJazz.instrument.includes(',');
  toggleMultiInstrument.checked = isMultiMode;

  if (isMultiMode) {
    instrumentRadioContainer.classList.add('hide');
    instrumentCheckboxContainer.classList.remove('hide');
    // Initialize Checkboxes
    const activeInstruments = comfyJazz.instrument.split(",").map(i => i.trim()).filter(Boolean);
    instrumentCheckboxes.forEach(checkbox => {
      checkbox.checked = activeInstruments.includes(checkbox.value);
    });
    // Ensure at least one is checked if loaded state was invalid multi-select
    if (activeInstruments.length === 0) {
        const defaultCheckbox = document.getElementById(`instr-check-${defaultComfyJazzSettings.instrument}`) as HTMLInputElement | null;
        if (defaultCheckbox) defaultCheckbox.checked = true;
        comfyJazz.setInstrument(defaultComfyJazzSettings.instrument); // Correct internal state too
    }
  } else {
    instrumentRadioContainer.classList.remove('hide');
    instrumentCheckboxContainer.classList.add('hide');
    // Initialize Radio Buttons
    const activeInstrument = comfyJazz.instrument.trim() || defaultComfyJazzSettings.instrument;
    const radioToCheck = document.getElementById(`instr-radio-${activeInstrument}`) as HTMLInputElement | null;
    if (radioToCheck) {
        radioToCheck.checked = true;
    } else { 
        // Fallback if saved instrument isn't a valid radio option
        const defaultRadio = document.getElementById(`instr-radio-${defaultComfyJazzSettings.instrument}`) as HTMLInputElement | null;
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

// --- Event Listeners for Controls ---

// Close Button
if (closeControlsBtn && controlsPanel) {
  closeControlsBtn.addEventListener('click', () => {
    controlsPanel.classList.add('hide');
  });
}

// Listener for the MULTI-INSTRUMENT TOGGLE checkbox
if (toggleMultiInstrument && instrumentRadioContainer && instrumentCheckboxContainer) {
    toggleMultiInstrument.addEventListener('change', () => {
        const isMulti = toggleMultiInstrument.checked;
        instrumentRadioContainer.classList.toggle('hide', isMulti);
        instrumentCheckboxContainer.classList.toggle('hide', !isMulti);

        if (isMulti) {
            // Switching TO multi-select
            // Check the box corresponding to the currently selected radio
            const currentSingle = document.querySelector<HTMLInputElement>('input[name="instrumentSingle"]:checked')?.value || defaultComfyJazzSettings.instrument;
            instrumentCheckboxes.forEach(cb => {
                cb.checked = (cb.value === currentSingle);
            });
        } else {
            // Switching TO single-select
            // Select the radio corresponding to the FIRST checked box (or default)
            const firstChecked = Array.from(instrumentCheckboxes).find(cb => cb.checked)?.value || defaultComfyJazzSettings.instrument;
            const radioToSelect = document.getElementById(`instr-radio-${firstChecked}`) as HTMLInputElement | null;
            if (radioToSelect) {
                radioToSelect.checked = true;
            } else {
                // Fallback if first checked wasn't found (shouldn't happen often)
                 const defaultRadio = document.getElementById(`instr-radio-${defaultComfyJazzSettings.instrument}`) as HTMLInputElement | null;
                 if (defaultRadio) defaultRadio.checked = true;
            }
        }
        // Update the instrument state after switching modes
        updateInstrumentState();
    });
}

// Listener for RADIO buttons (Single Select Mode)
if (instrumentRadioContainer) {
    instrumentRadioContainer.addEventListener('change', (e) => {
        if (!toggleMultiInstrument?.checked && (e.target as HTMLInputElement).name === 'instrumentSingle') {
            updateInstrumentState();
        }
    });
}

// Listener for CHECKBOXES (Multi Select Mode)
if (instrumentCheckboxContainer) {
  instrumentCheckboxContainer.addEventListener('change', (e) => {
      if (toggleMultiInstrument?.checked && (e.target as HTMLInputElement).name === 'instrumentMulti') {
          updateInstrumentState();
      }
  });
}

// Volume Slider (Using 'input' for real-time feedback)
if (volumeSlider && volumeValueSpan) { // Ensure span exists
  volumeSlider.addEventListener('input', (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const newVolume = parseFloat(target.value);
    volumeValueSpan.textContent = newVolume.toFixed(2); // Update display
    if (!isNaN(newVolume)) {
      comfyJazz.setVolume(newVolume);
    }
  });
}

// Play Auto Notes Checkbox
if (playAutoNotesCheckbox) {
  playAutoNotesCheckbox.addEventListener('change', (e) => {
    const target = e.currentTarget as HTMLInputElement;
    comfyJazz.setPlayAutoNotes(target.checked);
  });
}

// Auto Notes Chance Slider (Using 'input')
if (autoNotesChanceSlider && autoNotesChanceValueSpan) { // Ensure span exists
  autoNotesChanceSlider.addEventListener('input', (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const newChance = parseFloat(target.value);
    autoNotesChanceValueSpan.textContent = newChance.toFixed(2); // Update display
    if (!isNaN(newChance)) {
       comfyJazz.setAutoNotesChance(newChance);
    }
  });
}

// Auto Notes Delay Slider (Using 'input')
if (autoNotesDelaySlider && autoNotesDelayValueSpan) { // Ensure span exists
  autoNotesDelaySlider.addEventListener('input', (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const newDelay = parseInt(target.value, 10);
    autoNotesDelayValueSpan.textContent = String(newDelay);
    if (!isNaN(newDelay)) {
       comfyJazz.setAutoNotesDelay(newDelay);
    }
  });
}

// Transpose Slider (Using 'input')
if (transposeSlider && transposeValueSpan) { // Ensure span exists
  transposeSlider.addEventListener('input', (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const newTranspose = parseInt(target.value, 10);
    transposeValueSpan.textContent = String(newTranspose);
    if (!isNaN(newTranspose)) {
      comfyJazz.setTranspose(newTranspose);
    }
  });
}

// Reset Settings Button
if (resetSettingsBtn) {
  resetSettingsBtn.addEventListener('click', () => {
    // Reset ALL comfyJazz internal state to defaults first
    comfyJazz.setInstrument(defaultComfyJazzSettings.instrument);
    comfyJazz.setVolume(defaultComfyJazzSettings.volume);
    comfyJazz.setPlayAutoNotes(defaultComfyJazzSettings.playAutoNotes);
    comfyJazz.setAutoNotesChance(defaultComfyJazzSettings.autoNotesChance);
    comfyJazz.setAutoNotesDelay(defaultComfyJazzSettings.autoNotesDelay);
    comfyJazz.setTranspose(defaultComfyJazzSettings.transpose);

    // Now, update the entire UI based on the reset state
    // initializeControls will correctly handle showing/hiding containers 
    // and setting the correct radio/checkbox state based on the 
    // now-reset comfyJazz.instrument value ("piano")
    initializeControls(); 

    // No need for manual UI manipulation here anymore
    // No need to call setInstrument again here
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
  if (e.key.toLowerCase() === "c") { // Check the character key 'c'
    if (controlsPanel) {
      controlsPanel.classList.toggle("hide");
      // Re-initialize controls every time panel is shown to reflect latest state
      if (!controlsPanel.classList.contains('hide')) {
        initializeControls();
      }
    }
    // Prevent falling through to the note playing logic
    e.preventDefault(); // Optional: Might help ensure only panel toggle happens
  } 
  // Play note progression with other keys (if panel is hidden or focus isn't on an input)
  else if (controlsPanel?.classList.contains('hide') || !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLSelectElement)) {
    comfyJazz.playNoteProgression((Math.random() * 8) >> 0);
  }
});

// --- Banner Logic ---
const welcomeBanner = document.getElementById('welcome-banner');
const closeBannerBtn = document.getElementById('close-banner-btn');

// Use ReturnType to get the correct type for setTimeout in the environment
let fadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

function dismissBanner() {
    if (welcomeBanner) {
        welcomeBanner.classList.add('hide'); // Hide immediately
    }
    // Clear scheduled timeouts if dismissed manually
    if (fadeTimeoutId !== null) clearTimeout(fadeTimeoutId);
    if (hideTimeoutId !== null) clearTimeout(hideTimeoutId);
}

if (welcomeBanner && closeBannerBtn) {
    // Automatic dismissal
    fadeTimeoutId = setTimeout(() => {
        welcomeBanner.classList.add('fade-out');
        hideTimeoutId = setTimeout(() => {
            // Use dismissBanner to ensure cleanup
            dismissBanner();
        }, 800); // Match faster CSS transition
    }, 4000); // Keep initial delay or adjust as needed

    // Manual dismissal via button
    closeBannerBtn.addEventListener('click', dismissBanner);
}

