if (!window.__sdxJoystickRegistered) {
    window.__sdxJoystickRegistered = true;
    const DEFAULT_SIZE = "9em";
    const DEFAULT_KNOB_RATIO = 0.4;

    document.querySelectorAll("sdx-joystick").forEach(joystick => {
        const size      = joystick.getAttribute("size")       || DEFAULT_SIZE;
        const knobRatio = joystick.getAttribute("knob-ratio") || String(DEFAULT_KNOB_RATIO);
        const onInput    = joystick.getAttribute("oninput")   || "";

        const passthroughAttrs = Array.from(joystick.attributes)
            .filter(a => !["size", "knob-ratio", "oninput"].includes(a.name))
            .map(a => `${a.name}="${a.value}"`).join(" ");

        joystick.outerHTML = `
              <sdx-joystick size="${size}" knob-ratio="${knobRatio}" onsdxinput="${onInput}" ${passthroughAttrs}>
                <sdx-joystick-base style="width:${size};height:${size};">
                  <sdx-joystick-knob knob-ratio="${knobRatio}"></sdx-joystick-knob>
                </sdx-joystick-base>
              </sdx-joystick>`;
    });

    document.querySelectorAll("sdx-joystick").forEach(joystick => {
        const base      = joystick.querySelector("sdx-joystick-base");
        const knob      = joystick.querySelector("sdx-joystick-knob");
        const knobRatio = parseFloat(knob.getAttribute("knob-ratio") || DEFAULT_KNOB_RATIO);
        const baseSize  = base.getBoundingClientRect().width;
        const knobSize  = baseSize * knobRatio;
        const center    = baseSize / 2 - knobSize / 2;

        knob.style.width  = knobSize + "px";
        knob.style.height = knobSize + "px";
        knob.style.left   = center + "px";
        knob.style.top    = center + "px";
    });

    document.querySelectorAll("sdx-joystick").forEach(joystick => {
        const base = joystick.querySelector("sdx-joystick-base");
        let activePointerId = null;

        const expr = joystick.getAttribute("onsdxinput");
        if (expr) joystick.addEventListener("sdxinput", new Function("event", expr));

        base.addEventListener("pointerdown", e => {
            if (activePointerId !== null) return;
            activePointerId = e.pointerId;
            base.setPointerCapture(e.pointerId);
            base.style.cursor = "grabbing";
            callOnJoystickInput(joystick, updateKnob(...Object.values(getPos(e, base)), base));
        });

        base.addEventListener("pointermove", e => {
            if (e.pointerId !== activePointerId) return;
            callOnJoystickInput(joystick, updateKnob(...Object.values(getPos(e, base)), base));
        });

        base.addEventListener("pointerup",     e => cancel(e));
        base.addEventListener("pointercancel", e => cancel(e));

        function getPos(e, el) {
            const r = el.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        }

        function cancel(e) {
            if (e.pointerId !== activePointerId) return;
            activePointerId = null;
            base.style.cursor = "grab";
            resetKnob(base);
        }
    });
}

function geometry(base) {
    const knob       = base.querySelector("sdx-joystick-knob");
    const knobRatio  = parseFloat(knob.getAttribute("knob-ratio") || DEFAULT_KNOB_RATIO);
    const baseSize   = base.getBoundingClientRect().width;
    const radius     = baseSize / 2;
    const knobRadius = radius * knobRatio;
    return { knob, radius, knobRadius, maxDist: radius - knobRadius };
}

function callOnJoystickInput(joystick, data) {
    const name = joystick.getAttribute("joystick-input") || joystick.getAttribute("name") || "joystick";
    joystick.dispatchEvent(new CustomEvent("sdxinput", {
        bubbles: true,
        detail: { mocked: false, type: name, ...data }
    }));
    if (window.kmpJsBridge) {
        window.kmpJsBridge.callNative(
            "sendJoystickInput",
            JSON.stringify({ mocked: false, joystick: name, ...data }),
            () => {}
        );
    }
}

function updateKnob(x, y, base) {
    const { knob, radius, knobRadius, maxDist } = geometry(base);
    const cx = radius, cy = radius;
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedX = dist > maxDist && dist > 0 ? cx + dx * (maxDist / dist) : x;
    const clampedY = dist > maxDist && dist > 0 ? cy + dy * (maxDist / dist) : y;

    knob.style.transition = "none";
    knob.style.left = (clampedX - knobRadius) + "px";
    knob.style.top  = (clampedY - knobRadius) + "px";

    const nx = (clampedX - cx) / maxDist;
    const ny = (clampedY - cy) / maxDist;
    return {
        x:         parseFloat(Math.max(-1, Math.min(1, nx)).toFixed(3)),
        y:         parseFloat(Math.max(-1, Math.min(1, ny)).toFixed(3)),
        angleDeg:  parseFloat((Math.atan2(ny, nx) * 180 / Math.PI).toFixed(1)),
        magnitude: parseFloat(Math.min(1, Math.sqrt(nx * nx + ny * ny)).toFixed(3))
    };
}

function resetKnob(base) {
    const { knob, radius, knobRadius } = geometry(base);
    knob.style.transition = "top 80ms, left 80ms";
    knob.style.left = (radius - knobRadius) + "px";
    knob.style.top  = (radius - knobRadius) + "px";
    callOnJoystickInput(base.closest("sdx-joystick"), { x: 0, y: 0, angleDeg: 0, magnitude: 0 });
}