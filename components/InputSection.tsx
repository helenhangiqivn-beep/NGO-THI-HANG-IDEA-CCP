import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles, User, Palette, LayoutGrid, X, Plus } from 'lucide-react';
import { Button } from './Button';
import { DEFAULT_COLOR_COUNT, DEFAULT_STYLE, CONCEPT_PRESETS } from '../constants';

interface InputSectionProps {
  onGenerate: (images: string[], colorCount: number, style: string, mode: 'diverse' | 'specific', character: string) => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading }) => {
  const [images, setImages] = useState<string[]>([]);
  const [colorCount, setColorCount] = useState<number>(DEFAULT_COLOR_COUNT);
  const [style, setStyle] = useState<string>(DEFAULT_STYLE);
  const [mode, setMode] = useState<'diverse' | 'specific'>('diverse');
  const [specificCharacter, setSpecificCharacter] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    processFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length > 0) {
      onGenerate(images, colorCount, style, mode, specificCharacter);
    }
  };

  const handlePresetClick = (preset: string) => {
    setStyle(preset);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="md:grid md:grid-cols-2 h-full">
        {/* Left Side - Multiple Image Upload */}
        <div 
          className="relative min-h-[400px] md:h-auto border-r-0 md:border-r border-slate-100 bg-slate-50 p-6 flex flex-col"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <ImageIcon size={18} className="text-rose-400" />
              Reference Gallery ({images.length})
            </h3>
            {images.length > 0 && (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
              >
                <Plus size={14} /> Add More
              </button>
            )}
          </div>

          {images.length === 0 ? (
            <div 
              className="flex-grow border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-rose-200 transition-all text-slate-400 p-8"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-white shadow-sm mb-4 flex items-center justify-center">
                <Upload size={28} />
              </div>
              <p className="text-lg font-medium text-slate-700 mb-1">Upload Inspirations</p>
              <p className="text-sm text-center">Drag & drop multiple images<br/>to define your style DNA</p>
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square group rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                    <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl hover:border-rose-200 hover:bg-rose-50/30 text-slate-400 hover:text-rose-400 transition-all"
                >
                  <Plus size={24} />
                  <span className="text-[10px] font-bold mt-1">ADD</span>
                </button>
              </div>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
            multiple
          />
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Architect Your Collection</h2>
            <p className="text-slate-500 text-sm">
              Synthesize patterns from all references into 10 cohesive new designs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Generation Mode
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('diverse')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                    mode === 'diverse' 
                      ? 'bg-white text-rose-500 shadow-sm ring-1 ring-slate-200' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LayoutGrid size={16} />
                  Diverse Ideas
                </button>
                <button
                  type="button"
                  onClick={() => setMode('specific')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                    mode === 'specific' 
                      ? 'bg-white text-rose-500 shadow-sm ring-1 ring-slate-200' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <User size={16} />
                  One Character
                </button>
              </div>
            </div>

            {/* Character Input (Conditional) */}
            <div className={`transition-all duration-300 overflow-hidden ${mode === 'specific' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
               <label className="block text-sm font-semibold text-slate-700 mb-2">
                Target Character <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={specificCharacter}
                onChange={(e) => setSpecificCharacter(e.target.value)}
                placeholder="e.g. Cat, Robot, Mushroom, Pikachu..."
                required={mode === 'specific'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none transition-all font-medium text-slate-700"
              />
            </div>

            {/* Concept & Style Selection */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Theme & Style
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {CONCEPT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        style === preset 
                          ? 'bg-rose-100 border-rose-300 text-rose-700 font-semibold' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-500'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-400">
                    <Sparkles size={16} />
                  </div>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="e.g. Kawaii, Halloween, Gothic..."
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none transition-all font-medium text-slate-700"
                  />
                </div>
            </div>

            {/* Colors Input */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Max Colors
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-400">
                     <Palette size={16} />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={colorCount}
                    onChange={(e) => setColorCount(parseInt(e.target.value) || 0)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none transition-all font-medium text-slate-700"
                  />
                </div>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-4" 
              disabled={images.length === 0 || (mode === 'specific' && !specificCharacter.trim())}
              isLoading={isLoading}
            >
              <ImageIcon size={20} />
              {images.length > 0 
                ? (mode === 'diverse' ? 'Synthesize Collection' : `Generate 10 ${specificCharacter || '...'}s`) 
                : 'Upload References First'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};