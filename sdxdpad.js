const HANDLED_DPAD = new Set(["pressed-background", "background", "oninput"]);

const defaultCenterColor = "linear-gradient(to bottom,#000,#444)"
const defaultArmColor = "linear-gradient(to bottom,#666,#444)"
const defaultPressedArmColor = "linear-gradient(to bottom,#222,#444)"

if (!window.__sdxDpadRegistered) {
    window.__sdxDpadRegistered = true;

    for (let dpad of document.querySelectorAll("sdx-dpad")) {
        const parts = splitColors(dpad.getAttribute('background') || "");
        const pressedParts = splitColors(dpad.getAttribute("pressed-background") || "");
        let up, right, down, left, center;
        let upPressed, rightPressed, downPressed, leftPressed;

        if (pressedParts.length === 1) {
            [upPressed, rightPressed, downPressed, leftPressed] = Array(4).fill(pressedParts[0]);
        } else if (pressedParts.length === 2) {
            [upPressed, downPressed] = Array(2).fill(pressedParts[0]);
            [rightPressed, leftPressed] = Array(2).fill(pressedParts[1]);
        } else if (pressedParts.length === 4) {
            [upPressed, rightPressed, downPressed, leftPressed] = pressedParts;
        } else {
            [upPressed, rightPressed, downPressed, leftPressed] = Array(4).fill(defaultPressedArmColor);
        }

        if (parts.length === 1) {
            [up, right, down, left, center] = Array(5).fill(parts[0]);
        } else if (parts.length === 2) {
            [up, right, down, left] = Array(4).fill(parts[0]);
            center = parts[1];
        } else if (parts.length === 3) {
            [up, down] = Array(2).fill(parts[0]);
            [right, left] = Array(2).fill(parts[1]);
            center = parts[2];
        } else if (parts.length === 4) {
            [up, right, down, left] = parts;
            center = defaultCenterColor;
        } else if (parts.length === 0) {
            [up, right, down, left, center] = [...Array(4).fill(defaultArmColor), defaultCenterColor];
            center = defaultCenterColor;
        } else {
            [up, right, down, left, center] = parts;
        }

        let extraAttrs = Array.from(dpad.attributes)
            .filter(attr => !HANDLED_DPAD.has(attr.name))
            .map(attr => `${attr.name}="${attr.value}"`)
            .join(" ");

        let onInput = dpad.getAttribute("oninput") || "";

        dpad.outerHTML = `
            <sdx-dpad-container onsdxinput="${onInput}" ${extraAttrs}>
              <sdx-dpad>
                <sdx-dpad-cross>
                  <sdx-dpad-up background="${up}" pressed-background="${upPressed}"></sdx-dpad-up>
                  <sdx-dpad-down background="${down}" pressed-background="${downPressed}"></sdx-dpad-down>
                  <sdx-dpad-left background="${left}" pressed-background="${leftPressed}"></sdx-dpad-left>
                  <sdx-dpad-right background="${right}" pressed-background="${rightPressed}"></sdx-dpad-right>
                  <sdx-dpad-center style="background: ${center}"></sdx-dpad-center>
                </sdx-dpad-cross>
              </sdx-dpad>
            </sdx-dpad-container>`;
    }

    document.querySelectorAll("sdx-dpad-container[onsdxinput]").forEach(container => {
        const expr = container.getAttribute("onsdxinput");
        container.addEventListener("sdxinput", new Function("event", expr));
    });

    document.querySelectorAll("sdx-dpad").forEach(dpad => {
        let activePointerId = null;
        let currentPressed  = new Set();

        dpad.addEventListener("pointerdown", e => {
            if (activePointerId !== null) return;
            activePointerId = e.pointerId;
            dpad.setPointerCapture(e.pointerId);
            const { x, y } = getLocalPos(e, dpad);
            currentPressed = applyDirections(detectDirections(x, y, dpad), dpad, currentPressed);
        });

        dpad.addEventListener("pointermove", e => {
            if (e.pointerId !== activePointerId) return;
            const { x, y } = getLocalPos(e, dpad);
            currentPressed = applyDirections(detectDirections(x, y, dpad), dpad, currentPressed);
        });

        dpad.addEventListener("pointerup", e => {
            if (e.pointerId !== activePointerId) return;
            currentPressed = applyDirections(new Set(), dpad, currentPressed);
            activePointerId = null;
        });

        dpad.addEventListener("pointercancel", e => {
            if (e.pointerId !== activePointerId) return;
            currentPressed = applyDirections(new Set(), dpad, currentPressed);
            activePointerId = null;
        });
    });

    document.querySelectorAll("sdx-dpad-cross > :not(sdx-dpad-center)").forEach(arm => {
        const bg = arm.getAttribute("background");
        if (bg) arm.style.background = bg;
    });
}

function splitColors(str) {
    const result = [];
    let depth = 0, current = '';
    for (const ch of str.trim()) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === ' ' && depth === 0) {
            if (current) result.push(current);
            current = '';
            continue;
        }
        current += ch;
    }
    if (current) result.push(current);
    return result;
}

function callOnDpadInput(dpad, button, state) {
    const container = dpad.closest("sdx-dpad-container");
    if (!container) return;

    const event = new CustomEvent("sdxinput", {
        bubbles: true,
        detail: { mocked: false, type: button, state: state }
    });
    container.dispatchEvent(event);

    if (window.kmpJsBridge) {
        window.kmpJsBridge.callNative(
            "sendButtonInput",
            JSON.stringify({ mocked: false, button, state: state }),
            () => {}
        );
    }
}

function detectDirections(x, y, dpad) {
    const size = dpad.getBoundingClientRect().width;
    const third = size / 3;
    const dirs = new Set();
    if (y < third)        dirs.add("Up");
    if (y > 2 * third)    dirs.add("Down");
    if (x < third)        dirs.add("Left");
    if (x > 2 * third)    dirs.add("Right");
    return dirs;
}

function getLocalPos(e, dpad) {
    const rect = dpad.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function getDpadArmByDirection(dpad, dir) {
    return dpad.querySelector(`sdx-dpad-${dir.toLowerCase()}`);
}

function applyDirections(newPressed, dpad, currentPressed) {
    for (const dir of newPressed) {
        if (!currentPressed.has(dir)) {
            let arm = getDpadArmByDirection(dpad, dir);

            arm.style.background = arm.getAttribute("pressed-background");

            callOnDpadInput(dpad, dir, "Down");
        }
    }
    for (const dir of currentPressed) {
        if (!newPressed.has(dir)) {
            let arm = getDpadArmByDirection(dpad, dir);

            arm.style.background = arm.getAttribute("background");
            callOnDpadInput(dpad, dir, "Up");
        }
    }


    dpad.querySelector("sdx-dpad-cross").style.transform = newPressed.size > 0 ? "translateY(4px)" : "translateY(0)";
    return newPressed;
}