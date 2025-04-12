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
const instrumentSelect = document.querySelector<HTMLSelectElement>('#instrumentSelect');
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
  instrument: "piano",
  volume: 1,
  playAutoNotes: true,
  autoNotesChance: 0.2,
  autoNotesDelay: 300,
  transpose: -5
};

// Function to initialize control values from comfyJazz state
function initializeControls() {
  if (!comfyJazz) return; // Guard against comfyJazz not being ready

  if (volumeSlider) {
     volumeSlider.value = String(comfyJazz.volume);
     if (volumeValueSpan) volumeValueSpan.textContent = parseFloat(volumeSlider.value).toFixed(2); // Format volume
  }
  if (instrumentSelect) instrumentSelect.value = comfyJazz.instrument;
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

// Instrument Select
if (instrumentSelect) {
  instrumentSelect.addEventListener('change', (e) => {
    const target = e.currentTarget as HTMLSelectElement;
    comfyJazz.setInstrument(target.value);
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
    // Set comfyJazz instance back to defaults
    comfyJazz.setInstrument(defaultComfyJazzSettings.instrument);
    comfyJazz.setVolume(defaultComfyJazzSettings.volume);
    comfyJazz.setPlayAutoNotes(defaultComfyJazzSettings.playAutoNotes);
    comfyJazz.setAutoNotesChance(defaultComfyJazzSettings.autoNotesChance);
    comfyJazz.setAutoNotesDelay(defaultComfyJazzSettings.autoNotesDelay);
    comfyJazz.setTranspose(defaultComfyJazzSettings.transpose);

    // Update the UI to reflect the defaults
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
  // Toggle panel with 'C'
  if (e.code === "KeyC") {
    if (controlsPanel) {
      controlsPanel.classList.toggle("hide");
      // Re-initialize controls every time panel is shown to reflect latest state
      if (!controlsPanel.classList.contains('hide')) {
        initializeControls();
      }
    }
  } 
  // Play note progression with other keys (if panel is hidden or focus isn't on an input)
  else if (controlsPanel?.classList.contains('hide') || !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLSelectElement)) {
     comfyJazz.playNoteProgression((Math.random() * 8) >> 0);
  }
});

