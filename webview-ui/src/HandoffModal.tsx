import React, { useState } from 'react';
import './HandoffModal.css';

interface HandoffModalProps {
  handoff: {
    targetAgentId: string;
    label: string;
    prompt: string;
    send: boolean;
  };
  targetAgentName?: string;
  onSave: (handoff: any) => void;
  onClose: () => void;
}

export function HandoffModal({ handoff, targetAgentName, onSave, onClose }: HandoffModalProps) {
  const [label, setLabel] = useState(handoff.label);
  const [prompt, setPrompt] = useState(handoff.prompt);
  const [send, setSend] = useState(handoff.send);

  const handleSave = () => {
    onSave({
      ...handoff,
      label,
      prompt,
      send
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content handoff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configure Handoff Connection</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {targetAgentName && (
            <div className="handoff-target">
              <span className="handoff-icon">→</span>
              <span>Handoff to: <strong>{targetAgentName}</strong></span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="handoff-label">
              Button Label
              <span className="field-description">Text shown on the handoff button in chat</span>
            </label>
            <input
              id="handoff-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Start Implementation, Review Code, Continue"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="handoff-prompt">
              Prompt Message
              <span className="field-description">Message sent when handoff button is clicked</span>
            </label>
            <textarea
              id="handoff-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Now implement the plan outlined above.\n\nProceed with the next step based on the previous analysis."
              rows={5}
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={send}
                onChange={(e) => setSend(e.target.checked)}
              />
              <span className="checkbox-text">
                <strong>Auto-send</strong>
                <span className="field-description">Automatically submit the prompt (send: true)</span>
              </span>
            </label>
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="secondary-button">
            Cancel
          </button>
          <button onClick={handleSave} className="primary-button">
            Save Handoff
          </button>
        </div>
      </div>
    </div>
  );
}
