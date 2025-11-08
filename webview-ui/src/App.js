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
exports.App = App;
const react_1 = __importStar(require("react"));
const react_2 = require("@xyflow/react");
require("@xyflow/react/dist/style.css");
const AgentNode_1 = require("./AgentNode");
const HandoffModal_1 = require("./HandoffModal");
const ValidationPanel_1 = require("./ValidationPanel");
const SettingsPanel_1 = require("./SettingsPanel");
const layout_1 = require("./layout");
require("./App.css");
const vscode = acquireVsCodeApi();
const nodeTypes = {
    agent: AgentNode_1.AgentNode
};
function App() {
    const [nodes, setNodes, onNodesChange] = (0, react_2.useNodesState)([]);
    const [edges, setEdges, onEdgesChange] = (0, react_2.useEdgesState)([]);
    const [selectedEdge, setSelectedEdge] = (0, react_1.useState)(null);
    const [showHandoffModal, setShowHandoffModal] = (0, react_1.useState)(false);
    const [showValidation, setShowValidation] = (0, react_1.useState)(false);
    const [showSettings, setShowSettings] = (0, react_1.useState)(false);
    const [validationIssues, setValidationIssues] = (0, react_1.useState)([]);
    const [state, setState] = (0, react_1.useState)(null);
    const reactFlowInstance = (0, react_1.useRef)(null);
    // Request initial state from extension
    (0, react_1.useEffect)(() => {
        vscode.postMessage({ type: 'getState' });
        // Listen for messages from extension
        const messageHandler = (event) => {
            const message = event.data;
            switch (message.type) {
                case 'stateLoaded':
                    loadStateToCanvas(message.state);
                    break;
                case 'exportRequested':
                    handleExport();
                    break;
                case 'importRequested':
                    handleImport();
                    break;
                case 'simulateRequested':
                    handleSimulate();
                    break;
            }
        };
        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, []);
    const loadStateToCanvas = (canvasState) => {
        setState(canvasState);
        if (!canvasState.agents || canvasState.agents.length === 0) {
            return;
        }
        // Convert agents to nodes
        const newNodes = canvasState.agents.map(agent => ({
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
        const newEdges = [];
        canvasState.agents.forEach(agent => {
            agent.handoffs.forEach((handoff, index) => {
                newEdges.push({
                    id: `${agent.id}-${handoff.targetAgentId}-${index}`,
                    source: agent.id,
                    target: handoff.targetAgentId,
                    label: handoff.label,
                    data: {
                        handoff: handoff
                    }
                });
            });
        });
        setNodes(newNodes);
        setEdges(newEdges);
        // Fit view after loading
        setTimeout(() => {
            if (reactFlowInstance.current) {
                reactFlowInstance.current.fitView({ padding: 0.2 });
            }
        }, 100);
    };
    const onConnect = (0, react_1.useCallback)((params) => {
        // Validate connection
        vscode.postMessage({
            type: 'validateConnection',
            sourceId: params.source,
            targetId: params.target
        });
        // Create edge with default handoff data
        const newEdge = {
            ...params,
            id: `${params.source}-${params.target}-${Date.now()}`,
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
        setEdges((eds) => (0, react_2.addEdge)(newEdge, eds));
        saveState();
    }, [edges]);
    const onEdgeClick = (0, react_1.useCallback)((event, edge) => {
        setSelectedEdge(edge);
        setShowHandoffModal(true);
    }, []);
    const handleHandoffUpdate = (updatedHandoff) => {
        if (!selectedEdge) {
            return;
        }
        setEdges((eds) => eds.map((edge) => edge.id === selectedEdge.id
            ? {
                ...edge,
                label: updatedHandoff.label,
                data: { handoff: updatedHandoff }
            }
            : edge));
        setShowHandoffModal(false);
        setSelectedEdge(null);
        saveState();
    };
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
        const newNode = {
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
    const editAgent = (agentId) => {
        // TODO: Open edit modal
        console.log('Edit agent:', agentId);
    };
    const toggleEntryPoint = (agentId) => {
        setNodes((nds) => nds.map((node) => node.id === agentId
            ? {
                ...node,
                data: {
                    ...node.data,
                    isEntryPoint: !node.data.isEntryPoint
                }
            }
            : node));
        saveState();
    };
    const deleteAgent = (agentId) => {
        setNodes((nds) => nds.filter((node) => node.id !== agentId));
        setEdges((eds) => eds.filter((edge) => edge.source !== agentId && edge.target !== agentId));
        saveState();
    };
    const applyAutoLayout = async () => {
        const layoutedNodes = await (0, layout_1.applyElkLayout)(nodes, edges);
        setNodes(layoutedNodes);
        setTimeout(() => {
            if (reactFlowInstance.current) {
                reactFlowInstance.current.fitView({ padding: 0.2 });
            }
        }, 100);
        saveState();
    };
    const saveState = (0, react_1.useCallback)(() => {
        if (!state) {
            return;
        }
        // Convert nodes and edges back to agents
        const agents = nodes.map((node) => {
            const nodeEdges = edges.filter((edge) => edge.source === node.id);
            const handoffs = nodeEdges.map((edge) => edge.data.handoff);
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
        vscode.postMessage({
            type: 'stateUpdate',
            state: updatedState
        });
    }, [nodes, edges, state]);
    const handleExport = () => {
        setShowValidation(true);
        // Validation will be done in ValidationPanel
    };
    const handleImport = () => {
        vscode.postMessage({ type: 'importFiles' });
    };
    const handleSimulate = () => {
        // TODO: Open simulation view
        console.log('Simulate');
    };
    return (<div className="app">
      <react_2.ReactFlow nodes={nodes} edges={edges} onNodesChange={(changes) => {
            onNodesChange(changes);
            saveState();
        }} onEdgesChange={(changes) => {
            onEdgesChange(changes);
            saveState();
        }} onConnect={onConnect} onEdgeClick={onEdgeClick} onInit={(instance) => {
            reactFlowInstance.current = instance;
        }} nodeTypes={nodeTypes} fitView>
        <react_2.Background variant={react_2.BackgroundVariant.Dots}/>
        <react_2.Controls />
        <react_2.MiniMap />
        
        <react_2.Panel position="top-left">
          <div className="toolbar">
            <button onClick={addNewAgent}>Add Agent</button>
            <button onClick={applyAutoLayout}>Auto Layout</button>
            <button onClick={handleExport}>Export</button>
            <button onClick={handleImport}>Import</button>
            <button onClick={handleSimulate}>Simulate</button>
            <button onClick={() => setShowSettings(true)}>Settings</button>
          </div>
        </react_2.Panel>
      </react_2.ReactFlow>

      {showHandoffModal && selectedEdge && (<HandoffModal_1.HandoffModal handoff={selectedEdge.data.handoff} onSave={handleHandoffUpdate} onClose={() => {
                setShowHandoffModal(false);
                setSelectedEdge(null);
            }}/>)}

      {showValidation && (<ValidationPanel_1.ValidationPanel agents={nodes.map((node) => ({
                id: node.id,
                name: node.data.name,
                description: node.data.description,
                tools: node.data.tools,
                model: node.data.model,
                position: node.position,
                handoffs: edges
                    .filter((edge) => edge.source === node.id)
                    .map((edge) => edge.data.handoff),
                isEntryPoint: node.data.isEntryPoint
            }))} onClose={() => setShowValidation(false)} onExport={() => {
                vscode.postMessage({ type: 'performExport', agents: nodes });
            }}/>)}

      {showSettings && state && (<SettingsPanel_1.SettingsPanel preferences={state.preferences} theme={state.theme} onSave={(newPrefs, newTheme) => {
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
            }} onClose={() => setShowSettings(false)}/>)}
    </div>);
}
//# sourceMappingURL=App.js.map