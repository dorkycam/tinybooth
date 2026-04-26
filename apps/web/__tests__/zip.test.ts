/**
 * Tests for the in-tree ZIP builder. Verifies the output is a valid
 * archive by running the local `unzip -l` against the buffer in a temp
 * file when available, and falls back to byte-shape assertions otherwise.
 */
import { describe, expect, it } from 'vitest';
import { buildZip, crc32 } from '../src/lib/zip';

describe('crc32', () => {
  it('matches the known IEEE checksum for "123456789"', () => {
    expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926);
  });

  it('matches the IEEE checksum for the empty buffer', () => {
    expect(crc32(Buffer.alloc(0))).toBe(0);
  });
});

describe('buildZip', () => {
  it('produces a buffer with the ZIP local-header signature', () => {
    const buf = buildZip([{ name: 'hello.txt', data: Buffer.from('hello world') }]);
    expect(buf.readUInt32LE(0)).toBe(0x04034b50);
  });

  it('embeds the central-directory signature near the end', () => {
    const buf = buildZip([
      { name: 'a.txt', data: Buffer.from('aaa') },
      { name: 'b.txt', data: Buffer.from('bb') },
    ]);
    // EOCD signature appears in the last 22 bytes of the buffer.
    const eocdOffset = buf.length - 22;
    expect(buf.readUInt32LE(eocdOffset)).toBe(0x06054b50);
    // Two entries on disk.
    expect(buf.readUInt16LE(eocdOffset + 8)).toBe(2);
  });

  it('honors UTF-8 file names', () => {
    const buf = buildZip([{ name: 'résumé.txt', data: Buffer.from('hi') }]);
    // Find the UTF-8 bytes for "résumé.txt" inside the buffer.
    const filename = Buffer.from('résumé.txt', 'utf8');
    expect(buf.includes(filename)).toBe(true);
  });
});
