import { promises as fs } from 'fs';
import { stat, lstat } from 'fs/promises';
import { join, resolve } from 'path';

/**
 * Recursively copy everything from src to dst.
 * If dst does not exist, it will be created.
 * Existing files in dst will be overwritten.
 *
 * @param src  Source path (absolute or relative)
 * @param dst  Destination path (absolute or relative)
 */
async function copyDir(src: string, dst: string): Promise<void> {
  // Ensure absolute paths for reliability
  src = resolve(src);
  dst = resolve(dst);

  // Create destination directory if it doesn't exist
  await fs.mkdir(dst, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const dstPath = join(dst, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectory
      await copyDir(srcPath, dstPath);
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      // Copy file or symlink
      // copyFile preserves symlinks as-is and also copies file permissions on Unix
      await fs.copyFile(srcPath, dstPath);
    }
    // Other types (FIFO, socket, etc.) are ignored by default
  }
}

// Example usage:
await copyDir('./src', './dst');