// One piece of text found on a page, with where it sits.
// x and y are measured from the TOP-LEFT corner of the page (y grows downward).
// Both the PDF reader and the picture reader (OCR) produce this same shape,
// so one parser can read both.
export interface TextItem {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
