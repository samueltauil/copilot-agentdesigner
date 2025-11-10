import React, { useState } from 'react';

interface SettingsPanelProps {
  preferences: {
    fileFormat: 'agent.md' | 'chatmode.md';
    exportPath: 'agents' | 'chatmodes';
  };
  theme: {
    nodeColor: string;
    nodeEntryColor: string;
    edgeColor: string;
    edgeActiveColor: string;
    canvasBackground: string;
  };
  onSave: (preferences: any, theme: any) => void;
  onClose: () => void;
}

export function SettingsPanel({ preferences, theme, onSave, onClose }: SettingsPanelProps) {
  const [fileFormat, setFileFormat] = useState(preferences.fileFormat);
  const [exportPath, setExportPath] = useState(preferences.exportPath);
  const [nodeColor, setNodeColor] = useState(theme.nodeColor);
  const [nodeEntryColor, setNodeEntryColor] = useState(theme.nodeEntryColor);
  const [edgeColor, setEdgeColor] = useState(theme.edgeColor);
  const [edgeActiveColor, setEdgeActiveColor] = useState(theme.edgeActiveColor);
  const [canvasBackground, setCanvasBackground] = useState(theme.canvasBackground);

  const handleSave = () => {
    onSave(
      {
        fileFormat,
        exportPath
      },
      {
        nodeColor,
        nodeEntryColor,
        edgeColor,
        edgeActiveColor,
        canvasBackground
      }
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        
        <h3>Export Preferences</h3>
        
        <div className="form-group">
          <label>File Format:</label>
          <select value={fileFormat} onChange={(e) => setFileFormat(e.target.value as any)}>
            <option value="agent.md">.agent.md (recommended)</option>
            <option value="chatmode.md">.chatmode.md (for chat modes)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Export Path:</label>
          <select value={exportPath} onChange={(e) => setExportPath(e.target.value as any)}>
            <option value="agents">.github/agents (default)</option>
            <option value="chatmodes">.github/chatmodes</option>
          </select>
        </div>
        
        <h3>Theme Customization</h3>
        
        <div className="form-group">
          <label>Node Color:</label>
          <input type="color" value={nodeColor} onChange={(e) => setNodeColor(e.target.value)} />
        </div>
        
        <div className="form-group">
          <label>Entry Node Color:</label>
          <input type="color" value={nodeEntryColor} onChange={(e) => setNodeEntryColor(e.target.value)} />
        </div>
        
        <div className="form-group">
          <label>Edge Color:</label>
          <input type="color" value={edgeColor} onChange={(e) => setEdgeColor(e.target.value)} />
        </div>
        
        <div className="form-group">
          <label>Active Edge Color:</label>
          <input type="color" value={edgeActiveColor} onChange={(e) => setEdgeActiveColor(e.target.value)} />
        </div>
        
        <div className="form-group">
          <label>Canvas Background:</label>
          <input type="color" value={canvasBackground} onChange={(e) => setCanvasBackground(e.target.value)} />
        </div>
        
        <div className="modal-actions">
          <button onClick={handleSave} className="primary">Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
