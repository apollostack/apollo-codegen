import * as path from "path";
import * as fs from "fs";
import * as ci from "env-ci";
import { gitToJs } from "git-parse";
import * as git from "git-rev-sync";

const findGitRoot = start => {
  start = start || module.parent.filename;
  if (typeof start === "string") {
    if (start[start.length - 1] !== path.sep) start += path.sep;
    start = start.split(path.sep);
  }
  if (!start.length) throw new Error(".git/ not found in path");
  start.pop();
  const dir = start.join(path.sep);
  if (fs.existsSync(path.join(dir, ".git"))) {
    return path.normalize(dir);
  } else {
    return findGitRoot(start);
  }
};

export const gitInfo = async path => {
  const { isCi, commit, slug, root } = ci();
  const gitLoc = root ? root : findGitRoot();

  const { authorName, authorEmail } = await gitToJs(gitLoc)
    .then(
      commits =>
        commits && commits.length > 0
          ? commits[0]
          : { authorName: null, authorEmail: null }
    )
    .catch(() => ({ authorEmail: null, authorName: null }));

  const committer = `${authorName || ""} ${
    authorEmail ? `<${authorEmail}>` : ""
  }`.trim();

  const remoteUrl = isCi ? slug : git.remoteUrl();
  return { committer, commit, remoteUrl };
};
