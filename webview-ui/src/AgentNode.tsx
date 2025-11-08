import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export function AgentNode({ data }: NodeProps) {
  return (
    <div 
      className={`agent-node ${data.isEntryPoint ? 'entry-point' : ''}`}
      onClick={(e) => {
        // Only trigger edit if not clicking on buttons
        if (!(e.target as HTMLElement).closest('button')) {
          data.onEdit();
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="agent-header">
        {data.isEntryPoint && <span className="entry-badge">Entry</span>}
        <h3>{data.name}</h3>
      </div>
      
      <div className="agent-body">
        {data.description && <p className="description">{data.description}</p>}
        {data.model && <div className="model">Model: {data.model}</div>}
        {data.tools && data.tools.length > 0 && (
          <div className="tools">
            Tools: {data.tools.length}
          </div>
        )}
      </div>
      
      <div className="agent-actions">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit();
          }} 
          title="Edit Agent">✏️</button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleEntry();
          }} 
          title="Toggle Entry Point">🏁</button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete();
          }} 
          title="Delete Agent">🗑️</button>
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
