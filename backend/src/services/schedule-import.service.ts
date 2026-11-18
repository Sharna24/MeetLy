import { BadRequestException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { rangesOverlap, formatMinutes } from '../common/time';
import { ParsedClass, ParseResult, parseSchedule } from './schedule-parser';
import { OcrReader } from './ocr-reader';
import { readPdf } from './pdf-reader';
import { RoutineService } from './routine.service';

export interface PreviewClass extends ParsedClass {
  conflict: string | null; // set when it overlaps a class that is already in the routine
}
export interface ImportPreview {
  source: 'pdf' | 'image';
  session: string | null;
  classes: PreviewClass[];
  warnings: string[];
}

// What kind of file is it? We look at the first bytes of the file ("magic bytes"),
// not at the name, because a name can lie.
function detect(buf: Buffer): 'pdf' | 'image' | null {
  if (buf.length < 12) return null;
  if (buf.subarray(0, 4).toString('latin1') === '%PDF') return 'pdf';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image'; // PNG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image'; // JPEG
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image';
  return null;
}

// "Better" = more classes, then fewer warnings.
const better = (a: ParseResult, b: ParseResult) =>
  a.classes.length > b.classes.length || (a.classes.length === b.classes.length && a.warnings.length < b.warnings.length);

@Injectable()
export class ScheduleImportService implements OnModuleDestroy {
  private readonly ocr = new OcrReader();

  constructor(private readonly routine: RoutineService) {}

  onModuleDestroy() {
    return this.ocr.close();
  }

  // Reads the uploaded file and returns what it found. Nothing is saved yet.
  async preview(userId: string, file: Buffer): Promise<ImportPreview> {
    const source = detect(file);
    if (!source) throw new BadRequestException('Please upload a PDF, or a PNG or JPG picture.');

    let result: ParseResult;
    if (source === 'pdf') {
      result = parseSchedule(await readPdf(file));
    } else {
      result = parseSchedule(await this.ocr.read(file));
      // Nothing (or only some) found? Try again with a black-and-white version of the picture.
      if (result.classes.length === 0 || result.warnings.length > 0) {
        const second = parseSchedule(await this.ocr.read(file, true));
        if (better(second, result)) result = second;
      }
    }

    if (result.classes.length === 0) {
      throw new BadRequestException(result.warnings[0] ?? 'No classes were found in this file.');
    }

    const warnings = [...result.warnings];
    if (result.session && result.session !== this.routine.semester) {
      warnings.unshift(`This schedule is for ${result.session}, but Meetly is set to ${this.routine.semester}.`);
    }
    if (source === 'image') {
      warnings.push('Pictures can be misread. Please check every course code, day and time before you import.');
    }

    // Mark the classes that clash with what is already in the routine.
    const existing = await this.routine.list(userId);
    const classes = result.classes.map<PreviewClass>((c) => {
      for (const day of c.days) {
        const clash = existing.find((e) => e.dayOfWeek === day && rangesOverlap(e.startMin, e.endMin, c.startMin, c.endMin));
        if (clash) {
          return { ...c, conflict: `Overlaps ${clash.courseCode} on ${day} (${formatMinutes(clash.startMin)} - ${formatMinutes(clash.endMin)})` };
        }
      }
      return { ...c, conflict: null };
    });

    return { source, session: result.session, classes, warnings };
  }
}