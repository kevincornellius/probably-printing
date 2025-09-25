// lib/constants.ts

// Allowed extensions for code uploads
export const CODE_FILE_EXTENSIONS = [
  ".c",
  ".cpp",
  ".cs",
  ".d",
  ".fs",
  ".go",
  ".hs",
  ".java",
  ".kt",
  ".ml",
  ".pas",
  ".pl",
  ".php",
  ".py",
  ".rb",
  ".rs",
  ".scala",
  ".js",
];

// Turn into a string for <input accept="">
export const CODE_FILE_ACCEPT = CODE_FILE_EXTENSIONS.join(",");
export const ALLOW_ALL_EXTENSIONS=process.env.ALLOW_ALL_EXTENSIONS === 'true';

// File size limit (bytes) → 2 MB
export const CODE_FILE_MAX_SIZE = 2 * 1024 * 1024;
