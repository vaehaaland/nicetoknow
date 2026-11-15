// Bilethandsaming i nettlesaren – delt av profilbilete og bilete til chatten.

type ScaleOptions = { maxSide: number; square?: boolean; quality?: number };

// Skalerer biletet ned (aldri opp) til maks `maxSide` px og returnerer ein JPEG data-URL.
// Med `square` blir det kutta til eit sentrert kvadrat.
export async function scaleImage(file: File, { maxSide, square = false, quality = 0.85 }: ScaleOptions) {
  const bitmap = await createImageBitmap(file);
  const srcW = square ? Math.min(bitmap.width, bitmap.height) : bitmap.width;
  const srcH = square ? srcW : bitmap.height;
  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));

  const canvas = document.createElement("canvas");
  canvas.width = square ? maxSide : Math.round(srcW * scale);
  canvas.height = square ? maxSide : Math.round(srcH * scale);
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - srcW) / 2, (bitmap.height - srcH) / 2, srcW, srcH, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

// Grenser for bilete i chatten – brukt av både klient og server
export const CHAT_IMAGE = { maxSide: 1568, perMessage: 4, maxChars: 1_500_000 };
export const CHAT_IMAGE_PATTERN = /^data:(image\/jpeg);base64,([A-Za-z0-9+/]+=*)$/;
