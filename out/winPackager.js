"use strict";

const codeSign_1 = require("./codeSign");
const bluebird_1 = require("bluebird");
const platformPackager_1 = require("./platformPackager");
const metadata_1 = require("./metadata");
const path = require("path");
const util_1 = require("./util");
const fs_extra_p_1 = require("fs-extra-p");
const signcode_tf_1 = require("signcode-tf");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./awaiter");
class WinPackager extends platformPackager_1.PlatformPackager {
    constructor(info, cleanupTasks) {
        super(info);
        if (this.options.cscLink != null && this.options.cscKeyPassword != null) {
            this.certFilePromise = codeSign_1.downloadCertificate(this.options.cscLink).then(path => {
                cleanupTasks.push(() => fs_extra_p_1.deleteFile(path, true));
                return path;
            });
        } else {
            this.certFilePromise = bluebird_1.Promise.resolve(null);
        }
        this.iconPath = this.getValidIconPath();
        if (this.options.dist && this.customBuildOptions.loadingGif == null) {
            const installSpinnerPath = path.join(this.buildResourcesDir, "install-spinner.gif");
            this.loadingGifStat = util_1.statOrNull(installSpinnerPath).then(it => it != null && !it.isDirectory() ? installSpinnerPath : null);
        }
    }
    get platform() {
        return metadata_1.Platform.WINDOWS;
    }
    get supportedTargets() {
        return [];
    }
    getValidIconPath() {
        return __awaiter(this, void 0, void 0, function* () {
            const iconPath = path.join(this.buildResourcesDir, "icon.ico");
            yield checkIcon(iconPath);
            return iconPath;
        });
    }
    pack(outDir, arch, postAsyncTasks) {
        return __awaiter(this, void 0, void 0, function* () {
            if (arch === "ia32") {
                util_1.warn("For windows consider only distributing 64-bit, see https://github.com/electron-userland/electron-builder/issues/359#issuecomment-214851130");
            }
            // we must check icon before pack because electron-packager uses icon and it leads to cryptic error message "spawn wine ENOENT"
            yield this.iconPath;
            let appOutDir = this.computeAppOutDir(outDir, arch);
            const packOptions = this.computePackOptions(outDir, arch);
            if (!this.options.dist) {
                yield this.doPack(packOptions, outDir, appOutDir, arch, this.customBuildOptions);
                return;
            }
            const unpackedDir = path.join(outDir, `win${ arch === "x64" ? "" : `-${ arch }` }-unpacked`);
            const finalAppOut = path.join(unpackedDir, "lib", "net45");
            const installerOut = computeDistOut(outDir, arch);
            util_1.log("Removing %s and %s", path.relative(this.projectDir, installerOut), path.relative(this.projectDir, unpackedDir));
            yield bluebird_1.Promise.all([this.packApp(packOptions, appOutDir), fs_extra_p_1.emptyDir(installerOut), fs_extra_p_1.emptyDir(unpackedDir)]);
            yield fs_extra_p_1.move(appOutDir, finalAppOut);
            appOutDir = finalAppOut;
            yield this.copyExtraResources(appOutDir, arch, this.customBuildOptions);
            if (this.options.dist) {
                postAsyncTasks.push(this.packageInDistributableFormat(outDir, appOutDir, arch, packOptions));
            }
        });
    }
    packApp(options, appOutDir) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            yield _super("packApp").call(this, options, appOutDir);
            if (process.platform !== "linux" && this.options.cscLink != null && this.options.cscKeyPassword != null) {
                const filename = this.appName + ".exe";
                util_1.log(`Signing ${ filename }`);
                yield bluebird_1.Promise.promisify(signcode_tf_1.sign)({
                    path: path.join(appOutDir, filename),
                    cert: yield this.certFilePromise,
                    password: this.options.cscKeyPassword,
                    name: this.appName,
                    site: yield this.computePackageUrl(),
                    overwrite: true
                });
            }
        });
    }
    computeEffectiveDistOptions(appOutDir, installerOutDir, packOptions, setupExeName) {
        return __awaiter(this, void 0, void 0, function* () {
            let iconUrl = this.customBuildOptions.iconUrl || this.devMetadata.build.iconUrl;
            if (iconUrl == null) {
                if (this.info.repositoryInfo != null) {
                    const info = yield this.info.repositoryInfo.getInfo(this);
                    if (info != null) {
                        iconUrl = `https://github.com/${ info.user }/${ info.project }/blob/master/${ this.relativeBuildResourcesDirname }/icon.ico?raw=true`;
                    }
                }
                if (iconUrl == null) {
                    throw new Error("iconUrl is not specified, please see https://github.com/electron-userland/electron-builder/wiki/Options#WinBuildOptions-iconUrl");
                }
            }
            checkConflictingOptions(this.customBuildOptions);
            const projectUrl = yield this.computePackageUrl();
            const rceditOptions = {
                "version-string": packOptions["version-string"],
                "file-version": packOptions["build-version"],
                "product-version": packOptions["app-version"]
            };
            rceditOptions["version-string"].LegalCopyright = packOptions["app-copyright"];
            const options = Object.assign({
                name: this.metadata.name,
                productName: this.appName,
                exe: this.appName + ".exe",
                setupExe: setupExeName,
                title: this.appName,
                appDirectory: appOutDir,
                outputDirectory: installerOutDir,
                version: this.metadata.version,
                description: platformPackager_1.smarten(this.metadata.description),
                authors: this.metadata.author.name,
                iconUrl: iconUrl,
                setupIcon: yield this.iconPath,
                certificateFile: yield this.certFilePromise,
                certificatePassword: this.options.cscKeyPassword,
                fixUpPaths: false,
                skipUpdateIcon: true,
                usePackageJson: false,
                msi: false,
                extraMetadataSpecs: projectUrl == null ? null : `\n    <projectUrl>${ projectUrl }</projectUrl>`,
                copyright: packOptions["app-copyright"],
                sign: {
                    name: this.appName,
                    site: projectUrl,
                    overwrite: true
                },
                rcedit: rceditOptions
            }, this.customBuildOptions);
            if (this.loadingGifStat != null) {
                options.loadingGif = yield this.loadingGifStat;
            }
            return options;
        });
    }
    packageInDistributableFormat(outDir, appOutDir, arch, packOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const installerOutDir = computeDistOut(outDir, arch);
            const winstaller = require("electron-winstaller-fixed");
            const version = this.metadata.version;
            const archSuffix = arch === "x64" ? "" : "-" + arch;
            const setupExeName = `${ this.appName } Setup ${ version }${ archSuffix }.exe`;
            const distOptions = yield this.computeEffectiveDistOptions(appOutDir, installerOutDir, packOptions, setupExeName);
            yield winstaller.createWindowsInstaller(distOptions);
            this.dispatchArtifactCreated(path.join(installerOutDir, setupExeName), `${ this.metadata.name }-Setup-${ version }${ archSuffix }.exe`);
            const packagePrefix = `${ this.metadata.name }-${ winstaller.convertVersion(version) }-`;
            this.dispatchArtifactCreated(path.join(installerOutDir, `${ packagePrefix }full.nupkg`));
            if (distOptions.remoteReleases != null) {
                this.dispatchArtifactCreated(path.join(installerOutDir, `${ packagePrefix }delta.nupkg`));
            }
            this.dispatchArtifactCreated(path.join(installerOutDir, "RELEASES"));
        });
    }
}
exports.WinPackager = WinPackager;
function checkIcon(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const fd = yield fs_extra_p_1.open(file, "r");
        const buffer = new Buffer(512);
        try {
            yield fs_extra_p_1.read(fd, buffer, 0, buffer.length, 0);
        } finally {
            yield fs_extra_p_1.close(fd);
        }
        if (!isIco(buffer)) {
            throw new Error(`Windows icon is not valid ico file, please fix "${ file }"`);
        }
        const sizes = parseIco(buffer);
        for (let size of sizes) {
            if (size.w >= 256 && size.h >= 256) {
                return;
            }
        }
        throw new Error(`Windows icon size must be at least 256x256, please fix "${ file }"`);
    });
}
function parseIco(buffer) {
    if (!isIco(buffer)) {
        throw new Error("buffer is not ico");
    }
    const n = buffer.readUInt16LE(4);
    const result = new Array(n);
    for (let i = 0; i < n; i++) {
        result[i] = {
            w: buffer.readUInt8(6 + i * 16) || 256,
            h: buffer.readUInt8(7 + i * 16) || 256
        };
    }
    return result;
}
function isIco(buffer) {
    return buffer.readUInt16LE(0) === 0 && buffer.readUInt16LE(2) === 1;
}
function computeDistOut(outDir, arch) {
    return path.join(outDir, `win${ platformPackager_1.archSuffix(arch) }`);
}
exports.computeDistOut = computeDistOut;
function checkConflictingOptions(options) {
    for (let name of ["outputDirectory", "appDirectory", "exe", "fixUpPaths", "usePackageJson", "extraFileSpecs", "extraMetadataSpecs", "skipUpdateIcon", "setupExe"]) {
        if (name in options) {
            throw new Error(`Option ${ name } is ignored, do not specify it.`);
        }
    }
    if ("noMsi" in options) {
        util_1.warn(`noMsi is deprecated, please specify as "msi": true if you want to create an MSI installer`);
        options.msi = !options.noMsi;
    }
    const msi = options.msi;
    if (msi != null && typeof msi !== "boolean") {
        throw new Error(`msi expected to be boolean value, but string '"${ msi }"' was specified`);
    }
}
//# sourceMappingURL=winPackager.js.map