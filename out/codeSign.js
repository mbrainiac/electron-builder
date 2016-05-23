"use strict";

const util_1 = require("./util");
const fs_extra_p_1 = require("fs-extra-p");
const httpRequest_1 = require("./httpRequest");
const os_1 = require("os");
const path = require("path");
const promise_1 = require("./promise");
const bluebird_1 = require("bluebird");
const crypto_1 = require("crypto");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./awaiter");
function randomString() {
    return crypto_1.randomBytes(8).toString("hex");
}
function generateKeychainName() {
    return "csc-" + randomString() + ".keychain";
}
exports.generateKeychainName = generateKeychainName;
function downloadUrlOrBase64(urlOrBase64, destination) {
    if (urlOrBase64.startsWith("https://")) {
        return httpRequest_1.download(urlOrBase64, destination);
    } else {
        return fs_extra_p_1.outputFile(destination, new Buffer(urlOrBase64, "base64"));
    }
}
function createKeychain(keychainName, cscLink, cscKeyPassword, cscILink, cscIKeyPassword, csaLink) {
    const certLinks = csaLink == null ? [] : [csaLink];
    certLinks.push(cscLink);
    if (cscILink != null) {
        certLinks.push(cscILink);
    }
    const certPaths = certLinks.map(it => path.join(os_1.tmpdir(), randomString() + (it.endsWith(".cer") ? ".cer" : ".p12")));
    const keychainPassword = randomString();
    return promise_1.executeFinally(bluebird_1.Promise.all([bluebird_1.Promise.map(certPaths, (p, i) => downloadUrlOrBase64(certLinks[i], p)), bluebird_1.Promise.mapSeries([["create-keychain", "-p", keychainPassword, keychainName], ["unlock-keychain", "-p", keychainPassword, keychainName], ["set-keychain-settings", "-t", "3600", "-u", keychainName]], it => util_1.exec("security", it))]).then(() => importCerts(keychainName, certPaths, [cscKeyPassword, cscIKeyPassword].filter(it => it != null), csaLink == null)), errorOccurred => {
        const tasks = certPaths.map(it => fs_extra_p_1.deleteFile(it, true));
        if (errorOccurred) {
            tasks.push(deleteKeychain(keychainName));
        }
        return promise_1.all(tasks);
    });
}
exports.createKeychain = createKeychain;
function importCerts(keychainName, paths, keyPasswords, importBundledCerts) {
    return __awaiter(this, void 0, void 0, function* () {
        const certFiles = paths.slice(0, -keyPasswords.length);
        if (importBundledCerts) {
            const bundledCertsPath = path.join(__dirname, "..", "certs");
            certFiles.push(path.join(bundledCertsPath, "AppleWWDRCA.cer"), path.join(bundledCertsPath, "bundle.crt"));
        }
        for (let file of certFiles) {
            yield util_1.exec("security", ["import", file, "-k", keychainName, "-T", "/usr/bin/codesign"]);
        }
        const namePromises = [];
        for (let i = paths.length - keyPasswords.length, j = 0; i < paths.length; i++, j++) {
            const password = keyPasswords[j];
            const certPath = paths[i];
            yield util_1.exec("security", ["import", certPath, "-k", keychainName, "-T", "/usr/bin/codesign", "-T", "/usr/bin/productbuild", "-P", password]);
            namePromises.push(extractCommonName(password, certPath));
        }
        const names = yield bluebird_1.Promise.all(namePromises);
        return {
            name: names[0],
            installerName: names.length > 1 ? names[1] : null,
            keychainName: keychainName
        };
    });
}
function extractCommonName(password, certPath) {
    return util_1.exec("openssl", ["pkcs12", "-nokeys", "-nodes", "-passin", "pass:" + password, "-nomacver", "-clcerts", "-in", certPath]).then(result => {
        const match = result[0].toString().match(/^subject.*\/CN=([^\/\n]+)/m);
        if (match == null || match[1] == null) {
            throw new Error("Cannot extract common name from p12");
        } else {
            return match[1];
        }
    });
}
function sign(path, options) {
    const args = ["--deep", "--force", "--sign", options.name, path];
    if (options.keychainName != null) {
        args.push("--keychain", options.keychainName);
    }
    return util_1.exec("codesign", args);
}
exports.sign = sign;
function deleteKeychain(keychainName) {
    let ignoreNotFound = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

    const result = util_1.exec("security", ["delete-keychain", keychainName]);
    if (ignoreNotFound) {
        return result.catch(error => {
            if (!(error.message.indexOf("The specified keychain could not be found.") !== -1)) {
                throw error;
            }
        });
    } else {
        return result;
    }
}
exports.deleteKeychain = deleteKeychain;
function downloadCertificate(cscLink) {
    const certPath = path.join(os_1.tmpdir(), randomString() + ".p12");
    return downloadUrlOrBase64(cscLink, certPath).thenReturn(certPath);
}
exports.downloadCertificate = downloadCertificate;
//# sourceMappingURL=codeSign.js.map