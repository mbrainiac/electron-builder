#! /usr/bin/env node

"use strict";

const platformPackager_1 = require("./platformPackager");
const packager_1 = require("./packager");
const builder_1 = require("./builder");
const promise_1 = require("./promise");
const yargs = require("yargs");
const chalk_1 = require("chalk");
const metadata_1 = require("./metadata");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./awaiter");
const args = yargs.version().option("osx", {
    alias: "o",
    describe: "Build for OS X",
    type: "array"
}).option("linux", {
    alias: "l",
    describe: "Build for Linux",
    type: "array"
}).option("win", {
    alias: ["w", "windows"],
    describe: "Build for Windows",
    type: "array"
}).option("x64", {
    describe: "Build for x64",
    type: "boolean"
}).option("ia32", {
    describe: "Build for ia32",
    type: "boolean"
}).option("target", {
    alias: "t",
    describe: "Target package types",
    choices: platformPackager_1.commonTargets
}).option("publish", {
    alias: "p",
    describe: `Publish artifacts (to GitHub Releases), see ${ chalk_1.underline("https://goo.gl/WMlr4n") }`,
    choices: ["onTag", "onTagOrDraft", "always", "never"]
}).option("platform", {
    choices: ["osx", "win", "linux", "darwin", "win32", "all"]
}).option("arch", {
    choices: ["ia32", "x64", "all"]
}).option("npmRebuild", {
    describe: "Runs npm rebuild before starting to package the app.",
    default: true,
    type: "boolean"
}).strict().help().epilog(`Project home: ${ chalk_1.underline("https://github.com/electron-userland/electron-builder") }`).argv;
const platforms = packager_1.normalizePlatforms(args.platform);
if (args.osx != null && !(platforms.indexOf(metadata_1.Platform.OSX) !== -1)) {
    platforms.push(metadata_1.Platform.OSX);
}
if (args.linux != null && !(platforms.indexOf(metadata_1.Platform.LINUX) !== -1)) {
    platforms.push(metadata_1.Platform.LINUX);
}
if (args.win != null && !(platforms.indexOf(metadata_1.Platform.WINDOWS) !== -1)) {
    platforms.push(metadata_1.Platform.WINDOWS);
}
const archAsProp = args.arch;
const archs = archAsProp === "all" ? ["ia32", "x64"] : archAsProp == null ? [] : [archAsProp];
if (args.x64 && !(archs.indexOf("x64") !== -1)) {
    archs.push("x64");
}
if (args.ia32 && !(archs.indexOf("ia32") !== -1)) {
    archs.push("ia32");
}
builder_1.build(Object.assign({}, args, {
    platform: platforms,
    arch: archs
})).catch(promise_1.printErrorAndExit);
//# sourceMappingURL=build-cli.js.map