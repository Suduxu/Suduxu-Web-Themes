Suduxu is a development tool that allows software creators to turn any smartphone into a responsive, custom game controller or companion screen.

# Suduxu Web-Themes
This repository contains a collection of web-based component-like HTML-Elements that can be used in corporation with Suduxu. To use these components, include the stylesheet as well as the script in your HTML file.

## Components

### `sdx-button`
A simple circular button used to send discrete button inputs to Suduxu.

#### Parameters
- `button-input`: Button identifier sent on press/release. If omitted the element text content is used.
- `oninput` / `onsdxinput`: JavaScript expression to run when input happens. The dispatched event is `sdxinput` and `event.detail` contains:
  - `type`: the button identifier
  - `state`: `Down`, `Up` or `Cancel`
  - `mocked`: always `false` (WIP)
- Element value: Visible label (text content).

Example:
```html
<sdx-button button-input="A" oninput="console.log(event.detail)">A</sdx-button>
```

Conversion
- Original `<sdx-button ...>...</sdx-button>` is normalized at runtime to include `onsdxinput` and a `buttonInput` attribute on the resulting element. The element remains selectable via `sdx-button` in CSS/JS.

Styling
- Target `sdx-button` in CSS. The default rules (in `sdxbutton.css`) set size, font-size and a circular shape. Override sizing by setting width/height or use a selector:
```css
sdx-button { width: 4rem; height: 4rem; font-size: 1.125rem; }
```

---

### `sdx-dpad`
A directional pad that reports `Up/Down/Left/Right` presses. It supports multi-direction presses (diagonals).

#### Parameters
- `background`: space-separated list of background values (colors/gradients) used for arms and center. See `sdxdpad.js` for parsing rules.
- `pressed-background`: same format as `background` but applied while pressed.
- `oninput` / `onsdxinput`: expression run when directional input occurs. Events dispatched are `sdxinput` with `detail`:
  - `type`: `Up`/`Down`/`Left`/`Right`
  - `state`: `Down` or `Up`

Conversion
- The runtime replaces a simple `<sdx-dpad ...>` with a nested structure:
  - `<sdx-dpad-container onsdxinput="...">` (outer container)
  - inner `<sdx-dpad>`, `<sdx-dpad-cross>`, and child arms: `<sdx-dpad-up>`, `<sdx-dpad-down>`, `<sdx-dpad-left>`, `<sdx-dpad-right>`, and `<sdx-dpad-center>`.
- Each arm receives `background` and `pressed-background` attributes so styling/behavior is applied by the script and CSS.

Notes
- Because the component expands into multiple child elements, style the provided tags (`sdx-dpad`, `sdx-dpad-up`, etc.) rather than trying to style a single wrapper.

---

### `sdx-joystick`
A radial joystick reporting continuous X/Y values, angle and magnitude.

#### Parameters
- `size`: CSS size for the joystick base (default `9em`).
- `knob-ratio`: fraction used to size the movable knob (default `0.4`).
- `joystick-input` or `name`: name used as the `type` in `sdxinput` events (defaults to `joystick`).
- `oninput` / `onsdxinput`: expression run on movement. Events dispatched are `sdxinput` with `detail`:
  - `x`, `y`: normalized axes in [-1, 1]
  - `angleDeg`: angle in degrees
  - `magnitude`: 0..1

Conversion
- `<sdx-joystick>` is expanded into a structure containing `<sdx-joystick-base>` and `<sdx-joystick-knob>`; sizes and knob positions are managed by the script.

Notes
- This component contains multiple child elements; style the provided sub-elements (`sdx-joystick-base`, `sdx-joystick-knob`) using the CSS file.

---

### `sdx-exit-button`
A small back/exit button that dispatches `sdxexit` when activated.

#### Parameters
- `size`: visual size (can be unitless number which becomes `rem`, default `1.5rem`).
- `corner`: place the button in a fixed corner. Allowed values: `top-start`, `top-end`, `bottom-start`, `bottom-end`.
- `onexit` / `onsdxexit`: expression to run when the exit action occurs. The element dispatches `sdxexit` with `detail: { mocked: false, type: 'back' }`.
- `aria-label`: accessible label (defaults to `Back`).

Conversion
- At runtime the original `<sdx-exit-button>` is replaced by an enhanced element that keeps the same tag but merges user `style` with a CSS variable `--sdx-exit-button-size` and attaches event handlers (pointer down/up/cancel). The element remains addressable as `sdx-exit-button`.

Styling
- Use the provided CSS variable to change icon size: `--sdx-exit-button-size: 2rem;` or set inline style. To position in a corner use the `corner` attribute. Examples:
```html
<sdx-exit-button corner="top-start" style="--sdx-exit-button-size:1.75rem;color:#fff;background:rgba(0,0,0,0.3)" onsdxexit="console.log('exit')"></sdx-exit-button>
```
Or in CSS:
```css
sdx-exit-button { color: #fff; background: transparent; }
sdx-exit-button { --sdx-exit-button-size: 1.25rem; }
```

---

#### Embedding / Distribution
Include the script and stylesheet for the components you need. Example (use the matching dist files for each component):
```html
<script defer src="https://cdn.jsdelivr.net/gh/Suduxu/Suduxu-Web-Themes@v1.0.0/dist/sdxbutton.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Suduxu/Suduxu-Web-Themes@v1.0.0/dist/sdxbutton.min.css">
<!-- add sdxjoystick.min.js / .css, sdxdpad.min.js / .css, sdxexitbutton.min.js / .css as needed -->
```


## Building
Minified `css` and `js` files are placed in the `dist` folder. To build the files, run the following command:

```bash
npm run build
```

When creating a new component, reference the `css` and `js` files in the `build.js` file inside `entryPoints`, for example:

```javascript
esbuild.build({
    entryPoints: [
        "sdxcomponent1.css",
        "sdxcomponent1.js",
        "sdxcomponent2.css",
        "sdxcomponent2.js",
    ]
})
```

The `build.js` file will automatically create the minified files in the `dist` folder.