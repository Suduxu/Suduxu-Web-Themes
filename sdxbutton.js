if (!window.__sdxButtonRegistered) {
    window.__sdxButtonRegistered = true;

    const HANDLED_BUTTON = new Set(["button-input", "oninput"]);

    for (let button of document.querySelectorAll("sdx-button")) {
        let content = button.textContent
        let buttonInput = button.getAttribute("button-input") || content;

        let onInput = button.getAttribute("oninput") || "";

        let extraAttrs = Array.from(button.attributes)
            .filter(attr => !HANDLED_BUTTON.has(attr.name))
            .map(attr => `${attr.name}="${attr.value}"`)
            .join(" ");

        button.outerHTML = `
                <sdx-button
                  buttonInput="${buttonInput}"
                  onsdxinput="${onInput}"
                  ${extraAttrs}
                  onpointerdown="pressBtn(event)"
                  onpointerup="releaseBtn(event)"
                >
                  ${content}
                </sdx-button>`;
    }

    for (let btn of document.querySelectorAll("sdx-button[onsdxinput]")) {
        const expr = btn.getAttribute("onsdxinput");
        btn.addEventListener("sdxinput", new Function("event", expr));
    }
}

function callOnButtonInput(btn, state) {
    const button = btn.getAttribute("buttonInput");

    const event = new CustomEvent("sdxinput", {
        bubbles: true,
        detail: { mocked: false, type: button, state }
    });

    btn.dispatchEvent(event);

    if (window.kmpJsBridge) {
        window.kmpJsBridge.callNative(
            "sendButtonInput",
            JSON.stringify({ mocked: false, type: button, state: state }),
            () => {}
        );
    }
}

function pressBtn(e) {
    const btn = e.currentTarget;
    btn.setPointerCapture(e.pointerId);
    btn._captured ??= new Set();
    btn._captured.add(e.pointerId);

    callOnButtonInput(btn, "Down");
}

function releaseBtn(e) {
    const btn = e.currentTarget;
    if (!btn._captured?.has(e.pointerId)) return;
    btn._captured.delete(e.pointerId);

    const rect = btn.getBoundingClientRect();
    const isIn = e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top  && e.clientY <= rect.bottom;

    if (isIn) {
        callOnButtonInput(btn, "Up");
    } else {
        callOnButtonInput(btn, "Cancel");
    }
}