import { BadRequestException } from '@nestjs/common';
import { dirname } from 'path';
import { TextItem } from '../common/text-items';

import sharp from 'sharp';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createWorker } = require('tesseract.js');

// OCR reads small text badly. We make the picture bigger and clearer first:
// fix phone rotation, grey, stretch contrast, and scale to a good working width.
const TARGET_WIDTH = 2600;
async function prepare(image: Buffer, binary: boolean): Promise<Buffer> {
  const meta = await sharp(image).metadata();
  const width = meta.width ?? TARGET_WIDTH;
  const base = sharp(image)
    .rotate() // follow the photo's rotation tag (phones)
    .flatten({ background: '#ffffff' }) // transparent PNG -> white
    .grayscale()
    .normalise()
    .resize({ width: width < TARGET_WIDTH ? TARGET_WIDTH : Math.min(width, 3600), kernel: 'lanczos3' });
  // "binary" = pure black and white. It helps when text sits on a grey background (like the header row).
  return (binary ? base.threshold(170) : base.sharpen()).withMetadata({ density: 300 }).png().toBuffer(); // density: tell the engine this is a big, sharp image
}

// OCR = "optical character recognition": turning a picture of text into real text.
// tesseract.js is a free OCR engine that runs inside Node. The English language data comes from
// the npm package @tesseract.js-data/eng, so it works offline (nothing is downloaded at run time).
const LANG_PATH = process.env.OCR_LANG_PATH ?? dirname(require.resolve('@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'));

export class OcrReader {
  private worker: any = null;
  private starting: Promise<any> | null = null;
  private queue: Promise<unknown> = Promise.resolve(); // the engine reads one picture at a time

  // Start the engine the first time it is needed (loading takes a few seconds), then keep it.
  private async getWorker() {
    if (this.worker) return this.worker;
    if (!this.starting) {
      this.starting = createWorker('eng', 1, { langPath: LANG_PATH, gzip: true, logger: () => undefined }).then((w: any) => {
        this.worker = w;
        return w;
      });
    }
    return this.starting;
  }

  // Reads a picture (PNG or JPEG) and returns every word with its position.
  read(image: Buffer, binary = false): Promise<TextItem[]> {
    const job = this.queue.then(async () => {
      let data: any;
      try {
        const worker = await this.getWorker();
        const result: any = await withTimeout(worker.recognize(await prepare(image, binary)), 60_000);
        data = result.data;
      } catch (e) {
        if (e instanceof BadRequestException) throw e;
        throw new BadRequestException('This picture could not be read. Try a clearer, larger screenshot.');
      }
      const words: any[] = data.words ?? [];
      return words
        .filter((w) => w.text && w.text.trim() && w.confidence > 30)
        .map<TextItem>((w) => ({
          text: w.text.trim(),
          x: w.bbox.x0,
          y: w.bbox.y0,
          w: w.bbox.x1 - w.bbox.x0,
          h: w.bbox.y1 - w.bbox.y0,
        }));
    });
    this.queue = job.catch(() => undefined);
    return job;
  }

  async close() {
    if (this.worker) await this.worker.terminate();
    this.worker = null;
    this.starting = null;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new BadRequestException('Reading the picture took too long.')), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}