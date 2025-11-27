import React, { useState } from 'react';
import { WatermarkSettings, Tab, Photo } from '../types';
import { Upload, Image as ImageIcon, Sliders, Wand2, Plus, RefreshCw, AlertCircle, Trash2, Check, Download, Layers } from 'lucide-react';
import { generateAiLogo } from '../services/geminiService';

interface ControlPanelProps {
  onMainImageUpload: (files: FileList | null) => void;
  onWatermarkUpload: (file: File) => void;
  onWatermarkFromUrl: (url: string) => void;
  settings: WatermarkSettings;
  onSettingsChange: (s: WatermarkSettings) => void;
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  photos: Photo[];
  activePhotoId: string | null;
  onPhotoSelect: (id: string) => void;
  onPhotoDelete: (id: string) => void;
  onDownloadAll: () => void;
  isDownloading: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onMainImageUpload,
  onWatermarkUpload,
  onWatermarkFromUrl,
  settings,
  onSettingsChange,
  activeTab,
  setActiveTab,
  photos,
  activePhotoId,
  onPhotoSelect,
  onPhotoDelete,
  onDownloadAll,
  isDownloading
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onMainImageUpload(e.target.files);
    }
  };

  const handleWatermarkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onWatermarkUpload(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const imageUrl = await generateAiLogo(prompt);
      onWatermarkFromUrl(imageUrl);
      setActiveTab(Tab.SETTINGS); 
    } catch (err: any) {
      setError(err.message || 'Failed to generate logo. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-slate-200 shadow-xl z-20">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          MarkMaster AI
        </h1>
        <p className="text-xs text-slate-500 mt-1">Batch Watermarking Tool</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab(Tab.UPLOAD)}
          className={`flex-1 py-4 text-sm font-medium flex flex-col items-center gap-1 transition-colors ${
            activeTab === Tab.UPLOAD ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload className="w-4 h-4" />
          Photos
        </button>
        <button
          onClick={() => setActiveTab(Tab.AI_GENERATE)}
          className={`flex-1 py-4 text-sm font-medium flex flex-col items-center gap-1 transition-colors ${
            activeTab === Tab.AI_GENERATE ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          AI Logo
        </button>
        <button
          onClick={() => setActiveTab(Tab.SETTINGS)}
          className={`flex-1 py-4 text-sm font-medium flex flex-col items-center gap-1 transition-colors ${
            activeTab === Tab.SETTINGS ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {activeTab === Tab.UPLOAD && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Main Upload Area */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">Photo Gallery</label>
                <span className="text-xs text-slate-400">{photos.length} photo{photos.length !== 1 && 's'}</span>
              </div>
              
              <div className="relative group">
                 <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMainFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-all cursor-pointer">
                  <div className="p-3 bg-slate-100 rounded-full mb-3 group-hover:bg-white transition-colors">
                    <Layers className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600">Click to add photos</span>
                  <span className="text-xs mt-1">Supports batch upload</span>
                </div>
              </div>

              {/* Photo List */}
              {photos.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo) => (
                      <div 
                        key={photo.id}
                        onClick={() => onPhotoSelect(photo.id)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all group ${
                          activePhotoId === photo.id 
                            ? 'border-indigo-600 ring-2 ring-indigo-100' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img src={photo.src} alt="Thumbnail" className="w-full h-full object-cover" />
                        
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPhotoDelete(photo.id);
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        
                        {activePhotoId === photo.id && (
                          <div className="absolute inset-0 bg-indigo-600/10 pointer-events-none" />
                        )}
                      </div>
                    ))}
                  </div>

                  {photos.length > 1 && (
                     <button
                      onClick={onDownloadAll}
                      disabled={isDownloading}
                      className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                    >
                      {isDownloading ? (
                        <>
                           <RefreshCw className="w-4 h-4 animate-spin" />
                           Processing {photos.length} files...
                        </>
                      ) : (
                        <>
                           <Download className="w-4 h-4" />
                           Download All ({photos.length})
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">Watermark Source</span>
                </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Watermark Image</label>
               <div className="relative group">
                 <input
                  type="file"
                  accept="image/*"
                  onChange={handleWatermarkFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex items-center justify-center gap-3 text-slate-400 group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-all">
                  <Plus className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                  <span className="text-sm">Upload Logo File</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === Tab.AI_GENERATE && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <h3 className="text-indigo-900 font-medium text-sm flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    Gemini Power
                </h3>
                <p className="text-indigo-700/80 text-xs mt-1">
                    Don't have a logo? Describe what you want, and our AI will create a unique watermark for you instantly.
                </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A minimalist geometric fox head, white outline on transparent background"
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm min-h-[100px] resize-none"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                isGenerating || !prompt
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Logo
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === Tab.SETTINGS && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Opacity */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-semibold uppercase text-slate-500">Opacity</label>
                <span className="text-xs font-mono text-slate-600">{Math.round(settings.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.opacity}
                onChange={(e) => onSettingsChange({ ...settings, opacity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Scale */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-semibold uppercase text-slate-500">Size</label>
                <span className="text-xs font-mono text-slate-600">{settings.scale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={settings.scale}
                onChange={(e) => onSettingsChange({ ...settings, scale: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Rotation */}
             <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-semibold uppercase text-slate-500">Rotation</label>
                <span className="text-xs font-mono text-slate-600">{settings.rotation}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={settings.rotation}
                onChange={(e) => onSettingsChange({ ...settings, rotation: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
                 <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold uppercase text-slate-500">Position X</label>
                    <span className="text-xs font-mono text-slate-600">{Math.round(settings.x)}%</span>
                </div>
                 <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.x}
                    onChange={(e) => onSettingsChange({ ...settings, x: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-4"
                  />

                <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold uppercase text-slate-500">Position Y</label>
                    <span className="text-xs font-mono text-slate-600">{Math.round(settings.y)}%</span>
                </div>
                 <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.y}
                    onChange={(e) => onSettingsChange({ ...settings, y: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-xs text-slate-400 mt-2 italic">Settings apply to all uploaded photos.</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-center text-slate-400">
        &copy; {new Date().getFullYear()} MarkMaster AI
      </div>
    </div>
  );
};

export default ControlPanel;