import React from 'react';
import { Concept } from '../types';
import { Download, Ruler, Disc, Box, Loader2 } from 'lucide-react';

interface ConceptCardProps {
  concept: Concept;
  onGenerateImage?: () => void;
}

export const ConceptCard: React.FC<ConceptCardProps> = ({ concept, onGenerateImage }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
      {/* Image Area */}
      <div className="relative aspect-square bg-slate-50 border-b border-slate-100 overflow-hidden">
        {concept.imageUrl ? (
          <img 
            src={concept.imageUrl} 
            alt={concept.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
             {concept.isGeneratingImage ? (
               <div className="flex flex-col items-center gap-3 animate-pulse text-rose-400">
                 <Loader2 className="w-10 h-10 animate-spin" />
                 <span className="text-sm font-medium">Knitting pixels...</span>
               </div>
             ) : (
                <div className="flex flex-col items-center gap-3">
                   <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                     <span className="text-3xl">🧶</span>
                   </div>
                   <p className="text-sm">Image not generated yet</p>
                </div>
             )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-slate-800 mb-2">{concept.name}</h3>
        <p className="text-slate-600 text-sm mb-4 leading-relaxed line-clamp-3 flex-grow">
          {concept.description}
        </p>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
                <div className="p-1 bg-white rounded shadow-sm text-rose-400">
                    <Disc size={14} />
                </div>
                <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Colors</span>
                    <span className="font-medium">{concept.colorScheme}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
                <div className="p-1 bg-white rounded shadow-sm text-teal-400">
                    <Ruler size={14} />
                </div>
                <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Size</span>
                    <span className="font-medium">{concept.size}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 text-slate-700 col-span-2">
                <div className="p-1 bg-white rounded shadow-sm text-indigo-400">
                     <Box size={14} />
                </div>
                 <div className="flex flex-col w-full">
                    <div className="flex justify-between w-full">
                         <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Yarn</span>
                         <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hook</span>
                    </div>
                    <div className="flex justify-between w-full font-medium">
                        <span>{concept.yarn}</span>
                        <span>{concept.hook}</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Actions */}
        <div className="mt-auto pt-2">
            {!concept.imageUrl && !concept.isGeneratingImage && onGenerateImage && (
                <button 
                  onClick={onGenerateImage}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                    Generate Visual
                </button>
            )}
             {concept.imageUrl && (
                <a 
                  href={concept.imageUrl} 
                  download={`amigurumi-${concept.name.replace(/\s+/g, '-').toLowerCase()}.png`}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                   <Download size={14} /> Save Image
                </a>
            )}
        </div>
      </div>
    </div>
  );
};