import { Node, Edge } from '@xyflow/react';

// Simple grid layout - 3 columns max
const COLS = 3;
const COL_WIDTH = 400;
const ROW_HEIGHT = 300;
const START_X = 50;
const START_Y = 50;

export async function applyElkLayout(nodes: Node[], edges: Edge[]): Promise<Node[]> {
  if (nodes.length === 0) return nodes;

  console.log(`[Layout] Simple grid layout for ${nodes.length} nodes`);
  
  // Just arrange in a simple grid
  const layoutedNodes: Node[] = nodes.map((node, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const x = START_X + (col * COL_WIDTH);
    const y = START_Y + (row * ROW_HEIGHT);
    
    console.log(`[Layout] Node ${index} "${node.data?.name}": row=${row}, col=${col} -> (${x}, ${y})`);
    
    return {
      id: node.id,
      type: node.type,
      data: node.data,
      position: { x, y },
      draggable: true,
      selectable: true
    } as Node;
  });

  return layoutedNodes;
}
