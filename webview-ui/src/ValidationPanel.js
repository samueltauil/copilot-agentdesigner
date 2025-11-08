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
exports.ValidationPanel = ValidationPanel;
const react_1 = __importStar(require("react"));
function ValidationPanel({ agents, onClose, onExport }) {
    const [issues, setIssues] = (0, react_1.useState)([]);
    const [isValid, setIsValid] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        validateAgents();
    }, [agents]);
    const validateAgents = () => {
        const validationIssues = [];
        // Check for entry points
        const entryPoints = agents.filter(a => a.isEntryPoint);
        if (entryPoints.length === 0) {
            validationIssues.push({
                type: 'error',
                message: 'No entry point defined. At least one agent must be marked as an entry point.',
                quickFix: 'Click on an agent and select "Toggle Entry Point"'
            });
        }
        // Check for unique names
        const nameMap = new Map();
        agents.forEach(agent => {
            const count = nameMap.get(agent.name) || 0;
            nameMap.set(agent.name, count + 1);
        });
        nameMap.forEach((count, name) => {
            if (count > 1) {
                validationIssues.push({
                    type: 'error',
                    message: `Duplicate agent name "${name}" found. Agent names must be unique.`,
                    quickFix: 'Rename one of the agents'
                });
            }
        });
        // Check handoffs
        agents.forEach(agent => {
            agent.handoffs.forEach((handoff) => {
                const targetAgent = agents.find(a => a.id === handoff.targetAgentId);
                if (!targetAgent) {
                    validationIssues.push({
                        type: 'error',
                        message: `Agent "${agent.name}" has handoff to non-existent agent`,
                        quickFix: 'Remove the invalid handoff'
                    });
                }
                if (!handoff.label || handoff.label.trim() === '') {
                    validationIssues.push({
                        type: 'warning',
                        message: `Handoff from "${agent.name}" has no label`,
                        quickFix: 'Click the edge to edit the handoff and add a label'
                    });
                }
            });
        });
        setIssues(validationIssues);
        setIsValid(validationIssues.filter(i => i.type === 'error').length === 0);
    };
    return (<div className="modal-overlay" onClick={onClose}>
      <div className="modal validation-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Validation Results</h2>
        
        {issues.length === 0 ? (<div className="validation-success">
            ✅ All validation checks passed! Ready to export.
          </div>) : (<div className="validation-issues">
            {issues.map((issue, index) => (<div key={index} className={`issue ${issue.type}`}>
                <div className="issue-message">
                  <span className="issue-icon">
                    {issue.type === 'error' ? '❌' : '⚠️'}
                  </span>
                  {issue.message}
                </div>
                {issue.quickFix && (<div className="issue-fix">
                    💡 {issue.quickFix}
                  </div>)}
              </div>))}
          </div>)}
        
        <div className="modal-actions">
          {isValid && (<button onClick={onExport} className="primary">
              Export Agents
            </button>)}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=ValidationPanel.js.map