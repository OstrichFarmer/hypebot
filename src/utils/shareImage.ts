const CANVAS_SIZE = 1080;
const PADDING_X = 80;
const BACKGROUND_COLOR = '#F8F7FF';
const ACCENT_COLOR = '#7C3AED';
const TEXT_COLOR = '#1F2937';
const WATERMARK_COLOR = '#9CA3AF';
const FONT_FAMILY = '"Plus Jakarta Sans", sans-serif';

// Splits text into lines that each fit within maxWidth, since Canvas has no
// built-in text wrapping — measured word by word against the current font.
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

// Renders a branded 1080x1080 compliment card off-screen and returns it as a
// PNG blob, ready to download or attach to a Web Share API call.
export async function generateComplimentImage(compliment: string): Promise<Blob> {
  // Ensure Plus Jakarta Sans is actually loaded at each weight/size we use
  // before drawing — otherwise canvas silently falls back to a system font.
  await Promise.all([
    document.fonts.load(`800 56px ${FONT_FAMILY}`),
    document.fonts.load(`600 44px ${FONT_FAMILY}`),
    document.fonts.load(`500 28px ${FONT_FAMILY}`),
  ]);
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas rendering is not supported in this browser.');
  }

  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.textAlign = 'center';

  // Title
  ctx.fillStyle = ACCENT_COLOR;
  ctx.font = `800 56px ${FONT_FAMILY}`;
  ctx.fillText('HypeBot 🎉', CANVAS_SIZE / 2, 130);

  // Accent bar
  ctx.fillStyle = ACCENT_COLOR;
  ctx.fillRect(CANVAS_SIZE / 2 - 60, 165, 120, 6);

  // Compliment text, wrapped and vertically centered on the card
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `600 44px ${FONT_FAMILY}`;
  const maxTextWidth = CANVAS_SIZE - PADDING_X * 2;
  const lines = wrapText(ctx, compliment, maxTextWidth);
  const lineHeight = 60;
  const textBlockHeight = lines.length * lineHeight;
  const firstLineY = CANVAS_SIZE / 2 - textBlockHeight / 2 + lineHeight / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, CANVAS_SIZE / 2, firstLineY + index * lineHeight);
  });

  // Watermark
  ctx.fillStyle = WATERMARK_COLOR;
  ctx.font = `500 28px ${FONT_FAMILY}`;
  ctx.fillText('hypebot-jet.vercel.app', CANVAS_SIZE / 2, CANVAS_SIZE - 60);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to generate compliment image.'));
      }
    }, 'image/png');
  });
}
