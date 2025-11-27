import { WatermarkSettings } from '../types';

export const createWatermarkedImage = async (
  mainImageSrc: string,
  watermarkSrc: string,
  settings: WatermarkSettings
): Promise<string> => {
  const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });

  const [mainImg, wmImg] = await Promise.all([
    loadImage(mainImageSrc),
    loadImage(watermarkSrc)
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = mainImg.width;
  canvas.height = mainImg.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Canvas context not supported");

  ctx.drawImage(mainImg, 0, 0);

  const wmWidth = wmImg.width * settings.scale;
  const wmHeight = wmImg.height * settings.scale;
  const xPos = (settings.x / 100) * canvas.width;
  const yPos = (settings.y / 100) * canvas.height;

  ctx.save();
  ctx.translate(xPos, yPos);
  ctx.rotate((settings.rotation * Math.PI) / 180);
  ctx.globalAlpha = settings.opacity;
  ctx.drawImage(wmImg, -wmWidth / 2, -wmHeight / 2, wmWidth, wmHeight);
  ctx.restore();

  return canvas.toDataURL('image/png');
};