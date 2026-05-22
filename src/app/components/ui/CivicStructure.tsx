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

// Map each cluster to a central coordinate on the grid
const CLUSTER_CENTERS: Record<string, { x: number; y: number; color: string }> = {
  "Road Issues": { x: 30, y: 30, color: "#FFA958" },      // Peach
  "Sanitation": { x: -30, y: 30, color: "#f97316" },      // Coral
  "Water Supply": { x: -30, y: -30, color: "#a8e6cf" },   // Mint
  "General Issues": { x: 30, y: -30, color: "#e2e8f0" },  // Soft gray
};

const DEFAULT_CENTER = { x: 0, y: 0, color: "#cbd5e1" };

export function CivicStructure({
  complaints,
  systemState,
  activeClusterId,
  recentlyAddedId
}: CivicStructureProps) {
  // Deterministic positioning around a cluster center
  const getGridPosition = (clusterId: string, index: number, total: number, state: SystemState) => {
    const center = CLUSTER_CENTERS[clusterId] || DEFAULT_CENTER;
    
    // Base spacing
    let spacing = 20;
    
    // If clustering state, tighter packing
    if (state === 'clustering') {
      spacing = 12;
    } else if (state === 'negotiation' && activeClusterId === clusterId) {
      spacing = 25; // Expands during negotiation
    }
    
    // Simple spiral algorithm for placement
    const angle = index * (Math.PI * 2.39996); // Golden angle
    const radius = Math.sqrt(index) * spacing;
    
    let x = center.x + Math.cos(angle) * radius;
    let y = center.y + Math.sin(angle) * radius;
    let z = 0;

    // Apply specific state effects
    if (state === 'negotiation' && activeClusterId === clusterId) {
      // "One part separates slightly, shifts, and reconnects"
      if (index % 3 === 0) {
        x += 10;
        y += 10;
        z += 15;
      }
    }

    if (state === 'response' && activeClusterId === clusterId) {
      // Lift slightly
      z += Math.sin(index) * 5 + 5;
    }

    return { x, y, z, color: center.color };
  };

  const units = useMemo(() => {
    const clusterCounts: Record<string, number> = {};
    return complaints.map((c) => {
      if (!clusterCounts[c.cluster_id]) clusterCounts[c.cluster_id] = 0;
      const index = clusterCounts[c.cluster_id]++;
      const pos = getGridPosition(c.cluster_id, index, complaints.length, systemState);
      
      return {
        id: c.id,
        cluster: c.cluster_id,
        ...pos,
        isNew: c.id === recentlyAddedId
      };
    });
  }, [complaints, systemState, activeClusterId, recentlyAddedId]);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-0" style={{ perspective: '1000px' }}>
      {/* Container with isometric transform */}
      <motion.div 
        className="relative w-0 h-0"
        initial={{ rotateX: 60, rotateZ: -45 }}
        animate={{ 
          rotateX: 60, 
          rotateZ: systemState === 'idle' ? -45 : -40,
          scale: systemState === 'clustering' ? 1.05 : 1
        }}
        transition={{ duration: 3, ease: "easeInOut" }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {units.map((unit) => {
          // Stagger delays based on state
          const isTargetCluster = activeClusterId === unit.cluster;
          
          let animation = {
            x: unit.x,
            y: unit.y,
            z: unit.z,
            scale: 1,
            opacity: 0.85,
          };

          if (systemState === 'response' && isTargetCluster) {
            animation.scale = [1, 1.2, 1];
            animation.opacity = [0.85, 1, 0.85];
          }

          const isNewDrop = systemState === 'submitting' && unit.isNew;

          return (
            <motion.div
              key={unit.id}
              className="absolute w-8 h-8 -ml-4 -mt-4 rounded-sm"
              initial={isNewDrop ? { x: unit.x, y: unit.y, z: 200, opacity: 0, scale: 0.5 } : { x: unit.x, y: unit.y, z: unit.z, opacity: 0.85, scale: 1 }}
              animate={animation}
              transition={{
                type: "spring",
                stiffness: isNewDrop ? 150 : 60,
                damping: isNewDrop ? 12 : 15,
                mass: 1,
                // Add a subtle wave delay for response
                delay: (systemState === 'response' && isTargetCluster) ? Math.random() * 0.4 : 0
              }}
              style={{
                transformStyle: 'preserve-3d',
                background: `linear-gradient(135deg, ${unit.color} 0%, rgba(255,255,255,0.4) 100%)`,
                boxShadow: `
                  -2px 2px 5px rgba(0,0,0,0.05),
                  0px 0px 15px ${unit.color}40,
                  inset 1px 1px 2px rgba(255,255,255,0.8)
                `,
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.5)"
              }}
            >
              {/* Fake thickness for the cube using pseudo-elements wouldn't work easily with motion.div inline styles. 
                  We use thick borders/box-shadows to simulate depth. */}
              <div 
                className="absolute inset-0 bg-white/20" 
                style={{
                  transform: "translateZ(-4px)",
                  boxShadow: "0 0 10px rgba(0,0,0,0.1)"
                }}
              />
            </motion.div>
          );
        })}

        {/* Ambient base glow */}
        <div 
          className="absolute -left-32 -top-32 w-64 h-64 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,169,88,0.15) 0%, transparent 70%)",
            filter: "blur(30px)",
            transform: "translateZ(-20px)"
          }}
        />
      </motion.div>
    </div>
  );
}
