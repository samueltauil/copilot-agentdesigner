export interface Handoff {
    targetAgentId: string;
    label: string;
    prompt: string;
    send: boolean;
}

export interface Agent {
    id: string;
    name: string;
    description: string;
    instructions?: string;
    tools: string[];
    model?: string;
    position: { x: number; y: number };
    handoffs: Handoff[];
    isEntryPoint: boolean;
}

export interface ThemeSettings {
    nodeColor: string;
    nodeEntryColor: string;
    edgeColor: string;
    edgeActiveColor: string;
    canvasBackground: string;
}

export interface UserPreferences {
    fileFormat: 'agent.md';
    exportPath: 'agents' | 'chatmodes';
}

export interface CanvasState {
    version: string;
    agents: Agent[];
    theme: ThemeSettings;
    preferences: UserPreferences;
    workflowDescription: string;
}

export const DEFAULT_THEME: ThemeSettings = {
    nodeColor: '#1e1e1e',
    nodeEntryColor: '#0e639c',
    edgeColor: '#6e6e6e',
    edgeActiveColor: '#007acc',
    canvasBackground: '#252526'
};

export const DEFAULT_PREFERENCES: UserPreferences = {
    fileFormat: 'agent.md',
    exportPath: 'agents'
};
