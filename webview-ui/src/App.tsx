import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AgentNode } from './AgentNode';
import { HandoffModal } from './HandoffModal';
import { AgentEditModal } from './AgentEditModal';
import { ValidationPanel } from './ValidationPanel';
import { SettingsPanel } from './SettingsPanel';
import { ConfirmDialog } from './ConfirmDialog';
import { EdgeContextMenu } from './EdgeContextMenu';
import { applyElkLayout } from './layout';
import './App.css';

const vscode = acquireVsCodeApi();

const nodeTypes = {
  agent: AgentNode
};

interface AppState {
  agents: any[];
  theme: any;
  preferences: any;
  workflowDescription: string;
}

export function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showAgentEditModal, setShowAgentEditModal] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [validationIssues, setValidationIssues] = useState<any[]>([]);
  const [state, setState] = useState<AppState | null>(null);
  const [showImportBanner, setShowImportBanner] = useState(false);
  const [importBannerMessage, setImportBannerMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [edgeToDelete, setEdgeToDelete] = useState<Edge | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; edge: Edge } | null>(null);
  const reactFlowInstance = useRef<any>(null);

  // Request initial state from extension
  useEffect(() => {
    console.log(`[Webview] [${Date.now()}] React App mounted, registering message listener`);
    console.log(`[Webview] [${Date.now()}] Window size: ${window.innerWidth}x${window.innerHeight}`);
    console.log(`[Webview] [${Date.now()}] Document ready state: ${document.readyState}`);
    
    // Signal to extension that webview is ready to receive state
    console.log(`[Webview] [${Date.now()}] Sending webviewReady signal to extension`);
    vscode.postMessage({ type: 'webviewReady' });

    // Listen for messages from extension
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.type) {
        case 'stateLoaded':
          console.log(`[Webview] [${Date.now()}] Received stateLoaded message with ${message.state?.agents?.length || 0} agents`);
          loadStateToCanvas(message.state);
          break;
        case 'exportRequested':
          handleExport();
          break;
        case 'importRequested':
          handleImport();
          break;
        case 'agentDropped':
          if (message.agent) {
            // Add the dropped agent to the canvas
            const newNode: Node = {
              id: message.agent.id,
              type: 'agent',
              position: message.agent.position,
              data: {
                name: message.agent.name,
                description: message.agent.description,
                tools: message.agent.tools,
                model: message.agent.model,
                isEntryPoint: message.agent.isEntryPoint,
                onEdit: () => editAgent(message.agent.id),
                onToggleEntry: () => toggleEntryPoint(message.agent.id),
                onDelete: () => deleteAgent(message.agent.id)
              }
            };
            setNodes((nds) => [...nds, newNode]);
            saveState();
          }
          break;
        case 'agentCheckResult':
          // Received agent discovery result from extension
          if (message.agentCount > 0 && nodes.length === 0) {
            setShowImportBanner(true);
            setImportBannerMessage(`Found ${message.agentCount} agent file${message.agentCount > 1 ? 's' : ''} in ${message.sources.join(', ')}`);
          }
          break;
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  const loadStateToCanvas = (canvasState: AppState) => {
    console.log(`[Webview] [${Date.now()}] loadStateToCanvas called with ${canvasState?.agents?.length || 0} agents`);
    
    if (!canvasState) {
      console.error(`[Webview] [${Date.now()}] Received null/undefined canvas state!`);
      setIsLoading(false);
      return;
    }
    
    setState(canvasState);
    setIsLoading(false);

    if (!canvasState.agents || canvasState.agents.length === 0) {
      console.log(`[Webview] [${Date.now()}] No agents to load, checking for existing agents`);
      // Check if agents exist but weren't loaded
      vscode.postMessage({ type: 'checkForAgents' });
      return;
    }

    // Convert agents to nodes
    const newNodes: Node[] = canvasState.agents.map(agent => ({
      id: agent.id,
      type: 'agent',
      position: agent.position,
      data: {
        name: agent.name,
        description: agent.description,
        tools: agent.tools,
        model: agent.model,
        isEntryPoint: agent.isEntryPoint,
        onEdit: () => editAgent(agent.id),
        onToggleEntry: () => toggleEntryPoint(agent.id),
        onDelete: () => deleteAgent(agent.id)
      }
    }));

    // Convert handoffs to edges
    const newEdges: Edge[] = [];
    console.log(`[Webview] [${Date.now()}] Converting handoffs to edges`);
    canvasState.agents.forEach(agent => {
      console.log(`[Webview] [${Date.now()}] Agent ${agent.name} has ${agent.handoffs?.length || 0} handoffs:`, agent.handoffs);
      if (agent.handoffs) {
        agent.handoffs.forEach((handoff: any, index: number) => {
          console.log(`[Webview] Creating edge from ${agent.id} to ${handoff.targetAgentId}`);
          newEdges.push({
            id: `${agent.id}-${handoff.targetAgentId}-${index}`,
            type: 'smoothstep',
            source: agent.id,
            target: handoff.targetAgentId,
            label: handoff.label,
            data: {
              handoff: handoff
            }
          });
        });
      }
    });

    console.log(`[Webview] [${Date.now()}] Setting ${newNodes.length} nodes and ${newEdges.length} edges`);
    setNodes(newNodes);
    setEdges(newEdges);
    console.log(`[Webview] [${Date.now()}] Canvas state loaded successfully`);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      // Validate connection
      vscode.postMessage({
        type: 'validateConnection',
        sourceId: params.source,
        targetId: params.target
      });

      // Create edge with default handoff data
      const newEdge: Edge = {
        ...params,
        id: `${params.source}-${params.target}-${Date.now()}`,
        type: 'smoothstep',
        label: 'New Handoff',
        data: {
          handoff: {
            targetAgentId: params.target,
            label: 'New Handoff',
            prompt: '',
            send: false
          }
        }
      };

      setEdges((eds) => addEdge(newEdge, eds));
      saveState();
    },
    [edges]
  );

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setShowHandoffModal(true);
  }, []);

  const handleHandoffUpdate = (updatedHandoff: any) => {
    if (!selectedEdge) {
      return;
    }

    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === selectedEdge.id
          ? {
              ...edge,
              label: updatedHandoff.label,
              data: { handoff: updatedHandoff }
            }
          : edge
      )
    );

    setShowHandoffModal(false);
    setSelectedEdge(null);
    saveState();
  };

  const handleHandoffDelete = useCallback((edge: Edge) => {
    setEdgeToDelete(edge);
    setShowConfirmDelete(true);
    setShowHandoffModal(false);
    setSelectedEdge(null);
    setContextMenu(null);
  }, []);

  const confirmDeleteEdge = useCallback(() => {
    if (!edgeToDelete) return;

    console.log(`[Webview] [${Date.now()}] Deleting edge: ${edgeToDelete.id}`);
    
    setEdges((eds) => {
      const newEdges = eds.filter((e) => e.id !== edgeToDelete.id);
      
      // Save immediately after state update using the new edges
      setTimeout(() => {
        if (!state) return;
        
        console.log(`[Webview] [${Date.now()}] Saving after edge deletion - ${newEdges.length} edges remaining`);
        
        const agents = nodes.map((node) => {
          const nodeEdges = newEdges.filter((e) => e.source === node.id);
          const handoffs = nodeEdges.map((edge) => edge.data?.handoff).filter(Boolean);

          return {
            id: node.id,
            name: node.data.name,
            description: node.data.description,
            tools: node.data.tools,
            model: node.data.model,
            position: node.position,
            handoffs: handoffs,
            isEntryPoint: node.data.isEntryPoint
          };
        });

        const updatedState = {
          ...state,
          agents
        };

        const totalHandoffs = agents.reduce((sum, a) => sum + a.handoffs.length, 0);
        console.log(`[Webview] Post-delete save: ${agents.length} agents, ${totalHandoffs} total handoffs`);
        
        vscode.postMessage({
          type: 'stateUpdate',
          state: updatedState
        });
      }, 0);
      
      return newEdges;
    });
    
    // Send notification to extension
    vscode.postMessage({
      type: 'showMessage',
      message: 'Handoff connection deleted'
    });

    setShowConfirmDelete(false);
    setEdgeToDelete(null);
  }, [edgeToDelete, setEdges, nodes, state]);

  const cancelDeleteEdge = useCallback(() => {
    setShowConfirmDelete(false);
    setEdgeToDelete(null);
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      edge
    });
  }, []);

  const addNewAgent = () => {
    const newAgent = {
      id: `agent-${Date.now()}`,
      name: `Agent ${nodes.length + 1}`,
      description: '',
      tools: [],
      model: 'Claude Sonnet 4',
      position: { x: 100, y: 100 },
      handoffs: [],
      isEntryPoint: false
    };

    const newNode: Node = {
      id: newAgent.id,
      type: 'agent',
      position: newAgent.position,
      data: {
        name: newAgent.name,
        description: newAgent.description,
        tools: newAgent.tools,
        model: newAgent.model,
        isEntryPoint: newAgent.isEntryPoint,
        onEdit: () => editAgent(newAgent.id),
        onToggleEntry: () => toggleEntryPoint(newAgent.id),
        onDelete: () => deleteAgent(newAgent.id)
      }
    };

    setNodes((nds) => [...nds, newNode]);
    saveState();
  };

  const editAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setShowAgentEditModal(true);
  };

  const handleAgentUpdate = (updatedAgent: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === updatedAgent.id
          ? {
              ...node,
              data: {
                ...node.data,
                name: updatedAgent.name,
                description: updatedAgent.description,
                instructions: updatedAgent.instructions,
                tools: updatedAgent.tools,
                model: updatedAgent.model
              }
            }
          : node
      )
    );

    setShowAgentEditModal(false);
    setSelectedAgentId(null);
    saveState();
  };

  const toggleEntryPoint = (agentId: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === agentId
          ? {
              ...node,
              data: {
                ...node.data,
                isEntryPoint: !node.data.isEntryPoint
              }
            }
          : node
      )
    );
    saveState();
  };

  const deleteAgent = (agentId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== agentId));
    setEdges((eds) => eds.filter((edge) => edge.source !== agentId && edge.target !== agentId));
    saveState();
  };

  const applyAutoLayout = async () => {
    console.log('[App] ===== AUTO LAYOUT START =====');
    console.log('[App] Current nodes:', nodes.map(n => `${n.data?.name}: (${n.position.x}, ${n.position.y})`));
    
    const layoutedNodes = await applyElkLayout(nodes, edges);
    
    console.log('[App] Layouted nodes:', layoutedNodes.map(n => `${n.data?.name}: (${n.position.x}, ${n.position.y})`));
    console.log('[App] Setting nodes...');
    
    setNodes(layoutedNodes);
    
    // Pan viewport to show the layout starting position
    setTimeout(() => {
      if (reactFlowInstance.current) {
        // Set viewport to show the starting area with proper zoom
        reactFlowInstance.current.setViewport({ x: -100, y: -100, zoom: 0.8 });
        console.log('[App] Viewport set to show layout area');
      }
      saveState();
    }, 50);
  };

  const saveState = useCallback(() => {
    if (!state) {
      console.log('[Webview] Cannot save state: state is null');
      return;
    }

    console.log(`[Webview] [${Date.now()}] saveState called with ${edges.length} edges:`, edges.map(e => ({ id: e.id, source: e.source, target: e.target })));

    // Convert nodes and edges back to agents
    const agents = nodes.map((node) => {
      const nodeEdges = edges.filter((e) => e.source === node.id);
      console.log(`[Webview] [${Date.now()}] Node ${node.data.name} has ${nodeEdges.length} outgoing edges`);
      const handoffs = nodeEdges.map((edge) => edge.data?.handoff).filter(Boolean);

      return {
        id: node.id,
        name: node.data.name,
        description: node.data.description,
        tools: node.data.tools,
        model: node.data.model,
        position: node.position,
        handoffs: handoffs,
        isEntryPoint: node.data.isEntryPoint
      };
    });

    const updatedState = {
      ...state,
      agents
    };

    const totalHandoffs = agents.reduce((sum, a) => sum + a.handoffs.length, 0);
    console.log(`[Webview] Saving state: ${agents.length} agents, ${totalHandoffs} total handoffs`);
    console.log('[Webview] Handoff details:', agents.map(a => `${a.name}: ${a.handoffs.length} handoffs`));
    vscode.postMessage({
      type: 'stateUpdate',
      state: updatedState
    });
  }, [nodes, edges, state]);

  // Auto-save state when nodes or edges change (after initial load)
  useEffect(() => {
    console.log(`[Webview] [${Date.now()}] useEffect fired - isLoading: ${isLoading}, state: ${!!state}, nodes: ${nodes.length}, edges: ${edges.length}`);
    
    if (!isLoading && state && (nodes.length > 0 || edges.length > 0)) {
      console.log(`[Webview] [${Date.now()}] Scheduling auto-save with 100ms delay`);
      console.log(`[Webview] [${Date.now()}] Current edges:`, edges.map(e => ({ id: e.id, source: e.source, target: e.target })));
      
      const timeoutId = setTimeout(() => {
        console.log(`[Webview] [${Date.now()}] Auto-save timeout fired, calling saveState`);
        saveState();
      }, 100);
      
      return () => {
        console.log(`[Webview] [${Date.now()}] Cleanup: clearing auto-save timeout`);
        clearTimeout(timeoutId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, isLoading, state]);

  const handleExport = () => {
    setShowValidation(true);
    // Validation will be done in ValidationPanel
  };

  const handleImport = () => {
    vscode.postMessage({ type: 'import' });
  };

  const handleImportDirectory = () => {
    vscode.postMessage({ type: 'importDirectory' });
  };

  const handleAddFromFile = () => {
    // Request to pick a file and add it to canvas
    vscode.postMessage({ type: 'addFromFile' });
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    // Only set to false if leaving the app container
    if (event.currentTarget === event.target) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    
    // Get the position in the flow
    const position = reactFlowInstance.current?.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY
    }) || { x: 100, y: 100 };

    // Check for file data
    const items = event.dataTransfer.items;
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          // Get file path from VS Code
          const file = item.getAsFile();
          if (file) {
            // VS Code provides the file path in the name
            vscode.postMessage({ 
              type: 'dropFile', 
              fileName: file.name,
              position: position
            });
            return;
          }
        }
      }
    }
    
    // Fallback: try to get text data (file path)
    const text = event.dataTransfer.getData('text/plain');
    if (text) {
      vscode.postMessage({ 
        type: 'dropFile', 
        fileName: text,
        position: position
      });
    }
  }, []);

  return (
    <div 
      className={`app ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--vscode-editor-background)',
          zIndex: 9999,
          color: 'var(--vscode-foreground)',
          fontSize: '14px'
        }}>
          Loading Agent Designer...
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          onNodesChange(changes);
          saveState();
        }}
        onEdgesChange={(changes) => {
          onEdgesChange(changes);
          // Check if any edges were removed (keyboard delete)
          const hasRemoval = changes.some(change => change.type === 'remove');
          if (hasRemoval) {
            console.log(`[Webview] [${Date.now()}] Edge removed via keyboard`);
            vscode.postMessage({
              type: 'showMessage',
              message: 'Handoff connection deleted'
            });
          }
          saveState();
        }}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onEdgeContextMenu={onEdgeContextMenu}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: { strokeWidth: 3 }
        }}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        preventScrolling={false}
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
        
        <Panel position="top-left">
          <div className="toolbar">
            <button onClick={addNewAgent}>Add Agent</button>
            <button onClick={handleAddFromFile}>Add from File</button>
            <button onClick={applyAutoLayout}>Auto Layout</button>
            <button onClick={handleExport}>Export</button>
          <button onClick={handleImport}>Import Files</button>
          <button onClick={handleImportDirectory}>Load from Directory</button>
            <button onClick={() => setShowSettings(true)}>Settings</button>
          </div>
        </Panel>
      </ReactFlow>

      {showImportBanner && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#007acc',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000
        }}>
          <span>{importBannerMessage}</span>
          <button
            onClick={() => {
              vscode.postMessage({ type: 'importExisting' });
              setShowImportBanner(false);
            }}
            style={{
              backgroundColor: 'white',
              color: '#007acc',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Load Now
          </button>
          <button
            onClick={() => setShowImportBanner(false)}
            style={{
              backgroundColor: 'transparent',
              color: 'white',
              border: '1px solid white',
              padding: '6px 12px',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {showHandoffModal && selectedEdge && (
        <HandoffModal
          handoff={selectedEdge.data?.handoff}
          targetAgentName={nodes.find(n => n.id === selectedEdge.target)?.data?.name as string}
          onSave={handleHandoffUpdate}
          onDelete={() => handleHandoffDelete(selectedEdge)}
          onClose={() => {
            setShowHandoffModal(false);
            setSelectedEdge(null);
          }}
        />
      )}

      {contextMenu && (
        <EdgeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={() => handleHandoffDelete(contextMenu.edge)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {showConfirmDelete && (
        <ConfirmDialog
          title="Delete Connection"
          message="Delete this handoff connection?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDeleteEdge}
          onCancel={cancelDeleteEdge}
        />
      )}

      {showAgentEditModal && selectedAgentId && (
        <AgentEditModal
          agent={
            nodes.find((n) => n.id === selectedAgentId)
              ? {
                  id: selectedAgentId,
                  ...nodes.find((n) => n.id === selectedAgentId)!.data,
                  position: nodes.find((n) => n.id === selectedAgentId)!.position,
                  handoffs: []
                }
              : {
                  id: selectedAgentId,
                  name: '',
                  description: '',
                  tools: [],
                  position: { x: 0, y: 0 },
                  handoffs: [],
                  isEntryPoint: false
                }
          }
          isOpen={showAgentEditModal}
          onClose={() => {
            setShowAgentEditModal(false);
            setSelectedAgentId(null);
          }}
          onSave={handleAgentUpdate}
        />
      )}

      {showValidation && (
        <ValidationPanel
          agents={nodes.map((node) => ({
            id: node.id,
            name: (node.data as any).name || '',
            description: (node.data as any).description || '',
            instructions: (node.data as any).instructions || '',
            tools: (node.data as any).tools || [],
            model: (node.data as any).model || '',
            position: node.position,
            handoffs: edges
              .filter((edge) => edge.source === node.id)
              .map((edge) => (edge.data as any)?.handoff).filter(Boolean),
            isEntryPoint: (node.data as any).isEntryPoint || false
          }))}
          onClose={() => setShowValidation(false)}
          onExport={() => {
            const agentsToExport = nodes.map((node) => ({
              id: node.id,
              name: node.data.name,
              description: node.data.description,
              instructions: node.data.instructions,
              tools: node.data.tools,
              model: node.data.model,
              position: node.position,
              handoffs: edges
                .filter((edge) => edge.source === node.id)
                .map((edge) => (edge.data as any)?.handoff).filter(Boolean),
              isEntryPoint: node.data.isEntryPoint
            }));
            vscode.postMessage({ type: 'performExport', agents: agentsToExport });
            setShowValidation(false);
          }}
        />
      )}

      {showSettings && state && (
        <SettingsPanel
          preferences={state.preferences}
          theme={state.theme}
          onSave={(newPrefs, newTheme) => {
            const updatedState = {
              ...state,
              preferences: newPrefs,
              theme: newTheme
            };
            setState(updatedState);
            vscode.postMessage({
              type: 'stateUpdate',
              state: updatedState
            });
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
