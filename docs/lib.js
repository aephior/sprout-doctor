const fs = require('fs');
const d = require('docx');
const {
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  AlignmentType, HeadingLevel, ImageRun, LevelFormat, Footer, PageNumber, PageBreak,
} = d;

const FONT = 'Times New Roman';
const W = 9638; // A4, поля 2 см
const NAVY = '2B2A4C', CREAM = 'F6E7C1', LIGHT = 'FBF5E6', GREEN = '4F8A3C';

// **жирный** и *курсив* внутри строки
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), font: FONT, ...base }));
    const t = m[0];
    if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), bold: true, font: FONT, ...base }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, font: FONT, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), font: FONT, ...base }));
  return out;
}

const p = (text, opt = {}) => new Paragraph({
  children: runs(text, { size: opt.size || 24, color: opt.color }),
  alignment: opt.align || AlignmentType.JUSTIFIED,
  spacing: { after: opt.after ?? 120, line: 276 },
  keepNext: opt.keepNext,
});
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, font: FONT })], pageBreakBefore: true });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, font: FONT })], keepNext: true });
const h3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: t, font: FONT })], keepNext: true });
const bullet = (t, lvl = 0) => new Paragraph({ numbering: { reference: 'bul', level: lvl }, children: runs(t, { size: 24 }), spacing: { after: 60, line: 276 } });
const num = (t, ref = 'num') => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t, { size: 24 }), spacing: { after: 60, line: 276 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFB7A0' };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, width, opt = {}) {
  const paras = String(text).split('\n').map((line) => new Paragraph({
    children: runs(line, { size: opt.size || 21, color: opt.color, bold: opt.bold }),
    spacing: { after: 30, line: 252 },
    alignment: opt.align || AlignmentType.LEFT,
  }));
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    shading: opt.fill ? { fill: opt.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: paras,
  });
}

// headers: [..] | null; rows: [[..]]; widths: доли или DXA
function table(headers, rows, widths, opt = {}) {
  const sum = widths.reduce((a, b) => a + b, 0);
  const cols = widths.map((w) => Math.round((w / sum) * W));
  cols[cols.length - 1] += W - cols.reduce((a, b) => a + b, 0);
  const trs = [];
  if (headers) trs.push(new TableRow({ tableHeader: true, cantSplit: true,
    children: headers.map((h, i) => cell(h, cols[i], { fill: NAVY, color: 'FFFFFF', bold: true })) }));
  rows.forEach((r, ri) => trs.push(new TableRow({ cantSplit: true,
    children: r.map((c, i) => {
      if (c && typeof c === 'object' && c.fill) return cell(c.text || '', cols[i], { fill: c.fill });
      const fill = opt.firstColFill && i === 0 ? CREAM : (ri % 2 === 1 ? LIGHT : undefined);
      return cell(c, cols[i], { fill, bold: opt.firstColBold && i === 0 });
    }) })));
  return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cols, rows: trs }),
    new Paragraph({ children: [], spacing: { after: 120 } })];
}

function img(path, widthPx, caption) {
  const sz = require('child_process').execSync(`python3 -c "from PIL import Image;print(*Image.open('${path}').size)"`).toString().trim().split(' ').map(Number);
  const h = Math.round(widthPx * sz[1] / sz[0]);
  const out = [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: caption ? 40 : 160 }, keepNext: !!caption,
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(path), transformation: { width: widthPx, height: h },
      altText: { title: caption || 'image', description: caption || 'image', name: path.split('/').pop() } })] })];
  if (caption) out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 },
    children: [new TextRun({ text: caption, italics: true, size: 20, font: FONT, color: '555555' })] }));
  return out;
}

function doc(children, footerText) {
  return new d.Document({
    creator: 'Sprout Doctor team',
    styles: {
      default: { document: { run: { font: FONT, size: 24 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 34, bold: true, font: FONT, color: NAVY },
          paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GREEN, space: 4 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, font: FONT, color: NAVY }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 25, bold: true, font: FONT, color: GREEN }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [
      { reference: 'bul', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 283 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1134, hanging: 283 } } } }] },
      ...['num', 'num2', 'num3', 'num4'].map((r) => ({ reference: r, levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 340 } } } }] })),
    ] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: footerText + ' · стр. ', size: 18, color: '888888', font: FONT }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '888888', font: FONT })] })] }) },
      children,
    }],
  });
}

async function save(document, path) {
  fs.writeFileSync(path, await d.Packer.toBuffer(document));
  console.log('saved', path);
}

const title = (t, sub, motto) => [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 120 }, children: [new TextRun({ text: t, bold: true, size: 56, font: FONT, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: sub, bold: true, size: 30, font: FONT })] }),
  ...(motto ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: motto, italics: true, size: 24, font: FONT })] })] : []),
];

module.exports = { p, h1, h2, h3, bullet, num, table, img, doc, save, title, pageBreak, CREAM, NAVY, AlignmentType, Paragraph, TextRun };
