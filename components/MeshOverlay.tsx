import React, { memo, useMemo } from 'react';
import { Landmark } from '../types';
// @ts-ignore
import { FaceLandmarker } from '@mediapipe/tasks-vision';

interface MeshOverlayProps {
  landmarks: Landmark[];
  width: number;
  height: number;
  selectedIndices: Set<number>;
  onPointClick: (index: number) => void;
  scale: number;
}

// Memoize to prevent re-rendering 468 points unnecessarily on parent re-renders
const MeshOverlay: React.FC<MeshOverlayProps> = memo(({
  landmarks,
  width,
  height,
  selectedIndices,
  onPointClick,
  scale
}) => {
  if (!landmarks || landmarks.length === 0) return null;

  // Calculate dynamic radius based on image size
  const pointRadius = Math.max(width / 300, 2); 

  // Generate edges based on MediaPipe's tessellation
  const edges = useMemo(() => {
    // Safety check if static constant is available
    if (!FaceLandmarker?.FACE_LANDMARKS_TESSELATION) return null;

    return FaceLandmarker.FACE_LANDMARKS_TESSELATION.map((conn: {start: number, end: number}, i: number) => {
      const start = landmarks[conn.start];
      const end = landmarks[conn.end];
      // Safety check if indices exist in our result
      if (!start || !end) return null;

      return (
        <line
          key={`edge-${i}`}
          x1={start.x * width}
          y1={start.y * height}
          x2={end.x * width}
          y2={end.y * height}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={0.5}
          pointerEvents="none"
        />
      );
    });
  }, [landmarks, width, height]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute top-0 left-0 pointer-events-none" // Overlay
      style={{
        width: width,
        height: height
      }}
    >
      {/* Edges Layer */}
      <g>
        {edges}
      </g>

      {/* Points Layer */}
      <g>
        {landmarks.map((point, index) => {
          const isSelected = selectedIndices.has(index);
          const cx = point.x * width;
          const cy = point.y * height;

          return (
            <circle
              key={index}
              cx={cx}
              cy={cy}
              r={isSelected ? pointRadius * 1.5 : pointRadius}
              fill={isSelected ? '#10b981' : '#ffffff'} // Solid white for unselected to be clearer
              stroke={isSelected ? '#065f46' : 'transparent'}
              strokeWidth={isSelected ? 1 : 0}
              className={`transition-colors duration-150 ease-in-out cursor-pointer pointer-events-auto hover:opacity-100`}
              style={{ opacity: isSelected ? 1 : 0.75 }} // Increased base opacity for visibility
              onMouseEnter={(e) => {
                e.currentTarget.setAttribute('fill', isSelected ? '#34d399' : '#f4f4f5');
                e.currentTarget.setAttribute('r', (pointRadius * 1.8).toString());
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.setAttribute('fill', isSelected ? '#10b981' : '#ffffff');
                e.currentTarget.setAttribute('r', (isSelected ? pointRadius * 1.5 : pointRadius).toString());
                e.currentTarget.style.opacity = isSelected ? '1' : '0.75';
              }}
              onClick={(e) => {
                e.stopPropagation();
                onPointClick(index);
              }}
            >
              <title>Index: {index}</title>
            </circle>
          );
        })}
      </g>
    </svg>
  );
});

export default MeshOverlay;