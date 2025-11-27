import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WatermarkSettings, Size } from '../types';
import { Download, ZoomIn, ZoomOut, Move, ArrowRight, RefreshCw } from 'lucide-react';

interface WatermarkCanvasProps {
  mainImageSrc: string | null;
  watermarkSrc: string | null;
  settings: WatermarkSettings;
  onSettingsChange: (newSettings: WatermarkSettings) => void;
  containerSize: Size;
  hasNext: boolean;
  onDownloadAndNext: () => void;
  isProcessing: boolean;
}

const WatermarkCanvas: React.FC<WatermarkCanvasProps> = ({
  mainImageSrc,
  watermarkSrc,
  settings,
  onSettingsChange,
  containerSize,
  hasNext,
  onDownloadAndNext,
  isProcessing
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mainImage, setMainImage] = useState<HTMLImageElement | null>(null);
  const [watermarkImage, setWatermarkImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1); // For UI zoom, not image scale

  // Load Main Image
  useEffect(() => {
    if (mainImageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = mainImageSrc;
      img.onload = () => setMainImage(img);
    } else {
      setMainImage(null);
    }
  }, [mainImageSrc]);

  // Load Watermark Image
  useEffect(() => {
    if (watermarkSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = watermarkSrc;
      img.onload = () => {
        setWatermarkImage(img);
        // Reset scale to something reasonable relative to main image when new watermark loads
        if (mainImage) {
            // Logic to auto-scale could go here if desired
        }
      };
    } else {
      setWatermarkImage(null);
    }
  }, [watermarkSrc, mainImage]); // Depend on mainImage to potentially size relative to it

  // Draw Function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mainImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match the main image resolution
    canvas.width = mainImage.width;
    canvas.height = mainImage.height;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Main Image
    ctx.drawImage(mainImage, 0, 0);

    // Draw Watermark
    if (watermarkImage) {
      ctx.save();
      
      const wmWidth = watermarkImage.width * settings.scale;
      const wmHeight = watermarkImage.height * settings.scale;
      
      // Calculate position
      // The settings.x and settings.y are percentages (0-100) of the canvas size
      const xPos = (settings.x / 100) * canvas.width;
      const yPos = (settings.y / 100) * canvas.height;

      // Translate to center of watermark for rotation
      ctx.translate(xPos, yPos);
      ctx.rotate((settings.rotation * Math.PI) / 180);
      ctx.globalAlpha = settings.opacity;
      
      // Draw centered at the translated point
      ctx.drawImage(watermarkImage, -wmWidth / 2, -wmHeight / 2, wmWidth, wmHeight);
      
      ctx.restore();
    }
  }, [mainImage, watermarkImage, settings]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Fit canvas to screen on load
  useEffect(() => {
    if (mainImage && containerSize.width > 0) {
      const scaleW = containerSize.width / mainImage.width;
      const scaleH = containerSize.height / mainImage.height;
      // Start with a zoom that fits the image with some padding
      setCanvasScale(Math.min(scaleW, scaleH) * 0.9);
    }
  }, [mainImage, containerSize]);


  // Mouse Interactions for Dragging
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!watermarkImage || !canvasRef.current) return;
    
    // Allow dragging anywhere on canvas for better UX, or implement hit testing
    setIsDragging(true);
    const coords = getCanvasCoordinates(e);
    setDragStart(coords);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !canvasRef.current) return;
    
    e.preventDefault(); // Prevent scrolling on touch
    
    const coords = getCanvasCoordinates(e);
    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;

    // Convert pixel delta to percentage delta
    const dPctX = (dx / canvasRef.current.width) * 100;
    const dPctY = (dy / canvasRef.current.height) * 100;

    onSettingsChange({
      ...settings,
      x: settings.x + dPctX,
      y: settings.y + dPctY
    });

    setDragStart(coords);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'watermarked-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!mainImageSrc) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
        <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
           <Move className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-lg font-medium">No image uploaded</p>
        <p className="text-sm">Upload a photo to start editing</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-200/50 backdrop-blur-sm">
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <button 
                onClick={() => setCanvasScale(prev => Math.max(0.1, prev - 0.1))}
                className="p-2 hover:bg-slate-50 border-r border-slate-200"
                title="Zoom Out"
            >
                <ZoomOut className="w-5 h-5 text-slate-600" />
            </button>
            <span className="px-3 py-2 text-xs font-medium text-slate-500 flex items-center min-w-[60px] justify-center">
                {Math.round(canvasScale * 100)}%
            </span>
            <button 
                onClick={() => setCanvasScale(prev => Math.min(3, prev + 0.1))}
                className="p-2 hover:bg-slate-50"
                title="Zoom In"
            >
                <ZoomIn className="w-5 h-5 text-slate-600" />
            </button>
        </div>
      </div>

      <div 
        className="shadow-2xl shadow-slate-300/50 border-4 border-white transition-transform duration-200 ease-out"
        style={{ transform: `scale(${canvasScale})` }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className={`bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] bg-white cursor-crosshair ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-6 z-20 flex gap-3">
         {hasNext ? (
            <>
              <button
                onClick={downloadImage}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Save Current</span>
              </button>
              <button
                onClick={onDownloadAndNext}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                {isProcessing ? (
                   <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                   <ArrowRight className="w-5 h-5" />
                )}
                Save & Next
              </button>
            </>
         ) : (
            <button
                onClick={downloadImage}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                <Download className="w-5 h-5" />
                Download Result
            </button>
         )}
      </div>
    </div>
  );
};

export default WatermarkCanvas;