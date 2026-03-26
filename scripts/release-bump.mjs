#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();
const packageJsonPath = path.join(cwd, "package.json");
const lockfilePath = path.join(cwd, "pnpm-lock.yaml");
const isWindows = process.platform === "win32";

function resolveCommand(command) {
  if (!isWindows) {
    return command;
  }

  if (command === "pnpm") {
    return "pnpm.cmd";
  }

  if (command === "npm") {
    return "npm.cmd";
  }

  if (command === "npx") {
    return "npx.cmd";
  }

  return command;
}

function run(command, args, options = {}) {
  return execFileSync(resolveCommand(command), args, {
    cwd,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  }).trim();
}

function runInherit(command, args) {
  execFileSync(resolveCommand(command), args, { cwd, stdio: "inherit" });
}

function fail(message) {
  console.error(`\n[release:bump] ${message}\n`);
  process.exit(1);
}

function info(message) {
  console.log(`[release:bump] ${message}`);
}

function showHelp() {
  console.log(`
Usage:
  pnpm release:bump [--patch|--minor|--major|--version X.Y.Z] [--skip-checks]

Options:
  --patch          Bump patch version (default when no bump flag is provided)
  --minor          Bump minor version
  --major          Bump major version
  --version X.Y.Z  Set an explicit semver version
  --skip-checks    Skip git/status/build safety checks (emergency only)
  --help           Show this help message

Examples:
  pnpm release:bump --patch
  pnpm release:bump --minor
  pnpm release:bump --version 1.4.0
  pnpm release:bump --patch --skip-checks
`.trim());
}

function parseArgs(argv) {
  const args = {
    bump: "patch",
    explicitVersion: null,
    skipChecks: false,
  };

  const bumpFlags = new Set();

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--help" || token === "-h") {
      showHelp();
      process.exit(0);
    }

    if (token === "--skip-checks") {
      args.skipChecks = true;
      continue;
    }

    if (token === "--patch" || token === "--minor" || token === "--major") {
      bumpFlags.add(token);
      args.bump = token.slice(2);
      continue;
    }

    if (token === "--version") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        fail("Missing value for --version. Expected X.Y.Z.");
      }
      args.explicitVersion = next;
      i += 1;
      continue;
    }

    fail(`Unknown argument: ${token}`);
  }

  if (bumpFlags.size > 1) {
    fail("Use only one bump flag at a time (--patch, --minor, or --major).");
  }

  if (args.explicitVersion && bumpFlags.size > 0) {
    fail("Do not combine --version with --patch/--minor/--major.");
  }

  return args;
}

function isSemver(value) {
  return /^\d+\.\d+\.\d+$/.test(value);
}

function bumpSemver(current, bump) {
  const [major, minor, patch] = current.split(".").map((part) => Number.parseInt(part, 10));
  if (![major, minor, patch].every(Number.isFinite)) {
    fail(`Current package version is not valid semver: ${current}`);
  }

  if (bump === "major") {
    return `${major + 1}.0.0`;
  }

  if (bump === "minor") {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
}

function ensureRepoIsSafe() {
  const dirty = run("git", ["status", "--porcelain"]);
  if (dirty.length > 0) {
    fail("Git worktree is dirty. Commit/stash changes before running release:bump.");
  }

  const upstream = run("git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
  if (!upstream) {
    fail("No upstream branch configured. Set upstream before running release:bump.");
  }

  run("git", ["fetch", "--quiet"]);

  const counts = run("git", ["rev-list", "--left-right", "--count", `${upstream}...HEAD`]);
  const [behindRaw, aheadRaw] = counts.split(/\s+/);
  const behind = Number.parseInt(behindRaw, 10);
  const ahead = Number.parseInt(aheadRaw, 10);

  if (!Number.isFinite(behind) || !Number.isFinite(ahead)) {
    fail(`Unable to parse ahead/behind status from git: ${counts}`);
  }

  if (behind > 0 || ahead > 0) {
    fail(`Branch is not in sync with upstream (${upstream}). Behind=${behind}, Ahead=${ahead}.`);
  }

  info("Running safety checks: pnpm typecheck, pnpm build, npm pack --dry-run");
  runInherit("pnpm", ["typecheck"]);
  runInherit("pnpm", ["build"]);
  runInherit("npm", ["pack", "--dry-run"]);
}

function readPackageJson() {
  if (!existsSync(packageJsonPath)) {
    fail("package.json not found.");
  }

  const content = readFileSync(packageJsonPath, "utf8");
  return JSON.parse(content);
}

function writePackageJson(pkg) {
  writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

function ensureTagDoesNotExist(tagName) {
  try {
    run("git", ["rev-parse", "-q", "--verify", `refs/tags/${tagName}`]);
    fail(`Tag ${tagName} already exists.`);
  } catch {
    // Tag does not exist; expected path.
  }
}

function stageVersionFiles() {
  const filesToAdd = ["package.json"];

  if (existsSync(lockfilePath)) {
    const changed = run("git", ["status", "--porcelain", "pnpm-lock.yaml"]);
    if (changed.length > 0) {
      filesToAdd.push("pnpm-lock.yaml");
    }
  }

  runInherit("git", ["add", ...filesToAdd]);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const pkg = readPackageJson();
  const currentVersion = pkg.version;

  if (!isSemver(currentVersion)) {
    fail(`Current package version is not plain semver: ${currentVersion}`);
  }

  let nextVersion;
  if (args.explicitVersion) {
    if (!isSemver(args.explicitVersion)) {
      fail(`Invalid --version value: ${args.explicitVersion}. Expected X.Y.Z.`);
    }
    nextVersion = args.explicitVersion;
  } else {
    nextVersion = bumpSemver(currentVersion, args.bump);
  }

  if (nextVersion === currentVersion) {
    fail(`Next version matches current version (${currentVersion}).`);
  }

  const tagName = `v${nextVersion}`;
  ensureTagDoesNotExist(tagName);

  if (!args.skipChecks) {
    ensureRepoIsSafe();
  } else {
    info("Skipping safety checks due to --skip-checks.");
  }

  pkg.version = nextVersion;
  writePackageJson(pkg);
  info(`Updated package.json version: ${currentVersion} -> ${nextVersion}`);

  stageVersionFiles();

  const commitMessage = `chore(release): ${tagName}`;
  runInherit("git", ["commit", "-m", commitMessage]);
  runInherit("git", ["tag", "-a", tagName, "-m", tagName]);

  console.log(`
[release:bump] Release bump complete.

Next steps:
  1) Review the commit and tag:
     git show --stat
     git tag -n | findstr ${tagName}
  2) Publish package:
     pnpm release:publish
  3) Push commit and tag:
     git push
     git push --tags
`.trim());
}

main();
