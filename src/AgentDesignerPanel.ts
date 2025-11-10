import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CanvasState, DEFAULT_THEME, DEFAULT_PREFERENCES } from './models/agent';

export class AgentDesignerPanel {
    public static currentPanel: AgentDesignerPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _autoSaveTimeout: NodeJS.Timeout | undefined;
    private _canvasState: CanvasState | undefined;
    private _stateFilePath: string = '';
    private _needsAutoImport: boolean = false;

    public static createOrShow(extensionUri: vscode.Uri, stateFilePath?: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (AgentDesignerPanel.currentPanel) {
            // If opening a different file, reload state
            if (stateFilePath && AgentDesignerPanel.currentPanel._stateFilePath !== stateFilePath) {
                AgentDesignerPanel.currentPanel._stateFilePath = stateFilePath;
                AgentDesignerPanel.currentPanel._loadState();
                setTimeout(() => {
                    AgentDesignerPanel.currentPanel?._sendStateToWebview();
                }, 100);
            }
            AgentDesignerPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'agentDesigner',
            'Agent Designer',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'out'),
                    vscode.Uri.joinPath(extensionUri, 'webview-ui')
                ]
            }
        );

        AgentDesignerPanel.currentPanel = new AgentDesignerPanel(panel, extensionUri, stateFilePath);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, stateFilePath?: string) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set state file path
        if (stateFilePath) {
            this._stateFilePath = stateFilePath;
        } else {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                console.warn(`[AgentDesigner] [${Date.now()}] No workspace folder open, initializing with empty state`);
                
                // Initialize with empty state instead of disposing
                this._stateFilePath = '';
                this._canvasState = {
                    version: '1.0.0',
                    agents: [],
                    theme: DEFAULT_THEME,
                    preferences: DEFAULT_PREFERENCES,
                    workflowDescription: ''
                };
                
                // Show error but continue execution to set up webview properly
                vscode.window.showErrorMessage(
                    'No workspace folder open. Please open a folder to use Agent Designer.',
                    'Open Folder'
                ).then(selection => {
                    if (selection === 'Open Folder') {
                        vscode.commands.executeCommand('vscode.openFolder');
                    }
                });
                
                // Continue execution - don't dispose or return
            } else {
                this._stateFilePath = path.join(
                    workspaceFolder.uri.fsPath,
                    '.github',
                    'agentflow',
                    '.agentdesign.md'
                );
            }
        }

        // Check if we need to auto-import existing agents
        const checkResult = this._checkForExistingAgents();
        if (checkResult.needsImport && checkResult.agentCount > 0) {
            this._needsAutoImport = true;
            console.log(`[AgentDesigner] Found ${checkResult.agentCount} existing agents in: ${checkResult.sources.join(', ')}`);
        }

        // Set the webview's initial html content first
        console.log(`[AgentDesigner] [${Date.now()}] Creating webview HTML`);
        this._update();
        
        // Load initial state
        console.log(`[AgentDesigner] [${Date.now()}] Loading state from disk`);
        this._loadState();
        
        // Don't send state immediately - wait for webview to signal it's ready
        console.log(`[AgentDesigner] [${Date.now()}] Waiting for webview ready signal`);

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'stateUpdate':
                        this._handleStateUpdate(message.state);
                        break;
                    case 'export':
                        this._handleExport();
                        break;
                    case 'performExport':
                        this._performExport(message.agents);
                        break;
                    case 'import':
                        this._handleImport();
                        break;
                    case 'importDirectory':
                        this._handleImportDirectory();
                        break;
                    case 'simulate':
                        this._handleSimulate();
                        break;
                    case 'getState':
                        this._sendStateToWebview();
                        break;
                    case 'dropFile':
                        this._handleDropFile(message.fileName, message.position);
                        break;
                    case 'addFromFile':
                        this._handleAddFromFile();
                        break;
                    case 'checkForAgents':
                        this._handleCheckForAgents();
                        break;
                    case 'importExisting':
                        this._handleImportExisting();
                        break;
                    case 'webviewReady':
                        console.log(`[AgentDesigner] [${Date.now()}] Webview ready signal received`);
                        this._sendStateToWebview();
                        break;
                    case 'webviewError':
                        console.error(`[AgentDesigner] [${Date.now()}] Webview error:`, message.error);
                        vscode.window.showErrorMessage(
                            `Agent Designer webview error: ${message.error?.message || 'Unknown error'}`,
                            'Show Details'
                        ).then(selection => {
                            if (selection === 'Show Details') {
                                console.error('[AgentDesigner] Full error details:', message.error);
                            }
                        });
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private _checkForExistingAgents(): { needsImport: boolean; agentCount: number; sources: string[] } {
        console.log(`[AgentDesigner] [${Date.now()}] Checking for existing agents`);
        const result = { needsImport: false, agentCount: 0, sources: [] as string[] };

        // If design file already exists, no need to auto-import
        if (this._stateFilePath && fs.existsSync(this._stateFilePath)) {
            console.log(`[AgentDesigner] [${Date.now()}] Design file exists at ${this._stateFilePath}, skipping auto-import check`);
            return result;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return result;
        }

        const agentsPath = path.join(workspaceFolder.uri.fsPath, '.github', 'agents');
        const chatmodesPath = path.join(workspaceFolder.uri.fsPath, '.github', 'chatmodes');

        let totalAgents = 0;

        // Check .github/agents
        if (fs.existsSync(agentsPath)) {
            const AgentFileParser = require('./generators/agentFileParser').AgentFileParser;
            const parseResult = AgentFileParser.parseDirectory(agentsPath);
            if (parseResult.agents.length > 0) {
                totalAgents += parseResult.agents.length;
                result.sources.push('.github/agents');
                console.log(`[AgentDesigner] Found ${parseResult.agents.length} agents in .github/agents`);
            }
        }

        // Check .github/chatmodes
        if (fs.existsSync(chatmodesPath)) {
            const AgentFileParser = require('./generators/agentFileParser').AgentFileParser;
            const parseResult = AgentFileParser.parseDirectory(chatmodesPath);
            if (parseResult.agents.length > 0) {
                totalAgents += parseResult.agents.length;
                result.sources.push('.github/chatmodes');
                console.log(`[AgentDesigner] Found ${parseResult.agents.length} agents in .github/chatmodes`);
            }
        }

        result.agentCount = totalAgents;
        result.needsImport = totalAgents > 0;

        return result;
    }

    private _autoDiscoverAgents(): number {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return 0;
        }

        const AgentFileParser = require('./generators/agentFileParser').AgentFileParser;
        const agentsPath = path.join(workspaceFolder.uri.fsPath, '.github', 'agents');
        const chatmodesPath = path.join(workspaceFolder.uri.fsPath, '.github', 'chatmodes');

        let allParsedAgents: any[] = [];
        let allFileNames: string[] = [];

        // Parse agents from .github/agents
        if (fs.existsSync(agentsPath)) {
            const result = AgentFileParser.parseDirectory(agentsPath);
            allParsedAgents = allParsedAgents.concat(result.agents);
            allFileNames = allFileNames.concat(result.fileNames);
            console.log(`[AgentDesigner] Auto-loaded ${result.agents.length} agents from .github/agents`);
        }

        // Parse agents from .github/chatmodes
        if (fs.existsSync(chatmodesPath)) {
            const result = AgentFileParser.parseDirectory(chatmodesPath);
            allParsedAgents = allParsedAgents.concat(result.agents);
            allFileNames = allFileNames.concat(result.fileNames);
            console.log(`[AgentDesigner] Auto-loaded ${result.agents.length} agents from .github/chatmodes`);
        }

        if (allParsedAgents.length === 0) {
            return 0;
        }

        // Convert to canvas agents with 250px grid spacing, passing filenames for handoff resolution
        const canvasAgents = AgentFileParser.toCanvasAgents(allParsedAgents, allFileNames);
        
        // Apply 250px grid layout
        canvasAgents.forEach((agent: any, index: number) => {
            agent.position = {
                x: 100 + (index % 3) * 250,
                y: 100 + Math.floor(index / 3) * 250
            };
        });

        // Log handoffs for debugging
        console.log(`[AgentDesigner] Canvas agents with handoffs:`);
        canvasAgents.forEach((agent: any) => {
            console.log(`  - ${agent.name}: ${agent.handoffs?.length || 0} handoffs`, agent.handoffs);
        });

        // Update canvas state
        if (this._canvasState) {
            this._canvasState.agents = canvasAgents;
            this._saveState();
            console.log(`[AgentDesigner] Auto-imported ${canvasAgents.length} agents to canvas`);
        }

        return canvasAgents.length;
    }

    private _handleCheckForAgents() {
        const checkResult = this._checkForExistingAgents();
        this._panel.webview.postMessage({
            type: 'agentCheckResult',
            agentCount: checkResult.agentCount,
            sources: checkResult.sources
        });
    }

    private _handleImportExisting() {
        const loadedCount = this._autoDiscoverAgents();
        if (loadedCount > 0) {
            vscode.window.showInformationMessage(`Loaded ${loadedCount} existing agent${loadedCount > 1 ? 's' : ''} from workspace`);
            this._sendStateToWebview();
        } else {
            vscode.window.showInformationMessage('No agent files found in workspace');
        }
    }

    private _loadState() {
        console.log(`[AgentDesigner] [${Date.now()}] Loading state from: ${this._stateFilePath}`);
        
        // Skip loading if no workspace (state already initialized in constructor)
        if (!this._stateFilePath) {
            console.log(`[AgentDesigner] [${Date.now()}] No state file path, using pre-initialized empty state`);
            return;
        }
        
        try {
            if (fs.existsSync(this._stateFilePath)) {
                const content = fs.readFileSync(this._stateFilePath, 'utf8');
                console.log(`[AgentDesigner] File exists, content length: ${content.length}`);
                
                const match = content.match(/^---\n([\s\S]*?)\n---/);
                
                if (match) {
                    const jsonContent = match[1];
                    console.log(`[AgentDesigner] Extracted JSON content, length: ${jsonContent.length}`);
                    
                    try {
                        // Since we now save as pure JSON, just parse it directly
                        this._canvasState = JSON.parse(jsonContent);
                        console.log(`[AgentDesigner] Successfully loaded ${this._canvasState?.agents?.length || 0} agents`);
                        
                        // Extract workflow description from markdown body
                        const bodyMatch = content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/);
                        if (bodyMatch && this._canvasState) {
                            this._canvasState.workflowDescription = bodyMatch[1].trim();
                        }
                    } catch (parseError) {
                        console.error('[AgentDesigner] JSON parse error:', parseError);
                        console.error('[AgentDesigner] Failed content sample:', jsonContent.substring(0, 500));
                        throw parseError;
                    }
                } else {
                    console.log('[AgentDesigner] No YAML frontmatter found in file');
                }
            } else {
                console.log('[AgentDesigner] File does not exist, will create new state');
            }
        } catch (error) {
            console.error('[AgentDesigner] Error loading state:', error);
            vscode.window.showErrorMessage(`Failed to load design file: ${error}`);
        }

        // Initialize with default state if none exists
        if (!this._canvasState) {
            console.log('[AgentDesigner] Initializing with default state');
            this._canvasState = {
                version: '1.0.0',
                agents: [],
                theme: DEFAULT_THEME,
                preferences: DEFAULT_PREFERENCES,
                workflowDescription: ''
            };

            // Auto-import existing agents if needed
            if (this._needsAutoImport && this._canvasState.agents.length === 0) {
                console.log('[AgentDesigner] Triggering auto-import of existing agents');
                const loadedCount = this._autoDiscoverAgents();
                
                if (loadedCount > 0) {
                    vscode.window.showInformationMessage(
                        `Loaded ${loadedCount} existing agent${loadedCount > 1 ? 's' : ''} from workspace`,
                        'Undo'
                    ).then(selection => {
                        if (selection === 'Undo') {
                            // Clear agents and reset state
                            if (this._canvasState) {
                                this._canvasState.agents = [];
                                this._sendStateToWebview();
                                this._saveState();
                                console.log('[AgentDesigner] Auto-import undone by user');
                            }
                        }
                    });
                }
            }
        }
    }

    private _handleStateUpdate(state: CanvasState) {
        console.log(`[AgentDesigner] State update received: ${state.agents.length} agents`);
        this._canvasState = state;
        this._scheduleAutoSave();
    }

    private _scheduleAutoSave() {
        if (this._autoSaveTimeout) {
            clearTimeout(this._autoSaveTimeout);
        }

        this._autoSaveTimeout = setTimeout(() => {
            this._saveState();
        }, 500);
    }

    private _saveState() {
        if (!this._canvasState) {
            console.log('[AgentDesigner] No canvas state to save');
            return;
        }

        try {
            // Ensure directory exists
            const dir = path.dirname(this._stateFilePath);
            if (!fs.existsSync(dir)) {
                console.log(`[AgentDesigner] Creating directory: ${dir}`);
                fs.mkdirSync(dir, { recursive: true });
            }

            // Save as JSON in YAML frontmatter format (easier to parse)
            const jsonContent = JSON.stringify(this._canvasState, null, 2);

            const content = `---
${jsonContent}
---

${this._canvasState.workflowDescription || '# Agent Workflow\n\nDescribe your agent workflow here.'}
`;

            fs.writeFileSync(this._stateFilePath, content, 'utf8');
            console.log(`[AgentDesigner] Saved state to: ${this._stateFilePath}`);
            console.log(`[AgentDesigner] Saved ${this._canvasState.agents.length} agents`);
        } catch (error) {
            console.error('[AgentDesigner] Save error:', error);
            vscode.window.showErrorMessage(`Failed to save state: ${error}`);
        }
    }

    private _sendStateToWebview() {
        if (!this._canvasState) {
            console.error(`[AgentDesigner] [${Date.now()}] Cannot send state: canvasState is undefined`);
            return;
        }
        
        console.log(`[AgentDesigner] [${Date.now()}] Sending state to webview: ${this._canvasState.agents.length} agents`);
        
        const sent = this._panel.webview.postMessage({
            type: 'stateLoaded',
            state: this._canvasState
        });
        
        if (!sent) {
            console.error(`[AgentDesigner] [${Date.now()}] Failed to send message to webview`);
        } else {
            console.log(`[AgentDesigner] [${Date.now()}] State message sent successfully`);
        }
    }

    private async _handleExport() {
        this._panel.webview.postMessage({ type: 'exportRequested' });
    }

    private async _performExport(agents: any[]) {
        const { AgentFileGenerator } = require('./generators/agentFileGenerator');
        
        if (!this._canvasState) {
            vscode.window.showErrorMessage('No canvas state available');
            return;
        }

        try {
            // Save design file first
            console.log('[AgentDesigner] Saving design file before export...');
            this._saveState();

            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            // Generate files
            const files = AgentFileGenerator.generateFiles(
                agents,
                this._canvasState.preferences,
                workspaceFolder.uri.fsPath
            );

            // Check for conflicts
            const conflicts = files.filter((f: any) => f.exists);
            if (conflicts.length > 0) {
                const overwrite = await vscode.window.showWarningMessage(
                    `${conflicts.length} file(s) already exist. Overwrite?`,
                    'Overwrite All',
                    'Cancel'
                );

                if (overwrite !== 'Overwrite All') {
                    return;
                }
            }

            // Write files
            await AgentFileGenerator.writeFiles(files);

            vscode.window.showInformationMessage(
                `Successfully exported ${files.length} agent file(s) to .github/${this._canvasState.preferences.exportPath}/ and saved design file to ${path.basename(this._stateFilePath)}`
            );
        } catch (error) {
            console.error('[AgentDesigner] Export error:', error);
            vscode.window.showErrorMessage(`Export failed: ${error}`);
        }
    }

    private async _handleImportDirectory() {
        const { AgentFileParser } = require('./generators/agentFileParser');
        
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            // Ask which directory to scan
            const choice = await vscode.window.showQuickPick(
                ['agents', 'chatmodes', 'Custom directory'],
                { placeHolder: 'Select directory to scan for agent files' }
            );

            if (!choice) {
                return;
            }

            let dirPath: string;
            if (choice === 'Custom directory') {
                const selected = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    defaultUri: workspaceFolder.uri,
                    openLabel: 'Select Folder'
                });

                if (!selected || selected.length === 0) {
                    return;
                }

                dirPath = selected[0].fsPath;
            } else {
                dirPath = path.join(
                    workspaceFolder.uri.fsPath,
                    '.github',
                    choice
                );
            }

            console.log(`[AgentDesigner] Scanning directory: ${dirPath}`);

            // Parse all agent files in directory
            const parseResult = AgentFileParser.parseDirectory(dirPath);
            console.log(`[AgentDesigner] Found ${parseResult.agents.length} agent files`);

            if (parseResult.agents.length === 0) {
                vscode.window.showInformationMessage('No agent files found in directory');
                return;
            }

            // Convert to canvas agents with handoffs resolved
            const canvasAgents = AgentFileParser.toCanvasAgents(parseResult.agents, parseResult.fileNames);
            console.log(`[AgentDesigner] Converted to ${canvasAgents.length} canvas agents`);

            // Update canvas state
            if (this._canvasState) {
                this._canvasState.agents = canvasAgents;
                this._saveState();
            }

            // Send to webview
            this._panel.webview.postMessage({
                type: 'stateLoaded',
                state: this._canvasState
            });

            const totalHandoffs = canvasAgents.reduce((sum: number, a: any) => sum + a.handoffs.length, 0);
            vscode.window.showInformationMessage(
                `Loaded ${canvasAgents.length} agents with ${totalHandoffs} connections from ${choice} directory`
            );

        } catch (error) {
            console.error('[AgentDesigner] Import directory error:', error);
            vscode.window.showErrorMessage(`Failed to import directory: ${error}`);
        }
    }

    private async _handleImport() {
        const { AgentFileParser } = require('./generators/agentFileParser');
        
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            // Show file picker for .agent.md files
            const files = await vscode.window.showOpenDialog({
                canSelectMany: true,
                canSelectFiles: true,
                canSelectFolders: false,
                filters: {
                    'Agent Files': ['md']
                },
                defaultUri: vscode.Uri.joinPath(
                    workspaceFolder.uri,
                    '.github',
                    'agents'
                )
            });

            if (!files || files.length === 0) {
                return;
            }

            // Parse selected files
            const parsedAgents: any[] = [];
            for (const fileUri of files) {
                try {
                    const content = fs.readFileSync(fileUri.fsPath, 'utf8');
                    const parsed = AgentFileParser.parse(content, fileUri.fsPath);
                    if (parsed) {
                        parsedAgents.push(parsed);
                    }
                } catch (error) {
                    console.error(`Error parsing ${fileUri.fsPath}:`, error);
                }
            }

            if (parsedAgents.length === 0) {
                vscode.window.showWarningMessage('No valid agent files found. Make sure files have YAML frontmatter.');
                return;
            }

            // Convert parsed agents to canvas agents with IDs and positions
            const nameToIdMap = new Map<string, string>();
            const canvasAgents: any[] = [];
            const existingCount = this._canvasState?.agents.length || 0;

            // First pass: create agents with IDs and positions
            parsedAgents.forEach((parsed, index) => {
                const id = `agent-${Date.now()}-${index}`;
                nameToIdMap.set(parsed.name, id);

                const totalIndex = existingCount + index;
                canvasAgents.push({
                    id,
                    name: parsed.name,
                    description: parsed.description,
                    instructions: '',
                    tools: parsed.tools,
                    model: parsed.model,
                    position: {
                        x: 100 + (totalIndex % 3) * 300,
                        y: 100 + Math.floor(totalIndex / 3) * 250
                    },
                    handoffs: [],
                    isEntryPoint: false
                });
            });

            // Also add existing agents to name map for cross-references
            if (this._canvasState) {
                this._canvasState.agents.forEach(agent => {
                    nameToIdMap.set(agent.name, agent.id);
                });
            }

            // Second pass: resolve handoffs by agent name
            parsedAgents.forEach((parsed, index) => {
                const agent = canvasAgents[index];
                
                parsed.handoffs.forEach((handoff: any) => {
                    const targetId = nameToIdMap.get(handoff.agentName);
                    if (targetId) {
                        agent.handoffs.push({
                            targetAgentId: targetId,
                            label: handoff.label || 'Handoff',
                            prompt: handoff.prompt || '',
                            send: handoff.send || false
                        });
                    } else {
                        console.warn(`Handoff target "${handoff.agentName}" not found for agent "${parsed.name}"`);
                    }
                });
            });

            // Auto-detect entry points (agents with no incoming handoffs)
            const hasIncoming = new Set<string>();
            canvasAgents.forEach(agent => {
                agent.handoffs.forEach((h: any) => {
                    hasIncoming.add(h.targetAgentId);
                });
            });
            if (this._canvasState) {
                this._canvasState.agents.forEach(agent => {
                    agent.handoffs.forEach((h: any) => {
                        hasIncoming.add(h.targetAgentId);
                    });
                });
            }
            canvasAgents.forEach(agent => {
                if (!hasIncoming.has(agent.id)) {
                    agent.isEntryPoint = true;
                }
            });

            // Merge with existing agents
            if (this._canvasState) {
                this._canvasState.agents = [...this._canvasState.agents, ...canvasAgents];
                this._sendStateToWebview();
                this._saveState();
            }

            vscode.window.showInformationMessage(
                `Successfully imported ${parsedAgents.length} agent(s)`
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Import failed: ${error}`);
        }
    }

    private async _handleSimulate() {
        this._panel.webview.postMessage({ type: 'simulateRequested' });
    }

    private async _handleAddFromFile() {
        const { AgentFileParser } = require('./generators/agentFileParser');
        
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            // Show file picker for single agent file
            const files = await vscode.window.showOpenDialog({
                canSelectMany: false,
                canSelectFiles: true,
                canSelectFolders: false,
                filters: {
                    'Agent Files': ['md']
                },
                defaultUri: vscode.Uri.joinPath(
                    workspaceFolder.uri,
                    '.github',
                    'agents'
                ),
                title: 'Select Agent File to Add'
            });

            if (!files || files.length === 0) {
                return;
            }

            const filePath = files[0].fsPath;
            
            // Check if it's an agent file
            if (!filePath.endsWith('.chat.md') && !filePath.endsWith('.chatmode.md')) {
                vscode.window.showWarningMessage('Please select a .chat.md or .chatmode.md file');
                return;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const parsed = AgentFileParser.parse(content, filePath);
            
            if (!parsed) {
                vscode.window.showErrorMessage('Failed to parse agent file');
                return;
            }

            // Create agent with default position (will be positioned in grid)
            const existingCount = this._canvasState?.agents.length || 0;
            const id = `agent-${Date.now()}`;
            const agent = {
                id,
                name: parsed.name,
                description: parsed.description,
                instructions: '',
                tools: parsed.tools,
                model: parsed.model,
                position: {
                    x: 100 + (existingCount % 3) * 300,
                    y: 100 + Math.floor(existingCount / 3) * 250
                },
                handoffs: [],
                isEntryPoint: false
            };

            // Add to canvas state
            if (this._canvasState) {
                this._canvasState.agents.push(agent);
            }

            // Send to webview
            this._panel.webview.postMessage({
                type: 'agentDropped',
                agent: agent
            });

            vscode.window.showInformationMessage(`Added agent "${parsed.name}" to canvas`);

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to add agent: ${error}`);
        }
    }

    private async _handleDropFile(fileName: string, position: { x: number; y: number }) {
        const { AgentFileParser } = require('./generators/agentFileParser');
        
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            // Check if it's an agent file
            if (!fileName.endsWith('.agent.md')) {
                vscode.window.showWarningMessage('Only .agent.md files can be dropped');
                return;
            }

            // Try to find the file in common locations
            const possiblePaths = [
                path.join(workspaceFolder.uri.fsPath, '.github', 'agents', fileName),
                path.join(workspaceFolder.uri.fsPath, '.github', 'chatmodes', fileName),
                path.join(workspaceFolder.uri.fsPath, fileName),
                fileName // In case it's already a full path
            ];

            let filePath: string | null = null;
            for (const testPath of possiblePaths) {
                if (fs.existsSync(testPath)) {
                    filePath = testPath;
                    break;
                }
            }

            if (!filePath) {
                vscode.window.showErrorMessage(`Could not find file: ${fileName}`);
                return;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const parsed = AgentFileParser.parse(content, filePath);
            
            if (!parsed) {
                vscode.window.showErrorMessage('Failed to parse agent file');
                return;
            }

            // Create agent with position from drop
            const id = `agent-${Date.now()}`;
            const agent = {
                id,
                name: parsed.name,
                description: parsed.description,
                instructions: '',
                tools: parsed.tools,
                model: parsed.model,
                position: position,
                handoffs: [],
                isEntryPoint: false
            };

            // Add to canvas state
            if (this._canvasState) {
                this._canvasState.agents.push(agent);
            }

            // Send to webview
            this._panel.webview.postMessage({
                type: 'agentDropped',
                agent: agent
            });

            vscode.window.showInformationMessage(`Added agent "${parsed.name}" at drop location`);

        } catch (error) {
            console.error('Drop error:', error);
            vscode.window.showErrorMessage(`Failed to add agent: ${error}`);
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'build', 'index.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'build', 'index.css')
        );

        const nonce = this._getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <title>Agent Designer</title>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public dispose() {
        AgentDesignerPanel.currentPanel = undefined;

        if (this._autoSaveTimeout) {
            clearTimeout(this._autoSaveTimeout);
        }

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
