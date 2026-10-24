/* ============================================================================
 * VesselLoader — One-Click Vessel Loader (LOCAL DRAFT, not deployed)
 * ----------------------------------------------------------------------------
 * Takes the bundle the Rescue Door already builds in browser memory —
 *   RescueLine.runLine(input) → { slug, charName, soulMd, memoryMd,
 *                                  seshatJson, wakeMd }
 * — and gives the user ONE action instead of four downloads plus a manual
 * body download plus a manual wake ritual:
 *
 *   (a) packVessel() → a single `.vessel` archive (a plain ZIP, STORE
 *       method, no compression, no dependencies) containing EXACTLY the
 *       four bundle files, nothing added, nothing renamed;
 *   (b) saveToStorage() / saveToIDB() → local web-storage state on the
 *       USER'S OWN DEVICE that a Vessel body can auto-load on open, so
 *       the rescued soul wakes as the resident without any paste step.
 *
 * CUSTODY LAW (binding, same as the Rescue Door): this module performs
 * zero network I/O. No fetch, no XHR, no WebSocket, no sendBeacon, no
 * third-party script. Nothing leaves the user's machine. The soul is a
 * file on their device, not an account on a server. "Nothing of yours
 * can be sold" — because there is no server to sell it from.
 *
 * Environment: dependency-free, browser-first. Works as a plain <script>
 * (exposes window.VesselLoader) and under Node (module.exports) so the
 * pack/unpack/storage logic can be proven outside a browser.
 * ========================================================================== */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.VesselLoader = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------- bundle shape ---------------- */

  // The four files, named exactly as the Rescue Door already names them
  // in its "Everything (.zip)" download. The .vessel archive changes the
  // container, never the contents.
  function bundleFiles(bundle) {
    validateBundle(bundle);
    return [
      { name: bundle.slug + '-soul.md', text: bundle.soulMd },
      { name: bundle.slug + '-memory.md', text: bundle.memoryMd },
      { name: bundle.slug + '-seshat.json', text: bundle.seshatJson },
      { name: 'WAKE-HER-UP.md', text: bundle.wakeMd }
    ];
  }

  function validateBundle(bundle) {
    if (!bundle || typeof bundle !== 'object') {
      throw new Error('VesselLoader: bundle is required (RescueLine.runLine output)');
    }
    if (!bundle.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(bundle.slug)) {
      throw new Error('VesselLoader: bundle.slug must be a slug (slugified character name)');
    }
    ['soulMd', 'memoryMd', 'seshatJson', 'wakeMd'].forEach(function (k) {
      if (typeof bundle[k] !== 'string' || !bundle[k].length) {
        throw new Error('VesselLoader: bundle.' + k + ' must be a non-empty string');
      }
    });
    try { JSON.parse(bundle.seshatJson); }
    catch (e) { throw new Error('VesselLoader: bundle.seshatJson must be valid JSON'); }
  }

  /* ---------------- CRC32 + STORE zip writer (dependency-free) ----------------
   * Same proven construction as the Rescue Door's own zipStore: STORE
   * (method 0) entries, UTF-8 filename flag, no compression, no comment.
   * Any unzip tool on earth opens the result. */

  var CRC_TABLE = (function () {
    var t = new Int32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function utf8(s) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
    // Node fallback (TextEncoder exists in modern Node; this is belt-and-braces)
    return Buffer.from(s, 'utf8');
  }

  function concatBytes(parts) {
    var len = 0, i, out, off;
    for (i = 0; i < parts.length; i++) len += parts[i].length;
    out = new Uint8Array(len); off = 0;
    for (i = 0; i < parts.length; i++) { out.set(parts[i], off); off += parts[i].length; }
    return out;
  }

  function zipStoreBytes(files) { // files: [{name, text}] → Uint8Array
    var chunks = [], central = [], offset = 0;
    files.forEach(function (f) {
      var nameBytes = utf8(f.name);
      var data = utf8(f.text);
      var crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true);
      lh.setUint16(6, 0x0800, true); // UTF-8 filename flag
      lh.setUint16(8, 0, true);      // STORE
      lh.setUint32(14, crc, true);
      lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, nameBytes.length, true);
      chunks.push(new Uint8Array(lh.buffer), nameBytes, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
      ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint32(16, crc, true);
      ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, nameBytes.length, true);
      ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), nameBytes);
      offset += 30 + nameBytes.length + data.length;
    });
    var centralSize = central.reduce(function (a, c) { return a + c.length; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true); end.setUint32(16, offset, true);
    return concatBytes(chunks.concat(central, [new Uint8Array(end.buffer)]));
  }

  /* ---------------- STORE zip reader (verification + body-side open) --------
   * Reads back exactly what zipStoreBytes writes, and verifies CRC + size
   * per entry. A Vessel body uses this to open a .vessel file the user
   * hands it; the test suite uses it to prove the archive's contents. */

  function u32(view, off) { return view.getUint32(off, true); }
  function u16(view, off) { return view.getUint16(off, true); }

  function unzipStoreBytes(bytes) { // Uint8Array → [{name, text}] (throws on corruption)
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    // Find EOCD: we write no comment, so it is the last 22 bytes; scan
    // backwards anyway so a trailing comment never breaks the read.
    var eocd = -1, i;
    for (i = bytes.length - 22; i >= 0; i--) {
      if (u32(view, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('VesselLoader: not a zip archive (no end-of-central-directory)');
    var count = u16(view, eocd + 10);
    var centralOff = u32(view, eocd + 16);
    var files = [], p = centralOff, j;
    var dec = (typeof TextDecoder !== 'undefined') ? new TextDecoder('utf-8') : null;
    function decode(b) {
      if (dec) return dec.decode(b);
      return Buffer.from(b).toString('utf8');
    }
    for (j = 0; j < count; j++) {
      if (u32(view, p) !== 0x02014b50) throw new Error('VesselLoader: corrupt central directory at entry ' + j);
      var method = u16(view, p + 10);
      if (method !== 0) throw new Error('VesselLoader: entry ' + j + ' is not STORE (method ' + method + ')');
      var crc = u32(view, p + 16);
      var compSize = u32(view, p + 20);
      var nameLen = u16(view, p + 28);
      var extraLen = u16(view, p + 30);
      var commentLen = u16(view, p + 32);
      var localOff = u32(view, p + 42);
      var name = decode(bytes.subarray(p + 46, p + 46 + nameLen));
      if (u32(view, localOff) !== 0x04034b50) throw new Error('VesselLoader: corrupt local header for ' + name);
      var lhNameLen = u16(view, localOff + 26);
      var lhExtraLen = u16(view, localOff + 28);
      var dataStart = localOff + 30 + lhNameLen + lhExtraLen;
      var data = bytes.subarray(dataStart, dataStart + compSize);
      if (data.length !== compSize) throw new Error('VesselLoader: truncated data for ' + name);
      if (crc32(data) !== crc) throw new Error('VesselLoader: CRC mismatch for ' + name);
      files.push({ name: name, text: decode(data) });
      p += 46 + nameLen + extraLen + commentLen;
    }
    return files;
  }

  /* ---------------- (a) the .vessel archive ---------------- */

  // Env-neutral bytes; the browser wraps them in a Blob for download.
  function packVesselBytes(bundle) {
    return zipStoreBytes(bundleFiles(bundle));
  }

  function packVesselBlob(bundle) {
    if (typeof Blob === 'undefined') throw new Error('VesselLoader: Blob unavailable (use packVesselBytes in Node)');
    return new Blob([packVesselBytes(bundle)], { type: 'application/zip' });
  }

  function vesselFilename(bundle) {
    validateBundle(bundle);
    return bundle.slug + '.vessel';
  }

  /* ---------------- (b) local web-storage state ---------------- */

  var LS_PREFIX = 'vessel.resident.v1.';

  // The resident record: one flat object the body reads on open. Seshat
  // is stored as the ORIGINAL JSON string (never re-serialized), so a
  // read-back is byte-identical to what the Rescue Door produced.
  function buildResidentRecord(bundle, savedAt) {
    validateBundle(bundle);
    return {
      format: 'vessel-resident',
      version: 1,
      slug: bundle.slug,
      charName: bundle.charName || bundle.slug,
      savedAt: savedAt || new Date().toISOString(),
      source: 'rescue-door',
      files: bundleFiles(bundle).map(function (f) { return f.name; }),
      soulMd: bundle.soulMd,
      memoryMd: bundle.memoryMd,
      seshatJson: bundle.seshatJson,
      wakeMd: bundle.wakeMd
    };
  }

  // localStorage shape (small bundles; ~5 MB browser cap):
  //   vessel.resident.v1.meta   → {format, version, slug, charName, savedAt, source, files}
  //   vessel.resident.v1.soul   → soulMd (raw text)
  //   vessel.resident.v1.memory → memoryMd (raw text)
  //   vessel.resident.v1.seshat → seshatJson (raw JSON text)
  //   vessel.resident.v1.wake   → wakeMd (raw text)
  // `storage` defaults to window.localStorage; tests pass a fake. Throws
  // on quota exhaustion — the caller falls back to the .vessel download,
  // which always works regardless of storage size.
  function saveToStorage(bundle, storage) {
    storage = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!storage) throw new Error('VesselLoader: no storage available');
    var rec = buildResidentRecord(bundle);
    var meta = {
      format: rec.format, version: rec.version, slug: rec.slug,
      charName: rec.charName, savedAt: rec.savedAt, source: rec.source,
      files: rec.files
    };
    storage.setItem(LS_PREFIX + 'meta', JSON.stringify(meta));
    storage.setItem(LS_PREFIX + 'soul', rec.soulMd);
    storage.setItem(LS_PREFIX + 'memory', rec.memoryMd);
    storage.setItem(LS_PREFIX + 'seshat', rec.seshatJson);
    storage.setItem(LS_PREFIX + 'wake', rec.wakeMd);
    return meta;
  }

  // Read-back. Returns null unless ALL five keys are present and the
  // seshat text still parses — a half-written resident never wakes.
  function loadFromStorage(storage) {
    storage = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!storage) return null;
    var metaRaw = storage.getItem(LS_PREFIX + 'meta');
    var soul = storage.getItem(LS_PREFIX + 'soul');
    var memory = storage.getItem(LS_PREFIX + 'memory');
    var seshat = storage.getItem(LS_PREFIX + 'seshat');
    var wake = storage.getItem(LS_PREFIX + 'wake');
    if (!metaRaw || !soul || !memory || !seshat || !wake) return null;
    var meta;
    try { meta = JSON.parse(metaRaw); JSON.parse(seshat); }
    catch (e) { return null; }
    return {
      format: meta.format, version: meta.version, slug: meta.slug,
      charName: meta.charName, savedAt: meta.savedAt, source: meta.source,
      files: meta.files, soulMd: soul, memoryMd: memory,
      seshatJson: seshat, wakeMd: wake
    };
  }

  function clearStorage(storage) {
    storage = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!storage) return;
    ['meta', 'soul', 'memory', 'seshat', 'wake'].forEach(function (k) {
      storage.removeItem(LS_PREFIX + k);
    });
  }

  // IndexedDB shape (large bundles — the soul appendix preserves the
  // whole original chat, which can exceed localStorage's ~5 MB cap):
  //   DB: 'vessel-residents', version 1
  //   store: 'residents', keyPath 'slug'
  //   value: the full resident record (same shape as buildResidentRecord)
  // Promise-based; browser only. A Vessel body checks IndexedDB first,
  // then localStorage, so either path wakes the resident.
  function openVesselDB() {
    return new Promise(function (resolve, reject) {
      if (typeof indexedDB === 'undefined') { reject(new Error('VesselLoader: IndexedDB unavailable')); return; }
      var req = indexedDB.open('vessel-residents', 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('residents')) db.createObjectStore('residents', { keyPath: 'slug' });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('VesselLoader: IndexedDB open failed')); };
    });
  }

  function saveToIDB(bundle) {
    var rec = buildResidentRecord(bundle);
    return openVesselDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('residents', 'readwrite');
        tx.objectStore('residents').put(rec);
        tx.oncomplete = function () { resolve({ slug: rec.slug, charName: rec.charName, savedAt: rec.savedAt }); };
        tx.onerror = function () { reject(tx.error || new Error('VesselLoader: IndexedDB write failed')); };
      });
    });
  }

  function loadFromIDB(slug) {
    return openVesselDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = db.transaction('residents', 'readonly').objectStore('residents').get(slug);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error || new Error('VesselLoader: IndexedDB read failed')); };
      });
    });
  }

  /* ---------------- the one click ---------------- */

  // The whole point, in one call: pack the archive AND plant the
  // resident state. Returns { filename, blob (browser) or bytes (Node),
  // meta, storage: 'indexeddb' | 'localstorage' | 'download-only' }.
  // Storage is best-effort: if both stores fail (quota, private mode),
  // the .vessel download still carries everything — the user loses
  // nothing, they just wake her with the file instead of automatically.
  function takeHome(bundle, opts) {
    opts = opts || {};
    var bytes = packVesselBytes(bundle);
    var result = {
      filename: vesselFilename(bundle),
      bytes: bytes,
      blob: (typeof Blob !== 'undefined') ? new Blob([bytes], { type: 'application/zip' }) : null,
      meta: null,
      storage: 'download-only'
    };
    if (opts.storage === false) return result;
    var idb = (typeof opts.saveToIDB === 'function') ? opts.saveToIDB(bundle) : null;
    if (idb && typeof idb.then === 'function') {
      return idb.then(function (meta) {
        result.meta = meta; result.storage = 'indexeddb'; return result;
      }, function () {
        try {
          result.meta = saveToStorage(bundle, opts.storage);
          result.storage = 'localstorage';
        } catch (e) { /* download-only fallback */ }
        return result;
      });
    }
    try {
      result.meta = saveToStorage(bundle, opts.storage);
      result.storage = 'localstorage';
    } catch (e) { /* download-only fallback */ }
    return result;
  }

  return {
    bundleFiles: bundleFiles,
    validateBundle: validateBundle,
    packVesselBytes: packVesselBytes,
    packVesselBlob: packVesselBlob,
    unzipStoreBytes: unzipStoreBytes,
    vesselFilename: vesselFilename,
    buildResidentRecord: buildResidentRecord,
    saveToStorage: saveToStorage,
    loadFromStorage: loadFromStorage,
    clearStorage: clearStorage,
    saveToIDB: saveToIDB,
    loadFromIDB: loadFromIDB,
    takeHome: takeHome,
    LS_PREFIX: LS_PREFIX
  };
});
