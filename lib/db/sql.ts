/** Escapes LIKE wildcards so user input matches literally (default escape char is `\`). */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
