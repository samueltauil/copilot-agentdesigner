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
exports.HandoffModal = HandoffModal;
const react_1 = __importStar(require("react"));
function HandoffModal({ handoff, onSave, onClose }) {
    const [label, setLabel] = (0, react_1.useState)(handoff.label);
    const [prompt, setPrompt] = (0, react_1.useState)(handoff.prompt);
    const [send, setSend] = (0, react_1.useState)(handoff.send);
    const handleSave = () => {
        onSave({
            ...handoff,
            label,
            prompt,
            send
        });
    };
    return (<div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Handoff</h2>
        
        <div className="form-group">
          <label>Button Label:</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g., Start Implementation"/>
        </div>
        
        <div className="form-group">
          <label>Prompt Message:</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Now implement the plan outlined above." rows={4}/>
        </div>
        
        <div className="form-group checkbox">
          <label>
            <input type="checkbox" checked={send} onChange={(e) => setSend(e.target.checked)}/>
            Auto-send (submit prompt automatically)
          </label>
        </div>
        
        <div className="modal-actions">
          <button onClick={handleSave} className="primary">Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=HandoffModal.js.map