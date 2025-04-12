import ComfyJazz from "./web/comfyjazz";
import { ComfyJazzInstance, ComfyJazzOptions } from "./web/comfyjazz";
import ComfyJS from "comfy.js";

const params: URLSearchParams = new URLSearchParams(location.search);

const instrument: string | null = params.get("instrument");
const volumeParam: string | null = params.get("volume");

// Parse volume parameter, defaulting to 1 if invalid or missing
let volume: number = 1;
if (volumeParam !== null) {
  const parsedVolume = parseFloat(volumeParam);
  if (!isNaN(parsedVolume)) {
    volume = Math.max(0, Math.min(1, parsedVolume)); // Clamp between 0 and 1
  }
}

// Type the options object
const comfyJazzOptions: ComfyJazzOptions = {
  autoNotesChance: 0.3,
  instrument: instrument ?? "piano",
  volume: volume,
};

//Start ComfyJazz - instance type is now inferred
const comfyJazz: ComfyJazzInstance = ComfyJazz(comfyJazzOptions);
comfyJazz.start();

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

//Keydown triggers notes
window.addEventListener("keydown", (e: KeyboardEvent): void => {
  //c will open the control panel
  if (e.code === "KeyC") {
    const controlsDiv = document.querySelector("#comfy-controls");
    if (controlsDiv) {
      controlsDiv.classList.toggle("hide");
    }
  } else {
    comfyJazz.playNoteProgression((Math.random() * 8) >> 0);
  }
});

// Add event listener for volume slider
const volumeSlider = document.querySelector<HTMLInputElement>(
  '#comfy-controls input[type="range"]'
);
if (volumeSlider) {
  volumeSlider.value = String(volume);
  volumeSlider.addEventListener("change", onVolumeChange);
}

function onVolumeChange(e: Event): void {
  const target = e.currentTarget as HTMLInputElement | null;
  if (target) {
    const newVolume = parseFloat(target.value);
    if (!isNaN(newVolume)) {
      comfyJazz.setVolume(newVolume);
    }
  }
}
