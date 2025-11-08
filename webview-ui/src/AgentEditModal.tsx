import React, { useState, useEffect } from 'react';
import { Agent } from '../../src/models/agent';
import './AgentEditModal.css';

interface AgentEditModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAgent: Agent) => void;
}

export const AgentEditModal: React.FC<AgentEditModalProps> = ({
  agent,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description);
  const [instructions, setInstructions] = useState(agent.instructions || '');
  const [model, setModel] = useState(agent.model || '');
  const [tools, setTools] = useState(agent.tools?.join(', ') || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setName(agent.name);
      setDescription(agent.description);
      setInstructions(agent.instructions || '');
      setModel(agent.model || '');
      setTools(agent.tools?.join(', ') || '');
      setErrors({});
    }
  }, [isOpen, agent]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less';
    }

    if (instructions.length > 8000) {
      newErrors.instructions = 'Instructions must be 8000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const updatedAgent: Agent = {
      ...agent,
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.trim() || undefined,
      model: model.trim() || undefined,
      tools: tools
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0),
    };

    onSave(updatedAgent);
    onClose();
  };

  const handleCancel = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content agent-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Agent Properties</h2>
          <button className="close-button" onClick={handleCancel}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="agent-name">
              Name <span className="required">*</span>
              <span className="char-count">{name.length}/100</span>
            </label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter agent name"
              maxLength={100}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="agent-description">
              Description
              <span className="char-count">{description.length}/1000</span>
            </label>
            <textarea
              id="agent-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of this agent's role and capabilities"
              rows={3}
              maxLength={1000}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="agent-instructions">
              Instructions
              <span className="char-count">{instructions.length}/8000</span>
            </label>
            <textarea
              id="agent-instructions"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Detailed instructions for how this agent should behave and what tasks it performs"
              rows={8}
              maxLength={8000}
              className={errors.instructions ? 'error' : ''}
            />
            {errors.instructions && <span className="error-message">{errors.instructions}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="agent-model">
              Model
            </label>
            <select
              id="agent-model"
              value={model}
              onChange={e => setModel(e.target.value)}
            >
              <option value="">Auto (Default)</option>
              <option value="GPT-4.1">GPT-4.1</option>
              <option value="GPT-5">GPT-5</option>
              <option value="GPT-5 mini">GPT-5 mini</option>
              <option value="GPT-5-Codex (Preview)">GPT-5-Codex (Preview)</option>
              <option value="Claude Sonnet 4">Claude Sonnet 4</option>
              <option value="Claude Sonnet 4.5">Claude Sonnet 4.5</option>
            </select>
            <span className="help-text">
              AI model to use for this agent (leave blank for auto-selection)
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="agent-tools">
              Tools
            </label>
            <input
              id="agent-tools"
              type="text"
              value={tools}
              onChange={e => setTools(e.target.value)}
              placeholder="codebase, search, fetch, edit/editFiles (comma-separated)"
            />
            <span className="help-text">
              Comma-separated list of tools this agent can access
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-button" onClick={handleCancel}>
            Cancel
          </button>
          <button className="primary-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
