declare module 'electron-builder/out/awaiter' {
   var _default: (thisArg: any, _arguments: any, ignored: any, generator: Function) => any
  export = _default
}

declare module 'electron-builder/out/builder' {
  import { Packager } from "electron-builder/out/packager"
  import { PackagerOptions } from "electron-builder/out/platformPackager"
  import { PublishOptions, Publisher } from "electron-builder/out/gitHubPublisher"
  import { InfoRetriever } from "electron-builder/out/repositoryInfo"

  export function createPublisher(packager: Packager, options: BuildOptions, repoSlug: InfoRetriever, isPublishOptionGuessed?: boolean): Promise<Publisher | null>

  export interface BuildOptions extends PackagerOptions, PublishOptions {
  }

  export function build(originalOptions?: BuildOptions): Promise<void>
}

declare module 'electron-builder/out/codeSign' {
  import { Promise as BluebirdPromise } from "bluebird"

  export interface CodeSigningInfo {
    name: string
    keychainName?: string | null
    installerName?: string | null
  }

  export function generateKeychainName(): string

  export function createKeychain(keychainName: string, cscLink: string, cscKeyPassword: string, cscILink?: string | null, cscIKeyPassword?: string | null): Promise<CodeSigningInfo>

  export function sign(path: string, options: CodeSigningInfo): BluebirdPromise<any>

  export function deleteKeychain(keychainName: string, ignoreNotFound?: boolean): BluebirdPromise<any>

  export function downloadCertificate(cscLink: string): Promise<string>

  export function findIdentity(namePrefix: string, qualifier?: string): Promise<string | null>
}

declare module 'electron-builder/out/errorMessages' {
  export const buildIsMissed: string
  export const authorEmailIsMissed: string
  export const buildInAppSpecified: string
  export const nameInBuildSpecified: string
}

declare module 'electron-builder/out/fpmDownload' {
  
  export function downloadFpm(version: string, osAndArch: string): Promise<string>
}

declare module 'electron-builder/out/gitHubPublisher' {
  import { Release } from "gh-release"

  export interface Publisher {
    upload(file: string, artifactName?: string): Promise<any>
  }

  export interface PublishOptions {
    publish?: "onTag" | "onTagOrDraft" | "always" | "never" | null
    githubToken?: string | null
  }

  export class GitHubPublisher implements Publisher {
    readonly releasePromise: Promise<Release | null>
    constructor(owner: string, repo: string, version: string, token: string | null, createReleaseIfNotExists?: boolean)
    upload(file: string, artifactName?: string): Promise<void>
    deleteRelease(): Promise<void>
  }
}

declare module 'electron-builder/out/gitHubRequest' {
  import { RequestOptions } from "https"
  import { IncomingMessage, ClientRequest } from "http"
  import { Promise as BluebirdPromise } from "bluebird"

  export function gitHubRequest<T>(path: string, token: string | null, data?: {
    [name: string]: any
  } | null, method?: string): BluebirdPromise<T>

  export function doGitHubRequest<T>(options: RequestOptions, token: string | null, requestProcessor: (request: ClientRequest, reject: (error: Error) => void) => void): BluebirdPromise<T>

  export class HttpError extends Error {
    response: IncomingMessage
    description: any
    constructor(response: IncomingMessage, description?: any)
  }
}

declare module 'electron-builder/out/httpRequest' {
  import { ClientRequest } from "http"
  import { Promise as BluebirdPromise } from "bluebird"
  export const download: (url: string, destination: string, isCreateDir?: boolean | undefined) => BluebirdPromise<any>

  export function addTimeOutHandler(request: ClientRequest, callback: (error: Error) => void): void
}

declare module 'electron-builder' {
  export { Packager } from "electron-builder/out/packager"
  export { PackagerOptions, ArtifactCreated, DIR_TARGET } from "electron-builder/out/platformPackager"
  export { BuildOptions, build, createPublisher } from "electron-builder/out/builder"
  export { PublishOptions, Publisher } from "electron-builder/out/gitHubPublisher"
  export { AppMetadata, DevMetadata, Platform, getProductName, BuildMetadata, OsXBuildOptions, WinBuildOptions, LinuxBuildOptions } from "electron-builder/out/metadata"
}

declare module 'electron-builder/out/linuxPackager' {
  import { PlatformPackager, BuildInfo } from "electron-builder/out/platformPackager"
  import { Platform, LinuxBuildOptions } from "electron-builder/out/metadata"

  export class LinuxPackager extends PlatformPackager<LinuxBuildOptions> {
    constructor(info: BuildInfo, cleanupTasks: Array<() => Promise<any>>)
    protected readonly supportedTargets: Array<string>
    readonly platform: Platform
    pack(outDir: string, arch: string, postAsyncTasks: Array<Promise<any>>): Promise<any>
    protected packageInDistributableFormat(outDir: string, appOutDir: string, arch: string): Promise<any>
  }
}

declare module 'electron-builder/out/metadata' {
  import { ElectronPackagerOptions } from "electron-packager-tf"

  export interface Metadata {
    readonly repository?: string | RepositoryInfo | null
  }

  export interface AppMetadata extends Metadata {
    readonly version: string
    readonly name: string
    readonly productName?: string | null
    readonly description: string
    readonly main?: string | null
    readonly author: AuthorMetadata
    readonly homepage?: string | null
    readonly license?: string | null
  }

  export interface DevMetadata extends Metadata {
    readonly build: BuildMetadata
    readonly homepage?: string | null
    readonly license?: string | null
    readonly directories?: MetadataDirectories | null
  }

  export interface RepositoryInfo {
    readonly url: string
  }

  export interface AuthorMetadata {
    readonly name: string
    readonly email: string
  }

  export interface BuildMetadata {
    readonly "app-bundle-id"?: string | null
    readonly "app-category-type"?: string | null
    readonly asar?: boolean
    readonly iconUrl?: string | null
    readonly productName?: string | null
    /**
     A [glob expression](https://www.npmjs.com/package/glob#glob-primer), when specified, copy the file or directory with matching names directly into the app's resources directory (`Contents/Resources` for OS X, `resources` for Linux/Windows).
  
     You can use `${os}` (expanded to osx, linux or win according to current platform) and `${arch}` in the pattern.
  
     If directory matched, all contents are copied. So, you can just specify `foo` to copy `<project_dir>/foo` directory.
  
     May be specified in the platform options (i.e. in the `build.osx`).
     */
    readonly extraResources?: Array<string> | null
    /**
     The same as [extraResources](#BuildMetadata-extraResources) but copy into the app's content directory (`Contents` for OS X, `` for Linux/Windows).
     */
    readonly extraFiles?: Array<string> | null
    readonly osx?: OsXBuildOptions | null
    readonly mas?: MasBuildOptions | null
    /**
     See [.build.win](#LinuxBuildOptions).
     */
    readonly win?: WinBuildOptions | null
    readonly linux?: LinuxBuildOptions | null
    readonly compression?: "store" | "normal" | "maximum" | null
    readonly "build-version"?: string | null
    readonly afterPack?: (context: AfterPackContext) => Promise<any> | null
  }

  export interface AfterPackContext {
    readonly appOutDir: string
    readonly options: ElectronPackagerOptions
  }

  export interface OsXBuildOptions extends PlatformSpecificBuildOptions {
    readonly icon?: string | null
    readonly background?: string | null
    readonly target?: Array<string> | null
    readonly identity?: string | null
    readonly entitlements?: string | null
    readonly entitlementsInherit?: string | null
  }

  export interface MasBuildOptions extends OsXBuildOptions {
    readonly entitlements?: string | null
    readonly entitlementsInherit?: string | null
  }

  export interface WinBuildOptions extends PlatformSpecificBuildOptions {
    readonly certificateFile?: string
    readonly certificatePassword?: string
    readonly iconUrl?: string | null
    readonly loadingGif?: string | null
    readonly msi?: boolean
    readonly remoteReleases?: string | null
    readonly remoteToken?: string | null
    readonly signingHashAlgorithms?: Array<string> | null
    readonly signcodePath?: string | null
  }

  export interface LinuxBuildOptions extends PlatformSpecificBuildOptions {
    description?: string | null
    synopsis?: string | null
    maintainer?: string | null
    vendor?: string | null
    fpm?: Array<string> | null
    desktop?: string | null
    afterInstall?: string | null
    afterRemove?: string | null
    readonly compression?: string | null
    readonly depends?: string[] | null
    readonly target?: Array<string> | null
  }

  export interface MetadataDirectories {
    readonly buildResources?: string | null
    readonly output?: string | null
    readonly app?: string | null
  }

  export interface PlatformSpecificBuildOptions {
    readonly extraFiles?: Array<string> | null
    readonly extraResources?: Array<string> | null
    readonly target?: Array<string> | null
  }

  export class Platform {
    name: string
    buildConfigurationKey: string
    nodeName: string
    static OSX: Platform
    static LINUX: Platform
    static WINDOWS: Platform
    constructor(name: string, buildConfigurationKey: string, nodeName: string)
    toString(): string
    static fromString(name: string): Platform
  }

  export function getProductName(metadata: AppMetadata, devMetadata: DevMetadata): string
}

declare module 'electron-builder/out/osxPackager' {
  import { PlatformPackager, BuildInfo } from "electron-builder/out/platformPackager"
  import { Platform, OsXBuildOptions } from "electron-builder/out/metadata"
  import { CodeSigningInfo } from "electron-builder/out/codeSign"
  import { SignOptions, FlatOptions } from "electron-osx-sign-tf"

  export default class OsXPackager extends PlatformPackager<OsXBuildOptions> {
    codeSigningInfo: Promise<CodeSigningInfo | null>
    constructor(info: BuildInfo, cleanupTasks: Array<() => Promise<any>>)
    readonly platform: Platform
    protected readonly supportedTargets: Array<string>
    pack(outDir: string, arch: string, postAsyncTasks: Array<Promise<any>>): Promise<any>
    protected doSign(opts: SignOptions): Promise<any>
    protected doFlat(opts: FlatOptions): Promise<any>
    protected computeEffectiveDistOptions(appOutDir: string): Promise<appdmg.Specification>
    packageInDistributableFormat(outDir: string, appOutDir: string, arch: string): Promise<any>
  }
}

declare module 'electron-builder/out/packager' {
  import { EventEmitter } from "events"
  import { InfoRetriever } from "electron-builder/out/repositoryInfo"
  import { AppMetadata, DevMetadata, Platform } from "electron-builder/out/metadata"
  import { PackagerOptions, BuildInfo, ArtifactCreated } from "electron-builder/out/platformPackager"

  export class Packager implements BuildInfo {
    options: PackagerOptions
    repositoryInfo: InfoRetriever | null
    readonly projectDir: string
    appDir: string
    metadata: AppMetadata
    devMetadata: DevMetadata
    electronVersion: string
    readonly eventEmitter: EventEmitter
    constructor(options: PackagerOptions, repositoryInfo?: InfoRetriever | null)
    artifactCreated(handler: (event: ArtifactCreated) => void): Packager
    readonly devPackageFile: string
    build(): Promise<any>
  }

  export function normalizeArchs(platform: Platform, arch?: string | n): string[]

  export function normalizePlatforms(rawPlatforms: Array<string | Platform> | string | Platform | n): Array<Platform>
}

declare module 'electron-builder/out/platformPackager' {
  import { InfoRetriever, ProjectMetadataProvider } from "electron-builder/out/repositoryInfo"
  import { AppMetadata, DevMetadata, Platform, PlatformSpecificBuildOptions } from "electron-builder/out/metadata"
  import EventEmitter = NodeJS.EventEmitter
  import { ElectronPackagerOptions } from "electron-packager-tf"
  import { Packager } from "electron-builder/out/packager"
  export const commonTargets: string[]
  export const DIR_TARGET: string

  export interface PackagerOptions {
    target?: Array<string> | null
    platform?: Array<Platform> | null
    arch?: string | null
    projectDir?: string | null
    cscLink?: string | null
    cscKeyPassword?: string | null
    cscInstallerLink?: string | null
    cscInstallerKeyPassword?: string | null
    platformPackagerFactory?: ((packager: Packager, platform: Platform, cleanupTasks: Array<() => Promise<any>>) => PlatformPackager<any>) | null
    /**
     * The same as [development package.json](https://github.com/electron-userland/electron-builder/wiki/Options#development-packagejson).
     *
     * Development `package.json` will be still read, but options specified in this object will override.
     */
    readonly devMetadata?: DevMetadata
    readonly npmRebuild?: boolean
  }

  export interface BuildInfo extends ProjectMetadataProvider {
    options: PackagerOptions
    devMetadata: DevMetadata
    projectDir: string
    appDir: string
    electronVersion: string
    repositoryInfo: InfoRetriever | n
    eventEmitter: EventEmitter
  }

  export abstract class PlatformPackager<DC extends PlatformSpecificBuildOptions> implements ProjectMetadataProvider {
    protected info: BuildInfo
    protected readonly options: PackagerOptions
    protected readonly projectDir: string
    protected readonly buildResourcesDir: string
    readonly metadata: AppMetadata
    readonly devMetadata: DevMetadata
    readonly customBuildOptions: DC
    readonly appName: string
    readonly targets: Array<string>
    readonly resourceList: Promise<Array<string>>
    readonly abstract platform: Platform
    constructor(info: BuildInfo)
    protected hasOnlyDirTarget(): boolean
    protected readonly relativeBuildResourcesDirname: string
    protected readonly abstract supportedTargets: Array<string>
    protected computeAppOutDir(outDir: string, arch: string): string
    protected dispatchArtifactCreated(file: string, artifactName?: string): void
    abstract pack(outDir: string, arch: string, postAsyncTasks: Array<Promise<any>>): Promise<any>
    protected doPack(options: ElectronPackagerOptions, outDir: string, appOutDir: string, arch: string, customBuildOptions: DC): Promise<void>
    protected computePackOptions(outDir: string, appOutDir: string, arch: string): ElectronPackagerOptions
    protected packApp(options: ElectronPackagerOptions, appOutDir: string): Promise<any>
    protected copyExtraFiles(appOutDir: string, arch: string, customBuildOptions: DC): Promise<any>
    protected computePackageUrl(): Promise<string | null>
    protected computeBuildNumber(): string | null
    protected archiveApp(format: string, appOutDir: string, outFile: string): Promise<any>
  }

  export function archSuffix(arch: string): string

  export interface ArtifactCreated {
    readonly file: string
    readonly artifactName?: string
    readonly platform: Platform
  }

  export function normalizeTargets(targets: Array<string> | string | null | undefined): Array<string> | null

  export function smarten(s: string): string
}

declare module 'electron-builder/out/promise' {
  import { Promise as BluebirdPromise } from "bluebird"

  export function printErrorAndExit(error: Error): void

  export function executeFinally(promise: Promise<any>, task: (errorOccurred: boolean) => Promise<any>): Promise<any>

  export class NestedError extends Error {
    constructor(errors: Array<Error>, message?: string)
  }

  export function all(promises: Array<Promise<any>>): BluebirdPromise<any>
}

declare module 'electron-builder/out/repositoryInfo' {
  import { Info } from "hosted-git-info"
  import { AppMetadata, Metadata } from "electron-builder/out/metadata"

  export interface ProjectMetadataProvider {
    metadata: AppMetadata
    devMetadata: Metadata
  }

  export interface RepositorySlug {
    user: string
    project: string
  }

  export class InfoRetriever {
    _info: Promise<Info> | null
    getInfo(provider?: ProjectMetadataProvider): Promise<Info | null>
  }
}

declare module 'electron-builder/out/util' {
  import { ChildProcess, SpawnOptions } from "child_process"
  import { Promise as BluebirdPromise } from "bluebird"
  import { Stats } from "fs-extra-p"
  import { Debugger } from "~debug/node"
  export const log: (message?: any, ...optionalParams: any[]) => void
  export const debug: Debugger
  export const debug7z: Debugger

  export function warn(message: string): void
  export const readPackageJson: (arg1: string) => BluebirdPromise<any>

  export function installDependencies(appDir: string, electronVersion: string, arch?: string, command?: string): BluebirdPromise<any>

  export interface BaseExecOptions {
    cwd?: string
    env?: any
    stdio?: any
  }

  export interface ExecOptions extends BaseExecOptions {
    customFds?: any
    encoding?: string
    timeout?: number
    maxBuffer?: number
    killSignal?: string
  }

  export function exec(file: string, args?: Array<string> | null, options?: ExecOptions): BluebirdPromise<string>

  export function doSpawn(command: string, args: Array<string>, options?: SpawnOptions): ChildProcess

  export function spawn(command: string, args?: Array<string> | null, options?: SpawnOptions): BluebirdPromise<any>

  export function handleProcess(event: string, childProcess: ChildProcess, command: string, resolve: ((value?: any) => void) | null, reject: (reason?: any) => void): void

  export function getElectronVersion(packageData: any, packageJsonPath: string): Promise<string>

  export function statOrNull(file: string): Promise<Stats | null>

  export function computeDefaultAppDirectory(projectDir: string, userAppDir: string | null | undefined): Promise<string>

  export function use<T, R>(value: T | null, task: (it: T) => R): R | null

  export function debug7zArgs(command: "a" | "x"): Array<string>

  export function getTempName(prefix?: string | n): string
}

declare module 'electron-builder/out/winPackager' {
  import { PlatformPackager, BuildInfo } from "electron-builder/out/platformPackager"
  import { Platform, WinBuildOptions } from "electron-builder/out/metadata"
  import { ElectronPackagerOptions } from "electron-packager-tf"

  export class WinPackager extends PlatformPackager<WinBuildOptions> {
    certFilePromise: Promise<string | null>
    readonly iconPath: Promise<string>
    constructor(info: BuildInfo, cleanupTasks: Array<() => Promise<any>>)
    readonly platform: Platform
    protected readonly supportedTargets: Array<string>
    pack(outDir: string, arch: string, postAsyncTasks: Array<Promise<any>>): Promise<any>
    protected computeAppOutDir(outDir: string, arch: string): string
    protected packApp(options: any, appOutDir: string): Promise<void>
    protected computeEffectiveDistOptions(appOutDir: string, installerOutDir: string, packOptions: ElectronPackagerOptions, setupExeName: string): Promise<WinBuildOptions>
    protected packageInDistributableFormat(appOutDir: string, installerOutDir: string, arch: string, packOptions: ElectronPackagerOptions): Promise<any>
  }

  export function computeDistOut(outDir: string, arch: string): string
}

