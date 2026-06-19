const esbuild = require('esbuild');

esbuild.build({
    entryPoints: [
        "sdxbutton.css",
        "sdxbutton.js",
        "sdxdpad.css",
        "sdxdpad.js",
        "sdxexitbutton.css",
        "sdxexitbutton.js",
        "sdxjoystick.css",
        "sdxjoystick.js",
    ],
    outdir: "dist",
    minify: true,
    entryNames: "[name].min"
}).catch(() => process.exit(1));