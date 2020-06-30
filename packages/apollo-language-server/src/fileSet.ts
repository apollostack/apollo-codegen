import glob from "glob";
import { invariant } from "@apollographql/apollo-tools";
import URI from "vscode-uri";
import { normalizeURI } from "./utilities";
import chokidar from "chokidar";
import path from "path";

export class FileSet {
  private rootURI: URI;
  private includes: string[];
  private excludes: string[];
  private files: string[] = [];
  private watcher: chokidar.FSWatcher;
  private ready: boolean = false;

  constructor({
    rootURI,
    includes,
    excludes,
    configURI
  }: {
    rootURI: URI;
    includes: string[];
    excludes: string[];
    configURI?: URI;
  }) {
    invariant(rootURI, `Must provide "rootURI".`);
    invariant(includes, `Must provide "includes".`);
    invariant(excludes, `Must provide "excludes".`);

    this.rootURI = rootURI;
    this.includes = includes;
    this.excludes = excludes;

    this.watcher = chokidar.watch(includes, {
      cwd: rootURI.fsPath,
      ignored: excludes,
      ignoreInitial: true
    });

    const absRoot = path.resolve(rootURI.fsPath);
    function getFullPath(p: string) {
      return normalizeURI(path.join(absRoot, p));
    }

    this.watcher.on("add", p => this.files.push(getFullPath(p)));
    this.watcher.on("unlink", p => {
      const index = this.files.indexOf(getFullPath(p));
      if (index > -1) {
        this.files.splice(index, 1);
      }
    });
  }

  includesFile(filePath: string): boolean {
    return this.allFiles().includes(normalizeURI(filePath));
  }

  allFiles(): string[] {
    if (!this.ready) {
      this.globInitial();
      this.ready = true;
    }

    return this.files;
  }

  close() {
    this.watcher.close();
  }

  private globInitial() {
    // since glob.sync takes a single pattern, but we allow an array of `includes`, we can join all the
    // `includes` globs into a single pattern and pass to glob.sync. The `ignore` option does, however, allow
    // an array of globs to ignore, so we can pass it in directly
    const joinedIncludes = `{${this.includes.join(",")}}`;
    this.files = glob
      .sync(joinedIncludes, {
        cwd: this.rootURI.fsPath,
        absolute: true,
        ignore: this.excludes
      })
      .map(normalizeURI);
  }
}
