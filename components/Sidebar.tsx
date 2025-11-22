
import React, { useMemo } from 'react';
import { Copy, Trash2, Layers, Download, Upload, Info, PieChart } from 'lucide-react';
// @ts-ignore
import { FaceLandmarker } from '@mediapipe/tasks-vision';

interface SidebarProps {
  selectedIndices: Set<number>;
  onClear: () => void;
  onSelectAll: () => void; 
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
  hasMesh: boolean;
}

interface FeatureMatch {
  name: string;
  count: number;
  total: number;
  percentage: number;
}

const getIndicesFromConnections = (connections: {start: number, end: number}[]) => {
  const set = new Set<number>();
  if (!connections) return set;
  connections.forEach(c => {
    set.add(c.start);
    set.add(c.end);
  });
  return set;
};

const Sidebar: React.FC<SidebarProps> = ({ 
  selectedIndices, 
  onClear, 
  onImageUpload, 
  isProcessing,
  hasMesh
}) => {
  // Cast to number[] to avoid TS inference issues with Set iteration in some environments
  const indicesArray = useMemo(() => 
    (Array.from(selectedIndices) as number[]).sort((a, b) => a - b), 
  [selectedIndices]);
  
  const formattedIndices = JSON.stringify(indicesArray);

  const analysis = useMemo(() => {
    if (indicesArray.length === 0 || !FaceLandmarker) return null;

    const selectionSet = new Set(indicesArray);

    // Define features using library constants
    const features = [
      { name: "Lips", set: getIndicesFromConnections(FaceLandmarker.FACE_LANDMARKS_LIPS) },
      { name: "Left Eye", set: getIndicesFromConnections(FaceLandmarker.FACE_LANDMARKS_LEFT_EYE) },
      { name: "Left Eyebrow", set: getIndicesFromConnections(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW) },
      { name: "Right Eye", set: getIndicesFromConnections(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE) },
      { name: "Right Eyebrow", set: getIndicesFromConnections(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW) },
      { name: "Face Oval", set: getIndicesFromConnections(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL) },
      // Note: Midline and Irises can be added if needed, but these are the main ones
    ];

    const matches: FeatureMatch[] = [];
    let categorizedPoints = 0;

    features.forEach(feature => {
      let count = 0;
      feature.set.forEach(idx => {
        if (selectionSet.has(idx)) count++;
      });

      if (count > 0) {
        matches.push({
          name: feature.name,
          count,
          total: feature.set.size,
          percentage: Math.round((count / feature.set.size) * 100)
        });
        categorizedPoints += count;
      }
    });

    // Sort by highest percentage match
    matches.sort((a, b) => b.percentage - a.percentage);

    return {
      matches,
      uncategorized: Math.max(0, indicesArray.length - categorizedPoints) // Simple approximation
    };
  }, [indicesArray]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedIndices);
  };

  const handleDownload = () => {
     const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(indicesArray));
     const downloadAnchorNode = document.createElement('a');
     downloadAnchorNode.setAttribute("href",     dataStr);
     downloadAnchorNode.setAttribute("download", "facemesh_indices.json");
     document.body.appendChild(downloadAnchorNode); // required for firefox
     downloadAnchorNode.click();
     downloadAnchorNode.remove();
  }

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full shrink-0 z-20 shadow-xl">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-transparent bg-clip-text">
            FaceMesh
          </span> Studio
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Programmatic selection & mapping.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Upload Section */}
        <section>
          <h2 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <Upload size={14} /> Source Image
          </h2>
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 transition-colors group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                {isProcessing ? 'Processing...' : 'Click to upload'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">JPG, PNG</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={onImageUpload}
              disabled={isProcessing}
            />
          </label>
        </section>

        {/* Selection Stats */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-300">Selection</h2>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
              {selectedIndices.size} points
            </span>
          </div>
          
          <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800 min-h-[100px] max-h-[150px] overflow-y-auto font-mono text-xs text-zinc-400 break-words">
            {selectedIndices.size > 0 ? (
               indicesArray.join(', ')
            ) : (
              <span className="text-zinc-600 italic">No points selected...</span>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button 
              onClick={handleCopy}
              disabled={selectedIndices.size === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs py-2 rounded-md transition-colors disabled:opacity-50"
            >
              <Copy size={12} /> Copy
            </button>
            <button 
              onClick={handleDownload}
              disabled={selectedIndices.size === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs py-2 rounded-md transition-colors disabled:opacity-50"
            >
              <Download size={12} /> JSON
            </button>
            <button 
              onClick={onClear}
              disabled={selectedIndices.size === 0}
              className="px-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-md transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </section>

        {/* Programmatic Analysis */}
        {selectedIndices.size > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <PieChart size={14} className="text-emerald-400"/> Topology Analysis
              </h2>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
              {analysis && analysis.matches.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.matches.map((match) => (
                    <li key={match.name} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 flex items-center gap-2">
                        <Layers size={10} className="text-zinc-500"/> {match.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">{match.count}/{match.total}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          match.percentage > 80 ? 'bg-emerald-900/30 text-emerald-400' : 
                          match.percentage > 40 ? 'bg-blue-900/30 text-blue-400' :
                          'bg-zinc-700 text-zinc-400'
                        }`}>
                          {match.percentage}%
                        </span>
                      </div>
                    </li>
                  ))}
                  {analysis.uncategorized > 0 && (
                     <li className="flex items-center justify-between text-xs pt-2 border-t border-zinc-700/50">
                       <span className="text-zinc-400 italic">Uncategorized points (approx)</span>
                       <span className="text-zinc-500">{analysis.uncategorized}</span>
                     </li>
                  )}
                </ul>
              ) : (
                <div className="text-center py-2">
                   <p className="text-xs text-zinc-500">Selected points do not match any major predefined regions (Eyes, Lips, Contour).</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Instructions */}
        {!hasMesh && !isProcessing && (
           <div className="p-4 bg-emerald-900/10 border border-emerald-900/30 rounded-lg">
             <div className="flex gap-2 items-start">
               <Info className="text-emerald-400 shrink-0 mt-0.5" size={16} />
               <p className="text-xs text-emerald-200/80 leading-relaxed">
                 Upload an image to detect the 468-point face mesh. Once detected, click points on the mesh to select them.
               </p>
             </div>
           </div>
        )}

      </div>

      <div className="p-4 border-t border-zinc-800 text-center">
        <p className="text-[10px] text-zinc-600">MediaPipe Face Mesh • 468 Landmarks</p>
      </div>
    </div>
  );
};

export default Sidebar;
