if (!window.__sdxExitButtonRegistered) {
    window.__sdxExitButtonRegistered = true;

    const HANDLED_EXIT_BUTTON = new Set(["size", "corner", "onexit", "style", "aria-label"]);
    const DEFAULT_SIZE = "1.5rem";

    for (let button of document.querySelectorAll("sdx-exit-button")) {
        const size = normalizeSize(button.getAttribute("size") || DEFAULT_SIZE);
        const corner = normalizeCorner(button.getAttribute("corner") || "");
        const onExit = button.getAttribute("onexit") || "";
        const ariaLabel = button.getAttribute("aria-label") || "Back";
        const userStyle = button.getAttribute("style") || "";
        const mergedStyle = userStyle
            ? `--sdx-exit-button-size: ${size}; ${userStyle}`
            : `--sdx-exit-button-size: ${size};`;

        const extraAttrs = Array.from(button.attributes)
            .filter(attr => !HANDLED_EXIT_BUTTON.has(attr.name))
            .map(attr => `${attr.name}="${attr.value}"`)
            .join(" ");

        button.outerHTML = `
            <sdx-exit-button
              size="${size}"
              ${corner ? `corner="${corner}"` : ""}
              onsdxexit="${onExit}"
              ${extraAttrs}
              style="${mergedStyle}"
              onpointerdown="pressExitBtn(event)"
              onpointerup="releaseExitBtn(event)"
              onpointercancel="cancelExitBtn(event)"
              aria-label="${ariaLabel}"
            >
              <span class="sdx-exit-button__icon" aria-hidden="true">${arrowBackIcon()}</span>
            </sdx-exit-button>`;
    }

    for (let btn of document.querySelectorAll("sdx-exit-button[onsdxexit]")) {
        const expr = btn.getAttribute("onsdxexit");
        btn.addEventListener("sdxexit", new Function("event", expr));
    }
}

function normalizeSize(size) {
    return /^-?\d+(?:\.\d+)?$/.test(size) ? `${size}rem` : size;
}

function normalizeCorner(corner) {
    const value = corner.trim().toLowerCase();
    const allowed = new Set(["top-start", "top-end", "bottom-start", "bottom-end"]);
    return allowed.has(value) ? value : "";
}

function arrowBackIcon() {
    return `
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
        </svg>`;
}

function callOnExit(btn) {
    btn.dispatchEvent(new CustomEvent("sdxexit", {
        bubbles: true,
        detail: { mocked: false, type: "back" }
    }));

    if (window.kmpJsBridge) {
        window.kmpJsBridge.callNative("disconnect", "", () => {});
    }
}

function pressExitBtn(e) {
    const btn = e.currentTarget;
    btn.setPointerCapture(e.pointerId);
    btn._captured ??= new Set();
    btn._captured.add(e.pointerId);
}

function releaseExitBtn(e) {
    const btn = e.currentTarget;
    if (!btn._captured?.has(e.pointerId)) return;
    btn._captured.delete(e.pointerId);

    const rect = btn.getBoundingClientRect();
    const isIn = e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;

    if (isIn) {
        callOnExit(btn);
    }
}

function cancelExitBtn(e) {
    const btn = e.currentTarget;
    if (!btn._captured?.has(e.pointerId)) return;
    btn._captured.delete(e.pointerId);
}
