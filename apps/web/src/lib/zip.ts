/**
 * Minimal ZIP builder.
 *
 * Pure Node, no external deps. Produces a valid PKZIP archive in "store"
 * (uncompressed) mode. Sufficient for the bulk-export job since the source
 * photos are already WebP and would not benefit from deflate.
 *
 * Implements only what we need: 32-bit headers, store-only, no extra fields.
 * If a real archiver dependency lands later we can drop this in one diff.
 *
 * References:
 * - ZIP appnote.txt section 4 (Local file header, Central directory).
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

/**
 * CRC-32 (IEEE) over a buffer. Matches the polynomial used by ZIP.
 *
 * @param buf Bytes to hash.
 * @returns Unsigned 32-bit CRC.
 */
export function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = (CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8)) >>> 0;
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** A single file to embed in the archive. */
export interface ZipEntry {
  /** File name with forward slashes; no leading slash. */
  name: string;
  /** Raw file bytes. */
  data: Buffer;
}

/**
 * Build a ZIP archive containing the given entries. Returns the full buffer.
 *
 * @param entries Files to include.
 * @returns The archive bytes.
 */
export function buildZip(entries: ZipEntry[]): Buffer {
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  const offsets: number[] = [];
  let runningOffset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const data = entry.data;
    const crc = crc32(data);
    const size = data.length;

    // Local file header (30 bytes + name + data).
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // general purpose bit flag (UTF-8 names)
    local.writeUInt16LE(0, 8); // compression method (store)
    local.writeUInt16LE(0, 10); // file mod time
    local.writeUInt16LE(0, 12); // file mod date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(size, 18); // compressed size
    local.writeUInt32LE(size, 22); // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28); // extra field length

    offsets.push(runningOffset);
    localChunks.push(local, nameBuf, data);
    runningOffset += local.length + nameBuf.length + data.length;

    // Central directory header (46 bytes + name).
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0x0800, 8); // general purpose bit flag
    central.writeUInt16LE(0, 10); // compression method
    central.writeUInt16LE(0, 12); // mod time
    central.writeUInt16LE(0, 14); // mod date
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(size, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk #
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offsets[offsets.length - 1]!, 42); // local header offset
    centralChunks.push(central, nameBuf);
  }

  const central = Buffer.concat(centralChunks);
  const centralOffset = runningOffset;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4); // disk #
  eocd.writeUInt16LE(0, 6); // disk where central dir starts
  eocd.writeUInt16LE(entries.length, 8); // entries on this disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(central.length, 12); // central dir size
  eocd.writeUInt32LE(centralOffset, 16); // central dir offset
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localChunks, central, eocd]);
}
