# ComfyJazz Modernization TODO

Here are the initial steps recommended for modernizing the ComfyJazz codebase:

1. **Separate JavaScript from HTML:**

   - [x] Create a new JavaScript file named `main.js` in the root directory.
   - [x] Move all JavaScript code currently located between the `<script>` and `</script>` tags (lines ~26-68) in `index.html` into the new `main.js` file.
   - [x] Remove the now-empty `<script>` tags from `index.html`.

2. **Use JavaScript Modules (ESM):**

   - [x] Add the line `export default ComfyJazz;` at the very end of `web/comfyjazz.js`.
   - [x] Add the line `import ComfyJazz from './web/comfyjazz.js';` at the very beginning of `main.js`. (Verify the relative path is correct).
   - [x] Add `<script type="module" src="main.js"></script>` just before the closing `</body>` tag in `index.html`.
   - [x] Remove the original `<script src="web/ComfyJazz.js"></script>` tag from the `<head>` in `index.html`.

3. **Adopt Modern Event Handling:**

   - [x] In `index.html`, remove the `onchange="onVolumeChange(event)"` attribute entirely from the `<input type="range">` element.
   - [x] In `main.js`, add code to select the volume input element (e.g., `const volumeSlider = document.querySelector('#comfy-controls input[type="range"]');` - may need to add an ID for easier selection).
   - [x] In `main.js`, attach the event listener: `volumeSlider.addEventListener('change', onVolumeChange);`.
   - [x] Ensure the `onVolumeChange` function definition is present in `main.js` and accessible where the listener is added.

4. **External CSS:**

   - [x] Create a new CSS file named `style.css` in the root directory.
   - [x] Move all CSS rules from between the `<style>` and `</style>` tags (lines ~7-17) in `index.html` into `style.css`.
   - [x] Remove the now-empty `<style>` tags from `index.html`.
   - [x] Add `<link rel="stylesheet" href="style.css">` inside the `<head>` section of `index.html`.

5. **Consistent Variable Declarations:**

   - [x] Review `main.js` and replace all instances of `var` with `let` (for variables that will be reassigned) or `const` (for variables that won't).
   - [x] Review `web/comfyjazz.js` and replace all instances of `var` with `let` or `const`. Pay close attention to loop variables and function scope.
