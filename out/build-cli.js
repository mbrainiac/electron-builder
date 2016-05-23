#! /usr/bin/env node

"use strict";

const builder_1 = require("./builder");
const promise_1 = require("./promise");
const cla = require("command-line-args");
const fs_1 = require("fs");
const path = require("path");
const util_1 = require("./util");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./awaiter");
const cli = cla([{ name: "dist", type: Boolean, alias: "d", description: "Whether to package in a distributable format (e.g. DMG, windows installer, NuGet package)." }, { name: "publish", type: String, alias: "p", description: "Publish artifacts (to GitHub Releases): onTag (on tag push only) or onTagOrDraft (on tag push or if draft release exists)." }, { name: "platform", type: String, multiple: true, description: "darwin, linux, win32 or all. Current platform (" + process.platform + ") by default." }, { name: "arch", type: String, description: "ia32, x64 or all. Defaults to architecture you're running on." }, { name: "sign", type: String }, { name: "help", alias: "h", type: Boolean, description: "Display this usage guide." }, { name: "appDir", type: String }]);
const args = cli.parse();
if (args.help) {
    const version = process.env.npm_package_version || JSON.parse(fs_1.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")).version;
    console.log(cli.getUsage({
        title: "electron-builder " + version,
        footer: "Project home: [underline]{https://github.com/electron-userland/electron-builder}",
        hide: ["appDir"]
    }));
} else {
    if (args.appDir) {
        util_1.warn(`-appDir CLI parameter is deprecated, please configure build.directories.app instead
See https://github.com/electron-userland/electron-builder/wiki/Options#MetadataDirectories-app`);
    }
    builder_1.build(args).catch(promise_1.printErrorAndExit);
}
//# sourceMappingURL=build-cli.js.map