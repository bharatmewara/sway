'use strict';

const sharp = require('sharp');

/**
 * Optimizes an image buffer using sharp and returns bytecode buffer, mime type, and data URI.
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {Object} options
 * @returns {Promise<{ buffer: Buffer, mimetype: string, dataUri: string }>}
 */
async function processImage(buffer, mimetype = 'image/jpeg', options = {}) {
  try {
    const maxWidth = options.maxWidth || 1200;
    const maxHeight = options.maxHeight || 1200;
    const quality = options.quality || 85;

    let pipeline = sharp(buffer).rotate();
    pipeline = pipeline.resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true });

    let finalBuffer;
    let finalMime = mimetype;

    if (mimetype === 'image/png') {
      finalBuffer = await pipeline.png({ quality }).toBuffer();
    } else if (mimetype === 'image/webp') {
      finalBuffer = await pipeline.webp({ quality }).toBuffer();
    } else {
      finalBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      finalMime = 'image/jpeg';
    }

    const dataUri = `data:${finalMime};base64,${finalBuffer.toString('base64')}`;
    return {
      buffer: finalBuffer,
      mimetype: finalMime,
      dataUri,
    };
  } catch (err) {
    console.warn('[ImageProcessor] sharp optimization error, fallback to raw:', err.message);
    const mime = mimetype || 'image/jpeg';
    return {
      buffer,
      mimetype: mime,
      dataUri: `data:${mime};base64,${buffer.toString('base64')}`,
    };
  }
}

module.exports = {
  processImage,
};
