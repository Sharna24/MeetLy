import { BadRequestException } from '@nestjs/common';
import { TextItem } from '../common/text-items';

// pdf.js looks for the optional "canvas" package (for drawing pages). We only read text, so we give it
// empty stand-ins; this stops a harmless warning at start-up.
const g = globalThis as any;
g.DOMMatrix ??= class {};
g.Path2D ??= class {};

// pdf.js is the PDF engine inside Firefox. We use the "legacy" build because it works with
// the CommonJS style that NestJS uses.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

const MAX_PAGES = 3;

// Pulls every piece of text out of a PDF, together with where it sits on the page.
export async function readPdf(data: Buffer): Promise<TextItem[]> {
  let doc: any;
  try {
    doc = await pdfjs.getDocument({
      data: new Uint8Array(data),
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false, // do not run code from inside the file
      verbosity: 0,
    }).promise;
  } catch {
    throw new BadRequestException('This PDF could not be opened. Is it damaged or password protected?');
  }

  const items: TextItem[] = [];
  let offset = 0; // pages are stacked one under the other
  const pages = Math.min(doc.numPages, MAX_PAGES);
  for (let p = 1; p <= pages; p++) {
    const page = await doc.getPage(p);
    const height = page.getViewport({ scale: 1 }).height;
    const content = await page.getTextContent();
    for (const it of content.items as any[]) {
      if (!it.str || !it.str.trim()) continue;
      const h = it.height || Math.abs(it.transform[3]) || 10;
      items.push({
        text: it.str,
        x: it.transform[4],
        y: offset + height - it.transform[5] - h, // PDF counts from the bottom; flip it
        w: it.width,
        h,
      });
    }
    offset += height;
  }
  await doc.destroy();
  return items;
}