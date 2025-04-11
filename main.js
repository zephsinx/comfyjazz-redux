import ComfyJazz from './web/comfyjazz.js';
import { Howl, Howler } from 'howler';
import ComfyJS from 'comfy.js';

// Make Howler available globally for comfyjazz.js to use
window.Howl = Howl;
window.Howler = Howler;

const params = new URLSearchParams(location.search);

const instrument = params.get("instrument");
const volume = params.get("volume");

//Start ComfyJazz
const comfyJazz = ComfyJazz({
	autoNotesChance:0.3,
	instrument: instrument || "piano",
	volume: volume || 1
});
comfyJazz.start();

//Integrate with Twitch Chat
const channel = params.get("channel");

if( channel ) {
	ComfyJS.onChat = (user, message, flags, self, extra) => {
		comfyJazz.playNoteProgression((Math.random() * 8) >> 0);
	};
	ComfyJS.Init(channel);
}

//Keydown triggers notes
window.addEventListener("keydown", (e) => {

	//c will open the control panel
	if( e.code === "KeyC" ) {
		document.querySelector("#comfy-controls").classList.toggle('hide');
	} else {
		// comfyJazz.playNote();
		comfyJazz.playNoteProgression((Math.random() * 8) >> 0);
	}
});

// Add event listener for volume slider
const volumeSlider = document.querySelector('#comfy-controls input[type="range"]');
if (volumeSlider) {
	volumeSlider.addEventListener('change', onVolumeChange);
}

function onVolumeChange(e) {
	comfyJazz.setVolume(e.currentTarget.value);
} 