"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsPanel = SettingsPanel;
const react_1 = __importStar(require("react"));
function SettingsPanel({ preferences, theme, onSave, onClose }) {
    const [fileFormat, setFileFormat] = (0, react_1.useState)(preferences.fileFormat);
    const [exportPath, setExportPath] = (0, react_1.useState)(preferences.exportPath);
    const [nodeColor, setNodeColor] = (0, react_1.useState)(theme.nodeColor);
    const [nodeEntryColor, setNodeEntryColor] = (0, react_1.useState)(theme.nodeEntryColor);
    const [edgeColor, setEdgeColor] = (0, react_1.useState)(theme.edgeColor);
    const [edgeActiveColor, setEdgeActiveColor] = (0, react_1.useState)(theme.edgeActiveColor);
    const [canvasBackground, setCanvasBackground] = (0, react_1.useState)(theme.canvasBackground);
    const handleSave = () => {
        onSave({
            fileFormat,
            exportPath
        }, {
            nodeColor,
            nodeEntryColor,
            edgeColor,
            edgeActiveColor,
            canvasBackground
        });
    };
    return (<div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        
        <h3>Export Preferences</h3>
        
        <div className="form-group">
          <label>File Format:</label>
          <select value={fileFormat} onChange={(e) => setFileFormat(e.target.value)}>
            <option value="agent.md">.agent.md (default)</option>
            <option value="chatmode.md">.chatmode.md</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Export Path:</label>
          <select value={exportPath} onChange={(e) => setExportPath(e.target.value)}>
            <option value="agents">.github/agents (default)</option>
            <option value="chatmodes">.github/chatmodes</option>
          </select>
        </div>
        
        <h3>Theme Customization</h3>
        
        <div className="form-group">
          <label>Node Color:</label>
          <input type="color" value={nodeColor} onChange={(e) => setNodeColor(e.target.value)}/>
        </div>
        
        <div className="form-group">
          <label>Entry Node Color:</label>
          <input type="color" value={nodeEntryColor} onChange={(e) => setNodeEntryColor(e.target.value)}/>
        </div>
        
        <div className="form-group">
          <label>Edge Color:</label>
          <input type="color" value={edgeColor} onChange={(e) => setEdgeColor(e.target.value)}/>
        </div>
        
        <div className="form-group">
          <label>Active Edge Color:</label>
          <input type="color" value={edgeActiveColor} onChange={(e) => setEdgeActiveColor(e.target.value)}/>
        </div>
        
        <div className="form-group">
          <label>Canvas Background:</label>
          <input type="color" value={canvasBackground} onChange={(e) => setCanvasBackground(e.target.value)}/>
        </div>
        
        <div className="modal-actions">
          <button onClick={handleSave} className="primary">Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=SettingsPanel.js.map