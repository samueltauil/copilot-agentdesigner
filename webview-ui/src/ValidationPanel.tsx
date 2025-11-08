import React, { useState, useEffect } from 'react';

interface ValidationPanelProps {
  agents: any[];
  onClose: () => void;
  onExport: () => void;
}

export function ValidationPanel({ agents, onClose, onExport }: ValidationPanelProps) {
  const [issues, setIssues] = useState<any[]>([]);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    validateAgents();
  }, [agents]);

  const validateAgents = () => {
    const validationIssues: any[] = [];

    // Check for entry points
    const entryPoints = agents.filter(a => a.isEntryPoint);
    if (entryPoints.length === 0) {
      validationIssues.push({
        type: 'error',
        message: 'No entry point defined. At least one agent must be marked as an entry point.',
        quickFix: 'Click on an agent and select the 🏁 button or click "Toggle Entry Point"'
      });
    }

    // Validate individual agent attributes
    agents.forEach(agent => {
      const agentIssues: string[] = [];

      // Check name
      if (!agent.name || agent.name.trim() === '') {
        agentIssues.push('missing name');
      } else if (agent.name.length > 100) {
        validationIssues.push({
          type: 'error',
          message: `Agent "${agent.name}" name exceeds 100 character limit (${agent.name.length} chars)`,
          quickFix: 'Click the agent to edit and shorten the name'
        });
      }

      // Check description
      if (!agent.description || agent.description.trim() === '') {
        agentIssues.push('missing description');
      } else if (agent.description.length > 1000) {
        validationIssues.push({
          type: 'error',
          message: `Agent "${agent.name}" description exceeds 1000 character limit (${agent.description.length} chars)`,
          quickFix: 'Click the agent to edit and shorten the description'
        });
      }

      // Check instructions
      if (!agent.instructions || agent.instructions.trim() === '') {
        agentIssues.push('missing instructions');
      } else if (agent.instructions.length > 8000) {
        validationIssues.push({
          type: 'error',
          message: `Agent "${agent.name}" instructions exceed 8000 character limit (${agent.instructions.length} chars)`,
          quickFix: 'Click the agent to edit and shorten the instructions'
        });
      }

      // Check tools
      if (!agent.tools || agent.tools.length === 0) {
        agentIssues.push('no tools configured');
      }

      // Check model
      if (!agent.model || agent.model.trim() === '') {
        agentIssues.push('no model selected');
      }

      // Create warning for missing attributes
      if (agentIssues.length > 0) {
        validationIssues.push({
          type: 'warning',
          message: `Agent "${agent.name}" is incomplete: ${agentIssues.join(', ')}`,
          quickFix: 'Click the agent box to edit and add missing information'
        });
      }

      // Check for isolated agents (no handoffs in or out, and not entry point)
      if (!agent.isEntryPoint && agent.handoffs.length === 0) {
        const hasIncomingHandoffs = agents.some(a => 
          a.handoffs.some((h: any) => h.targetAgentId === agent.id)
        );
        if (!hasIncomingHandoffs) {
          validationIssues.push({
            type: 'warning',
            message: `Agent "${agent.name}" is isolated (no handoffs in or out, not an entry point)`,
            quickFix: 'Either mark as entry point or create handoff connections'
          });
        }
      }
    });

    // Check for unique names
    const nameMap = new Map<string, number>();
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
      agent.handoffs.forEach((handoff: any) => {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal validation-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Validation Results</h2>
        
        {issues.length === 0 ? (
          <div className="validation-success">
            ✅ All validation checks passed! Ready to export.
          </div>
        ) : (
          <div className="validation-issues">
            {issues.map((issue, index) => (
              <div key={index} className={`issue ${issue.type}`}>
                <div className="issue-message">
                  <span className="issue-icon">
                    {issue.type === 'error' ? '❌' : '⚠️'}
                  </span>
                  {issue.message}
                </div>
                {issue.quickFix && (
                  <div className="issue-fix">
                    💡 {issue.quickFix}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="modal-actions">
          {isValid && (
            <button onClick={onExport} className="primary">
              Export Agents
            </button>
          )}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
