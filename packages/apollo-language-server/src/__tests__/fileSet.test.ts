import { FileSet } from "../fileSet";
import URI from "vscode-uri";

describe("fileSet", () => {
  describe("includesFile", () => {
    it("matches includes starting with ./", () => {
      const fileSet = new FileSet({
        excludes: [],
        includes: ["./src/**/*.tsx"],
        rootURI: URI.parse("/project")
      });
      const file = "file:///project/src/Component.tsx";
      expect(fileSet.includesFile(file)).toBe(true);
    });

    it("matches includes not starting with ./", () => {
      const fileSet = new FileSet({
        excludes: [],
        includes: ["src/**/*.tsx"],
        rootURI: URI.parse("/project")
      });
      const file = "file:///project/src/Component.tsx";
      expect(fileSet.includesFile(file)).toBe(true);
    });

    it("does not match excludes starting with ./", () => {
      const fileSet = new FileSet({
        excludes: ["./src/Component.tsx"],
        includes: ["./src/**/*.tsx"],
        rootURI: URI.parse("/project")
      });
      const file = "file:///project/src/Component.tsx";
      expect(fileSet.includesFile(file)).toBe(false);
    });

    it("does not match excludes not starting with ./", () => {
      const fileSet = new FileSet({
        excludes: ["src/Component.tsx"],
        includes: ["src/**/*.tsx"],
        rootURI: URI.parse("/project")
      });
      const file = "file:///project/src/Component.tsx";
      expect(fileSet.includesFile(file)).toBe(false);
    });
  });
});
