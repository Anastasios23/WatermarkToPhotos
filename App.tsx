import React, { useState, useEffect, useRef } from 'react';
import WatermarkCanvas from './components/WatermarkCanvas';
import ControlPanel from './components/ControlPanel';
import { WatermarkSettings, Tab, Size, Photo } from './types';
import { Menu, X } from 'lucide-react';
import { createWatermarkedImage } from './utils/imageProcessing';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  
  const [watermark, setWatermark] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<WatermarkSettings>({
    x: 50,
    y: 50,
    scale: 0.5,
    opacity: 0.8,
    rotation: 0
  });

  const [activeTab, setActiveTab] = useState<Tab>(Tab.UPLOAD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [containerSize, setContainerSize] = useState<Size>({ width: 0, height: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Init

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMainImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Convert FileList to array and create Photo objects
    const newPhotos: Photo[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      src: URL.createObjectURL(file),
      file,
      name: file.name
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    
    // Set first new photo as active if none selected
    if (!activePhotoId && newPhotos.length > 0) {
      setActivePhotoId(newPhotos[0].id);
      // Auto switch to settings if we have watermark, else stay on upload to encourage watermark upload
      if (watermark) {
          setActiveTab(Tab.SETTINGS);
      }
    }
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => {
      const newPhotos = prev.filter(p => p.id !== id);
      if (activePhotoId === id) {
        setActivePhotoId(newPhotos.length > 0 ? newPhotos[0].id : null);
      }
      return newPhotos;
    });
  };

  const handleWatermarkUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setWatermark(url);
    if (photos.length > 0) {
        setActiveTab(Tab.SETTINGS);
    }
  };

  const handleWatermarkFromUrl = (url: string) => {
    setWatermark(url);
    if (photos.length > 0) {
        setActiveTab(Tab.SETTINGS);
    }
  };

  const handleDownloadAll = async () => {
    if (!watermark || photos.length === 0) return;
    setIsDownloading(true);
    
    try {
        for (const photo of photos) {
            const dataUrl = await createWatermarkedImage(photo.src, watermark, settings);
            const link = document.createElement('a');
            link.download = `watermarked-${photo.name}`;
            link.href = dataUrl;
            link.click();
            
            // Small delay to be gentle with browser download limits
            await new Promise(r => setTimeout(r, 300)); 
        }
    } catch (e) {
        console.error("Batch download failed", e);
        alert("Something went wrong during batch download.");
    } finally {
        setIsDownloading(false);
    }
  };

  // Get current photo object and index
  const activePhotoIndex = photos.findIndex(p => p.id === activePhotoId);
  const activePhoto = activePhotoIndex >= 0 ? photos[activePhotoIndex] : null;
  const mainImageSrc = activePhoto ? activePhoto.src : null;
  const hasNext = activePhotoIndex !== -1 && activePhotoIndex < photos.length - 1;

  const handleDownloadAndNext = async () => {
    if (!activePhoto || !watermark) return;
    setIsDownloading(true);

    try {
      // 1. Generate Watermarked Image (Off-screen)
      const dataUrl = await createWatermarkedImage(activePhoto.src, watermark, settings);
      
      // 2. Trigger Download
      const link = document.createElement('a');
      link.download = `watermarked-${activePhoto.name}`;
      link.href = dataUrl;
      link.click();

      // 3. Move to next photo
      // Small delay to ensure download starts cleanly and provide visual feedback
      await new Promise(r => setTimeout(r, 100));
      
      if (hasNext) {
        setActivePhotoId(photos[activePhotoIndex + 1].id);
      }
    } catch (err) {
      console.error("Error saving image:", err);
      alert("Failed to save image.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden relative">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-slate-700 hover:text-indigo-600"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div 
        className={`
          fixed md:relative z-40 h-full w-80 shrink-0 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'} 
          ${isSidebarOpen ? 'md:w-96' : ''} 
        `}
      >
        <ControlPanel 
          onMainImageUpload={handleMainImageUpload}
          onWatermarkUpload={handleWatermarkUpload}
          onWatermarkFromUrl={handleWatermarkFromUrl}
          settings={settings}
          onSettingsChange={setSettings}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          photos={photos}
          activePhotoId={activePhotoId}
          onPhotoSelect={setActivePhotoId}
          onPhotoDelete={handleDeletePhoto}
          onDownloadAll={handleDownloadAll}
          isDownloading={isDownloading}
        />
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 h-full relative"
      >
        <WatermarkCanvas 
          mainImageSrc={mainImageSrc} 
          watermarkSrc={watermark} 
          settings={settings} 
          onSettingsChange={setSettings}
          containerSize={containerSize}
          hasNext={hasNext}
          onDownloadAndNext={handleDownloadAndNext}
          isProcessing={isDownloading}
        />
        
        {/* Toggle Sidebar Button for Desktop (when closed) */}
        {!isSidebarOpen && (
           <button 
            onClick={() => setIsSidebarOpen(true)}
            className="hidden md:flex absolute top-4 left-4 z-30 p-2 bg-white/80 backdrop-blur rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;