"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentNode = AgentNode;
const react_1 = __importDefault(require("react"));
const react_2 = require("@xyflow/react");
function AgentNode({ data }) {
    return (<div className={`agent-node ${data.isEntryPoint ? 'entry-point' : ''}`}>
      <react_2.Handle type="target" position={react_2.Position.Top}/>
      
      <div className="agent-header">
        {data.isEntryPoint && <span className="entry-badge">Entry</span>}
        <h3>{data.name}</h3>
      </div>
      
      <div className="agent-body">
        {data.description && <p className="description">{data.description}</p>}
        {data.model && <div className="model">Model: {data.model}</div>}
        {data.tools && data.tools.length > 0 && (<div className="tools">
            Tools: {data.tools.length}
          </div>)}
      </div>
      
      <div className="agent-actions">
        <button onClick={data.onEdit} title="Edit Agent">✏️</button>
        <button onClick={data.onToggleEntry} title="Toggle Entry Point">🏁</button>
        <button onClick={data.onDelete} title="Delete Agent">🗑️</button>
      </div>
      
      <react_2.Handle type="source" position={react_2.Position.Bottom}/>
    </div>);
}
//# sourceMappingURL=AgentNode.js.map