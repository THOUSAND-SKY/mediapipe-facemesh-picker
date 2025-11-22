import React, { useState, useRef, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Sidebar from './components/Sidebar';
import MeshOverlay from './components/MeshOverlay';
import { faceMeshService } from './services/faceMeshService';
import { Landmark } from './types';

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true);
    setLandmarks([]);
    setSelectedIndices(new Set());

    const url = URL.createObjectURL(file);
    setImageSrc(url);

    const img = new Image();
    img.src = url;
    img.onload = async () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      try {
        const result = await faceMeshService.processImage(img);
        if (result.multiFaceLandmarks.length > 0) {
          setLandmarks(result.multiFaceLandmarks[0]);
        } else {
          alert("No face detected in the image. Please try a clearer photo.");
        }
      } catch (error) {
        console.error("FaceMesh Error:", error);
        alert("Failed to process image mesh. See console for details.");
      } finally {
        setIsProcessing(false);
      }
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const togglePointSelection = useCallback((index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar 
        selectedIndices={selectedIndices}
        onClear={clearSelection}
        onSelectAll={() => {}} // Placeholder
        onImageUpload={handleImageUpload}
        isProcessing={isProcessing}
        hasMesh={landmarks.length > 0}
      />

      <main className="flex-1 relative overflow-hidden flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950">
        {!imageSrc ? (
          <div className="text-center p-10 opacity-40">
            <div className="w-24 h-24 border-4 border-zinc-700 border-dashed rounded-full mx-auto mb-4 animate-pulse"></div>
            <h3 className="text-2xl font-bold text-zinc-600">Waiting for Image</h3>
            <p className="text-zinc-500">Upload a face image to begin</p>
          </div>
        ) : (
          <TransformWrapper
            initialScale={1}
            minScale={0.1}
            maxScale={8}
            centerOnInit
            wheel={{ step: 0.1 }}
          >
            {({ zoomIn, zoomOut, resetTransform, instance }) => (
              <>
                {/* Floating Controls for Canvas */}
                <div className="absolute top-4 right-4 z-10 flex gap-2 bg-zinc-900/80 backdrop-blur p-1 rounded-lg border border-zinc-700/50 shadow-lg">
                  <button onClick={() => zoomIn()} className="p-2 hover:bg-zinc-700 rounded text-zinc-300">+</button>
                  <button onClick={() => zoomOut()} className="p-2 hover:bg-zinc-700 rounded text-zinc-300">-</button>
                  <button onClick={() => resetTransform()} className="p-2 hover:bg-zinc-700 rounded text-zinc-300 text-xs px-3">Fit</button>
                </div>

                {/* Removed !w-full !h-full from contentClass to prevent flex shrinking the image container */}
                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!flex !items-center !justify-center">
                  {/* Added shrink-0 to prevent flexbox from squashing the container if image is large */}
                  <div 
                    className="relative shadow-2xl shadow-black/50 shrink-0" 
                    style={{ width: imageDimensions.width, height: imageDimensions.height }}
                  >
                    {/* The Image */}
                    <img 
                      src={imageSrc} 
                      alt="Face Source" 
                      className="block w-full h-full object-contain pointer-events-none select-none"
                    />
                    
                    {/* The Mesh Overlay */}
                    {landmarks.length > 0 && (
                      <MeshOverlay 
                        landmarks={landmarks}
                        width={imageDimensions.width}
                        height={imageDimensions.height}
                        selectedIndices={selectedIndices}
                        onPointClick={togglePointSelection}
                        scale={instance?.transformState?.scale ?? 1}
                      />
                    )}

                    {/* Loading Overlay */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-50">
                        <div className="text-emerald-400 font-mono text-xl font-bold animate-pulse">Detecting Mesh...</div>
                      </div>
                    )}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}
      </main>
    </div>
  );
};

export default App;