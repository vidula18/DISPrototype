import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Complaint } from '../../App';

export type SystemState = 'idle' | 'submitting' | 'clustering' | 'response' | 'negotiation' | 'progress';

interface CivicStructureProps {
  complaints: Complaint[];
  systemState: SystemState;
  activeClusterId?: string | null;
  recentlyAddedId?: string | null;
}

// Map each cluster to a specific color from the reference
const CLUSTER_COLORS: Record<string, string> = {
  "Road Issues": "#F7A072",      // Peach/Orange
  "Sanitation": "#A67C74",       // Earthy Brown
  "Water Supply": "#A1CBA4",     // Mint Green
  "General Issues": "#F2D8B3",   // Light Sand
};

const DEFAULT_COLOR = "#D1C8C1";

// Grid configuration for isometric layout
const CUBE_SIZE = 32;
const SPACING = CUBE_SIZE;

// Calculate deterministic grid positions that look like the reference clusters
function getGridPosition(clusterId: string, index: number, state: SystemState, activeClusterId?: string | null) {
  // Base coordinates for different clusters to form separate islands initially
  const centers: Record<string, { x: number, y: number }> = {
    "Road Issues": { x: 2, y: 2 },
    "Sanitation": { x: -3, y: 4 },
    "Water Supply": { x: -2, y: -2 },
    "General Issues": { x: 4, y: -2 },
  };

  const center = centers[clusterId] || { x: 0, y: 0 };
  
  // Create a structured but organic looking cluster
  // We'll use a spiral pattern on a grid
  let dx = 0, dy = 0, dz = 0;
  
  if (index > 0) {
    // Math to place cubes in a layered grid pattern (x, y, z steps)
    const layer = Math.floor(Math.pow(index, 1/3));
    const remainder = index - Math.pow(layer, 3);
    const side = Math.floor(Math.sqrt(remainder));
    
    // Simple pseudo-random but deterministic placement around center
    const hash = (index * 137) % 5;
    if (hash === 0) { dx = layer; dy = side; }
    else if (hash === 1) { dx = -side; dy = layer; }
    else if (hash === 2) { dx = -layer; dy = -side; dz = 1; }
    else if (hash === 3) { dx = side; dy = -layer; }
    else { dx = 0; dy = 0; dz = layer; }
  }

  let x = (center.x + dx) * SPACING;
  let y = (center.y + dy) * SPACING;
  let z = dz * CUBE_SIZE;

  // Apply state effects
  if (state === 'clustering') {
    // Pull everything slightly tighter towards 0,0
    x = x * 0.85;
    y = y * 0.85;
  } else if (state === 'negotiation' && activeClusterId === clusterId) {
    // Separate one part
    if (index % 3 === 0) {
      x += SPACING * 1.5;
      y += SPACING * 1.5;
      z += CUBE_SIZE;
    }
  } else if (state === 'response' && activeClusterId === clusterId) {
    z += Math.sin(index) * 10 + 10;
  }

  return { x, y, z };
}

// True 3D Cube Component
const Cube = ({ x, y, z, color, isNew, delay = 0, systemState }: { x: number, y: number, z: number, color: string, isNew: boolean, delay?: number, systemState: SystemState }) => {
  const size = CUBE_SIZE;
  
  let animation = {
    x, y, z,
    opacity: 1,
    scale: 1
  };

  if (systemState === 'response') {
    animation.z = [z, z + 20, z];
  }

  return (
    <motion.div
      className="absolute"
      initial={isNew ? { x, y, z: z + 300, opacity: 0, scale: 0.5 } : { x, y, z, opacity: 0, scale: 0.8 }}
      animate={animation}
      transition={{
        type: "spring",
        stiffness: isNew ? 120 : 60,
        damping: isNew ? 15 : 20,
        delay: isNew ? 0.2 : delay, // Stagger intro
      }}
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
        // Center the cube on its coordinate
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
    >
      {/* Top Face - Lightest (Light source from top) */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: color,
          transform: `translateZ(${size}px)`,
          border: '1px solid rgba(255,255,255,0.1)',
        }} 
      />
      
      {/* Right Face - Darkest (Shadow) */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: color,
          filter: 'brightness(0.65)',
          transform: `translateX(${size/2}px) translateZ(${size/2}px) rotateY(90deg)`,
          border: '1px solid rgba(0,0,0,0.05)',
        }} 
      />
      
      {/* Front/Left Face - Medium */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: color,
          filter: 'brightness(0.85)',
          transform: `translateY(${size/2}px) translateZ(${size/2}px) rotateX(-90deg)`,
          border: '1px solid rgba(0,0,0,0.05)',
        }} 
      />
    </motion.div>
  );
};

export function CivicStructure({
  complaints,
  systemState,
  activeClusterId,
  recentlyAddedId
}: CivicStructureProps) {
  
  const units = useMemo(() => {
    const clusterCounts: Record<string, number> = {};
    return complaints.map((c) => {
      if (!clusterCounts[c.cluster_id]) clusterCounts[c.cluster_id] = 0;
      const index = clusterCounts[c.cluster_id]++;
      const pos = getGridPosition(c.cluster_id, index, systemState, activeClusterId);
      
      return {
        id: c.id,
        cluster: c.cluster_id,
        color: CLUSTER_COLORS[c.cluster_id] || DEFAULT_COLOR,
        ...pos,
        isNew: c.id === recentlyAddedId,
        // Sort index for stagger
        delay: (index * 0.05) + (Math.random() * 0.1)
      };
    });
  }, [complaints, systemState, activeClusterId, recentlyAddedId]);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-0" style={{ perspective: '1200px' }}>
      
      {/* Ambient background glow from reference */}
      <motion.div 
        className="absolute w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_rgba(255,218,185,0.4)_0%,_rgba(255,240,225,0)_70%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Main 3D Container with Isometric Transform */}
      <motion.div 
        className="relative w-0 h-0"
        initial={{ rotateX: 60, rotateZ: -45, scale: 0.9, y: 50 }}
        animate={{ 
          rotateX: 60, 
          rotateZ: systemState === 'clustering' ? -35 : -45, // Subtle rotation on cluster
          scale: 1,
          y: 0
        }}
        transition={{ duration: 2, ease: "easeOut" }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Sort units by Z and Y to help browser rendering depth (though preserve-3d should handle it) */}
        {units
          .sort((a, b) => (a.z + a.x + a.y) - (b.z + b.x + b.y))
          .map((unit) => (
            <Cube 
              key={unit.id}
              x={unit.x}
              y={unit.y}
              z={unit.z}
              color={unit.color}
              isNew={unit.isNew}
              delay={unit.delay}
              systemState={systemState}
            />
          ))}
      </motion.div>
    </div>
  );
}
