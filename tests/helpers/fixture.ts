import path from "node:path";
import fs from "fs-extra";

export function fixturePath(name: string) {
  return path.resolve("tests/fixtures", name);
}

export async function cleanDist(fixture: string) {
  await fs.remove(path.join(fixturePath(fixture), "dist"));
}

export async function readDist(fixture: string, file: string) {
  return fs.readFile(
    path.join(fixturePath(fixture), "dist", file),
    "utf8"
  );
}

export async function distExists(fixture: string, file: string) {
  return fs.pathExists(path.join(fixturePath(fixture), "dist", file));
}