"use strict";

const platformPackager_1 = require("./platformPackager");
const metadata_1 = require("./metadata");
const path = require("path");
const bluebird_1 = require("bluebird");
const util_1 = require("./util");
const codeSign_1 = require("./codeSign");
const deepAssign = require("deep-assign");
const electron_osx_sign_tf_1 = require("electron-osx-sign-tf");
const fs_extra_p_1 = require("fs-extra-p");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./awaiter");
class OsXPackager extends platformPackager_1.PlatformPackager {
    constructor(info, cleanupTasks) {
        super(info);
        if (this.options.cscLink != null && this.options.cscKeyPassword != null) {
            const keychainName = codeSign_1.generateKeychainName();
            cleanupTasks.push(() => codeSign_1.deleteKeychain(keychainName));
            this.codeSigningInfo = codeSign_1.createKeychain(keychainName, this.options.cscLink, this.options.cscKeyPassword, this.options.cscInstallerLink, this.options.cscInstallerKeyPassword, this.options.csaLink);
        } else {
            this.codeSigningInfo = bluebird_1.Promise.resolve(null);
        }
        this.resourceList = fs_extra_p_1.readdir(this.buildResourcesDir);
    }
    get platform() {
        return metadata_1.Platform.OSX;
    }
    get supportedTargets() {
        return ["dmg", "mas"];
    }
    pack(outDir, arch, postAsyncTasks) {
        return __awaiter(this, void 0, void 0, function* () {
            const packOptions = this.computePackOptions(outDir, arch);
            let nonMasPromise = null;
            if (this.targets.length > 1 || this.targets[0] !== "mas") {
                const appOutDir = this.computeAppOutDir(outDir, arch);
                nonMasPromise = this.doPack(packOptions, outDir, appOutDir, arch, this.customBuildOptions).then(() => this.sign(appOutDir, null)).then(() => postAsyncTasks.push(this.packageInDistributableFormat(outDir, appOutDir, arch)));
            }
            if (this.targets.indexOf("mas") !== -1) {
                // osx-sign - disable warning
                const appOutDir = path.join(outDir, `${ this.appName }-mas-${ arch }`);
                const masBuildOptions = deepAssign({}, this.customBuildOptions, this.devMetadata.build["mas"]);
                yield this.doPack(Object.assign({}, packOptions, { platform: "mas", "osx-sign": false }), outDir, appOutDir, arch, masBuildOptions);
                yield this.sign(appOutDir, masBuildOptions);
            }
            if (nonMasPromise != null) {
                yield nonMasPromise;
            }
        });
    }
    sign(appOutDir, masOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let codeSigningInfo = yield this.codeSigningInfo;
            if (codeSigningInfo == null) {
                codeSigningInfo = {
                    name: this.options.sign || process.env.CSC_NAME || this.customBuildOptions.identity,
                    installerName: this.options.sign || process.env.CSC_INSTALLER_NAME || (masOptions == null ? null : masOptions.identity)
                };
            }
            const identity = codeSigningInfo.name;
            if (identity == null) {
                const message = "App is not signed: CSC_LINK or CSC_NAME are not specified, see https://github.com/electron-userland/electron-builder/wiki/Code-Signing";
                if (masOptions != null) {
                    throw new Error(message);
                }
                util_1.warn(message);
                return;
            }
            util_1.log(`Signing app (identity: ${ identity })`);
            const baseSignOptions = {
                app: path.join(appOutDir, this.appName + ".app"),
                platform: masOptions == null ? "darwin" : "mas"
            };
            if (codeSigningInfo.keychainName != null) {
                baseSignOptions.keychain = codeSigningInfo.keychainName;
            }
            const signOptions = Object.assign({
                identity: identity
            }, this.devMetadata.build["osx-sign"], baseSignOptions);
            const resourceList = yield this.resourceList;
            const customSignOptions = masOptions || this.customBuildOptions;
            if (customSignOptions.entitlements != null) {
                signOptions.entitlements = customSignOptions.entitlements;
            } else {
                const p = `${ masOptions == null ? "osx" : "mas" }.entitlements`;
                if (resourceList.indexOf(p) !== -1) {
                    signOptions.entitlements = path.join(this.buildResourcesDir, p);
                }
            }
            if (customSignOptions.entitlementsInherit != null) {
                signOptions["entitlements-inherit"] = customSignOptions.entitlementsInherit;
            } else {
                const p = `${ masOptions == null ? "osx" : "mas" }.inherit.entitlements`;
                if (resourceList.indexOf(p) !== -1) {
                    signOptions["entitlements-inherit"] = path.join(this.buildResourcesDir, p);
                }
            }
            yield this.doSign(signOptions);
            if (masOptions != null) {
                const installerIdentity = codeSigningInfo.installerName;
                if (installerIdentity == null) {
                    throw new Error("Signing is required for mas builds but CSC_INSTALLER_LINK or CSC_INSTALLER_NAME are not specified");
                }
                const pkg = path.join(appOutDir, `${ this.appName }-${ this.metadata.version }.pkg`);
                yield this.doFlat(Object.assign({
                    pkg: pkg,
                    identity: installerIdentity
                }, baseSignOptions));
                this.dispatchArtifactCreated(pkg, `${ this.metadata.name }-${ this.metadata.version }.pkg`);
            }
        });
    }
    doSign(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return bluebird_1.Promise.promisify(electron_osx_sign_tf_1.sign)(opts);
        });
    }
    doFlat(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return bluebird_1.Promise.promisify(electron_osx_sign_tf_1.flat)(opts);
        });
    }
    computeEffectiveDistOptions(appOutDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const specification = deepAssign({
                title: this.appName,
                icon: path.join(this.buildResourcesDir, "icon.icns"),
                "icon-size": 80,
                contents: [{
                    "x": 410, "y": 220, "type": "link", "path": "/Applications"
                }, {
                    "x": 130, "y": 220, "type": "file"
                }],
                format: this.devMetadata.build.compression === "store" ? "UDRO" : "UDBZ"
            }, this.customBuildOptions);
            if (!("background" in this.customBuildOptions)) {
                const background = path.join(this.buildResourcesDir, "background.png");
                const info = yield util_1.statOrNull(background);
                if (info != null && info.isFile()) {
                    specification.background = background;
                }
            }
            specification.contents[1].path = path.join(appOutDir, this.appName + ".app");
            return specification;
        });
    }
    packageInDistributableFormat(outDir, appOutDir, arch) {
        const promises = [];
        if (this.targets.indexOf("dmg") !== -1 || this.targets.indexOf("default") !== -1) {
            const artifactPath = path.join(appOutDir, `${ this.appName }-${ this.metadata.version }.dmg`);
            promises.push(new bluebird_1.Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                util_1.log("Creating DMG");
                const dmgOptions = {
                    target: artifactPath,
                    basepath: this.projectDir,
                    specification: yield this.computeEffectiveDistOptions(appOutDir)
                };
                if (util_1.debug.enabled) {
                    util_1.debug(`appdmg: ${ JSON.stringify(dmgOptions, null, 2) }`);
                }
                const emitter = require("appdmg")(dmgOptions);
                emitter.on("error", reject);
                emitter.on("finish", () => resolve());
                if (util_1.debug.enabled) {
                    emitter.on("progress", info => {
                        if (info.type === "step-begin") {
                            util_1.debug(`appdmg: [${ info.current }] ${ info.title }`);
                        }
                    });
                }
            })).then(() => this.dispatchArtifactCreated(artifactPath, `${ this.metadata.name }-${ this.metadata.version }.dmg`)));
        }
        for (let target of this.targets) {
            if (target !== "mas" && target !== "dmg") {
                const format = target === "default" ? "zip" : target;
                util_1.log("Creating OS X " + format);
                // for default we use mac to be compatible with Squirrel.Mac
                const classifier = target === "default" ? "mac" : "osx";
                // we use app name here - see https://github.com/electron-userland/electron-builder/pull/204
                const outFile = path.join(appOutDir, `${ this.appName }-${ this.metadata.version }-${ classifier }.${ format }`);
                promises.push(this.archiveApp(format, appOutDir, outFile).then(() => this.dispatchArtifactCreated(outFile, `${ this.metadata.name }-${ this.metadata.version }-${ classifier }.${ format }`)));
            }
        }
        return bluebird_1.Promise.all(promises);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OsXPackager;
//# sourceMappingURL=osxPackager.js.map