import React, { useState, useCallback } from 'react';
import { InputSection } from './components/InputSection';
import { ConceptCard } from './components/ConceptCard';
import { Concept, GenerationStatus } from './types';
import { generateConcepts, generateConceptImage } from './services/geminiService';
import { Button } from './components/Button';
import { ArrowLeft, RefreshCw, Download } from 'lucide-react';
import JSZip from 'jszip';

// Helper to convert data URL to Blob
async function dataURLtoBlob(dataurl: string): Promise<Blob> {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error('Invalid data URL');
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// Helper to sanitize filenames
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9\s\-\_]/gi, '') // Remove invalid characters
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .toLowerCase();                 // Convert to lowercase
}

const App: React.FC = () => {
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inputData, setInputData] = useState<{images: string[], colorCount: number, style: string} | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);

  const handleGenerateConcepts = async (
    images: string[], 
    colorCount: number, 
    style: string,
    mode: 'diverse' | 'specific',
    specificCharacter: string
  ) => {
    setStatus(GenerationStatus.GENERATING_CONCEPTS);
    setError(null);
    setInputData({ images, colorCount, style });

    try {
      const generatedConcepts = await generateConcepts(images, colorCount, style, mode, specificCharacter);
      setConcepts(generatedConcepts);
      setStatus(GenerationStatus.COMPLETE);
      
      // Auto-trigger image generation for all concepts in the background
      generateAllImages(generatedConcepts);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const generateAllImages = async (currentConcepts: Concept[]) => {
      // Create a copy to update state
      let updatedConcepts = [...currentConcepts];
      
      for (let i = 0; i < updatedConcepts.length; i++) {
          // Update state to show loading for this specific card
          setConcepts(prev => prev.map((c, idx) => idx === i ? { ...c, isGeneratingImage: true } : c));
          
          try {
              const imageUrl = await generateConceptImage(updatedConcepts[i]);
              
              setConcepts(prev => prev.map((c, idx) => idx === i ? { ...c, imageUrl, isGeneratingImage: false } : c));
          } catch (e) {
              console.error(`Failed to generate image for index ${i}`, e);
               setConcepts(prev => prev.map((c, idx) => idx === i ? { ...c, isGeneratingImage: false } : c));
          }
      }
  };

  const handleSingleImageGeneration = async (index: number) => {
      const concept = concepts[index];
      if (concept.imageUrl || concept.isGeneratingImage) return;

      setConcepts(prev => prev.map((c, idx) => idx === index ? { ...c, isGeneratingImage: true } : c));

      try {
          const imageUrl = await generateConceptImage(concept);
          setConcepts(prev => prev.map((c, idx) => idx === index ? { ...c, imageUrl, isGeneratingImage: false } : c));
      } catch (e) {
          console.error("Failed to generate single image", e);
          setConcepts(prev => prev.map((c, idx) => idx === index ? { ...c, isGeneratingImage: false } : c));
      }
  };

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    setError(null);
    try {
      const zip = new JSZip();
      const folderNames = new Set<string>();

      for (const concept of concepts) {
        let baseFolderName = sanitizeFilename(concept.name || 'untitled_concept');
        let folderName = baseFolderName;
        let suffix = 0;
        while (folderNames.has(folderName)) {
          suffix++;
          folderName = `${baseFolderName}_${suffix}`;
        }
        folderNames.add(folderName);

        const conceptFolder = zip.folder(folderName);

        // Add image
        if (concept.imageUrl) {
          try {
            const imageBlob = await dataURLtoBlob(concept.imageUrl);
            const imageExtension = imageBlob.type.split('/')[1] || 'png';
            conceptFolder?.file(`image.${imageExtension}`, imageBlob);
          } catch (imgErr) {
            console.warn(`Could not add image for concept "${concept.name}":`, imgErr);
          }
        }

        const { isGeneratingImage, imageUrl, ...infoDataWithoutTransient } = concept;
        const infoData = infoDataWithoutTransient;
        conceptFolder?.file('info.json', JSON.stringify(infoData, null, 2));
      }

      const content = await zip.generateAsync({ type: "blob" });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'Amigurumi_Concepts.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create or download zip file.");
      console.error("Download All Error:", err);
    } finally {
      setIsDownloadingAll(false);
    }
  };


  const resetApp = () => {
    setStatus(GenerationStatus.IDLE);
    setConcepts([]);
    setError(null);
    setInputData(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-rose-200 selection:text-rose-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 bg-opacity-80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-400 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
              A
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-rose-400 to-indigo-400 bg-clip-text text-transparent">
              Amigurumi Architect
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
            AI-Powered Crochet Assistant
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {status === GenerationStatus.IDLE || status === GenerationStatus.GENERATING_CONCEPTS ? (
          <div className={`transition-all duration-500 ${status === GenerationStatus.GENERATING_CONCEPTS ? 'opacity-50 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
            <InputSection 
              onGenerate={handleGenerateConcepts} 
              isLoading={status === GenerationStatus.GENERATING_CONCEPTS} 
            />
            {status === GenerationStatus.GENERATING_CONCEPTS && (
               <div className="fixed inset-0 flex flex-col items-center justify-center z-40">
                  <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl flex flex-col items-center border border-rose-100">
                    <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
                    <h3 className="text-xl font-bold text-slate-800">Synthesizing patterns...</h3>
                    <p className="text-slate-500 mt-2">Extracting stylistic DNA from your references.</p>
                  </div>
               </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Results Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
               <div>
                  <button 
                    onClick={resetApp}
                    className="flex items-center gap-2 text-slate-500 hover:text-rose-500 transition-colors mb-2 group"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Upload
                  </button>
                  <h2 className="text-3xl font-bold text-slate-800">Generated Concepts</h2>
                  <p className="text-slate-500 mt-1">
                    Based on {inputData?.images.length} references • {inputData?.style} theme • {inputData?.colorCount} colors
                  </p>
               </div>
               
               <div className="flex gap-3">
                  <Button variant="outline" onClick={() => generateAllImages(concepts)} disabled={concepts.every(c => c.imageUrl)}>
                    <RefreshCw size={18} /> Regenerate Missing Images
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleDownloadAll} 
                    isLoading={isDownloadingAll}
                    disabled={concepts.length === 0 || concepts.some(c => c.isGeneratingImage)}
                  >
                    <Download size={18} /> Download All Outputs
                  </Button>
               </div>
            </div>
            
            {/* Error Message */}
            {error && (
               <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">&times;</button>
               </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {concepts.map((concept, index) => (
                <ConceptCard 
                  key={index} 
                  concept={concept} 
                  onGenerateImage={() => handleSingleImageGeneration(index)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;