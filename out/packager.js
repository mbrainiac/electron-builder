"use strict";

const path = require("path");
const util_1 = require("./util");
const promise_1 = require("./promise");
const events_1 = require("events");
const bluebird_1 = require("bluebird");
const metadata_1 = require("./metadata");
const errorMessages = require("./errorMessages");
const util = require("util");
const deepAssign = require("deep-assign");
const compareVersions = require("compare-versions");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./awaiter");
function addHandler(emitter, event, handler) {
    emitter.on(event, handler);
}
class Packager {
    //noinspection JSUnusedGlobalSymbols
    constructor(options) {
        let repositoryInfo = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        this.options = options;
        this.repositoryInfo = repositoryInfo;
        this.isTwoPackageJsonProjectLayoutUsed = true;
        this.eventEmitter = new events_1.EventEmitter();
        this.projectDir = options.projectDir == null ? process.cwd() : path.resolve(options.projectDir);
    }
    artifactCreated(handler) {
        addHandler(this.eventEmitter, "artifactCreated", handler);
        return this;
    }
    get devPackageFile() {
        return path.join(this.projectDir, "package.json");
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            const devPackageFile = this.devPackageFile;
            const platforms = this.options.platform;
            this.devMetadata = deepAssign((yield util_1.readPackageJson(devPackageFile)), this.options.devMetadata);
            this.appDir = yield util_1.computeDefaultAppDirectory(this.projectDir, util_1.use(this.devMetadata.directories, it => it.app) || this.options.appDir);
            this.isTwoPackageJsonProjectLayoutUsed = this.appDir !== this.projectDir;
            const appPackageFile = this.projectDir === this.appDir ? devPackageFile : path.join(this.appDir, "package.json");
            this.metadata = appPackageFile === devPackageFile ? this.devMetadata : yield util_1.readPackageJson(appPackageFile);
            this.checkMetadata(appPackageFile, devPackageFile, platforms);
            checkConflictingOptions(this.devMetadata.build);
            this.electronVersion = yield util_1.getElectronVersion(this.devMetadata, devPackageFile);
            const cleanupTasks = [];
            return promise_1.executeFinally(this.doBuild(platforms, cleanupTasks), () => promise_1.all(cleanupTasks.map(it => it())));
        });
    }
    doBuild(platforms, cleanupTasks) {
        return __awaiter(this, void 0, void 0, function* () {
            const distTasks = [];
            const outDir = path.resolve(this.projectDir, util_1.use(this.devMetadata.directories, it => it.output) || "dist");
            // custom packager - don't check wine
            let checkWine = this.options.platformPackagerFactory == null;
            for (let platform of platforms) {
                let wineCheck = null;
                if (checkWine && process.platform !== "win32" && platform === metadata_1.Platform.WINDOWS) {
                    wineCheck = util_1.exec("wine", ["--version"]);
                }
                const helper = this.createHelper(platform, cleanupTasks);
                for (let arch of normalizeArchs(platform, this.options.arch)) {
                    yield this.installAppDependencies(platform, arch);
                    if (checkWine && wineCheck != null) {
                        checkWine = false;
                        checkWineVersion(wineCheck);
                    }
                    // electron-packager uses productName in the directory name
                    yield helper.pack(outDir, arch, distTasks);
                }
            }
            return yield bluebird_1.Promise.all(distTasks);
        });
    }
    createHelper(platform, cleanupTasks) {
        if (this.options.platformPackagerFactory != null) {
            return this.options.platformPackagerFactory(this, platform, cleanupTasks);
        }
        switch (platform) {
            case metadata_1.Platform.OSX:
                {
                    const helperClass = require("./osxPackager").default;
                    return new helperClass(this, cleanupTasks);
                }
            case metadata_1.Platform.WINDOWS:
                {
                    const helperClass = require("./winPackager").WinPackager;
                    return new helperClass(this, cleanupTasks);
                }
            case metadata_1.Platform.LINUX:
                return new (require("./linuxPackager").LinuxPackager)(this, cleanupTasks);
            default:
                throw new Error(`Unknown platform: ${ platform }`);
        }
    }
    checkMetadata(appPackageFile, devAppPackageFile, platforms) {
        const reportError = missedFieldName => {
            throw new Error("Please specify '" + missedFieldName + "' in the application package.json ('" + appPackageFile + "')");
        };
        const appMetadata = this.metadata;
        if (appMetadata.name == null) {
            reportError("name");
        } else if (appMetadata.description == null) {
            reportError("description");
        } else if (appMetadata.version == null) {
            reportError("version");
        } else if (appMetadata !== this.devMetadata) {
            if (appMetadata.build != null) {
                throw new Error(util.format(errorMessages.buildInAppSpecified, appPackageFile, devAppPackageFile));
            }
            if (this.devMetadata.homepage != null) {
                util_1.warn("homepage in the development package.json is deprecated, please move to the application package.json");
            }
            if (this.devMetadata.license != null) {
                util_1.warn("license in the development package.json is deprecated, please move to the application package.json");
            }
        }
        if (this.devMetadata.build == null) {
            throw new Error(util.format(errorMessages.buildIsMissed, devAppPackageFile));
        } else {
            const author = appMetadata.author;
            if (author == null) {
                reportError("author");
            } else if (this.options.dist && author.email == null && platforms.indexOf(metadata_1.Platform.LINUX) !== -1) {
                throw new Error(util.format(errorMessages.authorEmailIsMissed, appPackageFile));
            }
            if (this.devMetadata.build.name != null) {
                throw new Error(util.format(errorMessages.nameInBuildSpecified, appPackageFile));
            }
        }
    }
    installAppDependencies(platform, arch) {
        if (this.isTwoPackageJsonProjectLayoutUsed) {
            if (platform.nodeName === process.platform) {
                return util_1.installDependencies(this.appDir, this.electronVersion, arch, "rebuild");
            } else {
                util_1.log("Skip app dependencies rebuild because platform is different");
            }
        } else {
            util_1.log("Skip app dependencies rebuild because dev and app dependencies are not separated");
        }
        return bluebird_1.Promise.resolve();
    }
}
exports.Packager = Packager;
function normalizeArchs(platform, arch) {
    if (platform === metadata_1.Platform.OSX) {
        return ["x64"];
    } else {
        return arch == null ? [process.arch] : arch === "all" ? ["ia32", "x64"] : [arch];
    }
}
exports.normalizeArchs = normalizeArchs;
function normalizePlatforms(rawPlatforms) {
    const platforms = rawPlatforms == null || Array.isArray(rawPlatforms) ? rawPlatforms : [rawPlatforms];
    if (platforms == null || platforms.length === 0) {
        return [metadata_1.Platform.fromString(process.platform)];
    } else if (platforms[0] === "all") {
        if (process.platform === metadata_1.Platform.OSX.nodeName) {
            return [metadata_1.Platform.OSX, metadata_1.Platform.LINUX, metadata_1.Platform.WINDOWS];
        } else if (process.platform === metadata_1.Platform.LINUX.nodeName) {
            // OS X code sign works only on OS X
            return [metadata_1.Platform.LINUX, metadata_1.Platform.WINDOWS];
        } else {
            return [metadata_1.Platform.WINDOWS];
        }
    } else {
        return platforms.map(it => it instanceof metadata_1.Platform ? it : metadata_1.Platform.fromString(it));
    }
}
exports.normalizePlatforms = normalizePlatforms;
function checkConflictingOptions(options) {
    for (let name of ["all", "out", "tmpdir", "version", "platform", "dir", "arch", "name"]) {
        if (name in options) {
            throw new Error(`Option ${ name } is ignored, do not specify it.`);
        }
    }
}
function checkWineVersion(checkPromise) {
    return __awaiter(this, void 0, void 0, function* () {
        function wineError(prefix) {
            return `${ prefix }, please see https://github.com/electron-userland/electron-builder/wiki/Multi-Platform-Build#${ process.platform === "linux" ? "linux" : "os-x" }`;
        }
        let wineVersion;
        try {
            wineVersion = (yield checkPromise)[0].toString().trim();
        } catch (e) {
            if (e.code === "ENOENT") {
                throw new Error(wineError("wine is required"));
            } else {
                throw new Error("Cannot check wine version: " + e);
            }
        }
        if (wineVersion.startsWith("wine-")) {
            wineVersion = wineVersion.substring("wine-".length);
        }
        if (compareVersions(wineVersion, "1.8") === -1) {
            throw new Error(wineError(`wine 1.8+ is required, but your version is ${ wineVersion }`));
        }
    });
}
//# sourceMappingURL=packager.js.map