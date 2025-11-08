import { Agent, Handoff } from '../models/agent';
import * as fs from 'fs';
import * as path from 'path';

export interface ParsedAgent {
    name: string;
    description: string;
    tools: string[];
    model: string;
    handoffs: {
        agentName: string;
        label: string;
        prompt: string;
        send: boolean;
    }[];
}

export class AgentFileParser {
    /**
     * Parses agent file content and returns parsed data (not resolved yet)
     */
    public static parse(content: string, filePath: string): ParsedAgent | null {
        try {
            const match = content.match(/^---\n([\s\S]*?)\n---/);

            if (!match) {
                throw new Error('No frontmatter found');
            }

            const frontmatter = this.parseFrontmatter(match[1]);
            const fileName = path.basename(filePath, path.extname(filePath));
            
            // Remove .agent from filename if present
            const name = fileName.replace(/\.agent$/, '');

            return {
                name: frontmatter.name || this.nameFromFileName(name),
                description: frontmatter.description || '',
                tools: frontmatter.tools || [],
                model: frontmatter.model || '',
                handoffs: frontmatter.handoffs || []
            };
        } catch (error) {
            console.error(`Failed to parse agent file:`, error);
            return null;
        }
    }

    /**
     * Parses agent files from a directory
     */
    public static parseDirectory(dirPath: string): ParsedAgent[] {
        const agents: ParsedAgent[] = [];

        if (!fs.existsSync(dirPath)) {
            return agents;
        }

        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
            if (file.endsWith('.agent.md')) {
                const filePath = path.join(dirPath, file);
                try {
                    const agent = this.parseFile(filePath);
                    if (agent) {
                        agents.push(agent);
                    }
                } catch (error) {
                    console.error(`Error parsing ${file}:`, error);
                }
            }
        }

        return agents;
    }

    /**
     * Parses a single agent file
     */
    public static parseFile(filePath: string): ParsedAgent | null {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const match = content.match(/^---\n([\s\S]*?)\n---/);

            if (!match) {
                throw new Error('No frontmatter found');
            }

            const frontmatter = this.parseFrontmatter(match[1]);
            const fileName = path.basename(filePath, path.extname(filePath));
            
            // Remove .agent from filename if present
            const name = fileName.replace(/\.agent$/, '');

            return {
                name: frontmatter.name || this.nameFromFileName(name),
                description: frontmatter.description || '',
                tools: frontmatter.tools || [],
                model: frontmatter.model || '',
                handoffs: frontmatter.handoffs || []
            };
        } catch (error) {
            console.error(`Failed to parse ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Parses YAML frontmatter
     */
    private static parseFrontmatter(yaml: string): any {
        const result: any = {
            tools: [],
            handoffs: []
        };

        const lines = yaml.split('\n');
        let currentKey: string | null = null;
        let currentObject: any = null;
        let inArray = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed) {
                continue;
            }

            // Check for key-value pair
            const match = line.match(/^(\s*)(\w+):\s*(.*)$/);
            if (match) {
                const indent = match[1].length;
                const key = match[2];
                const value = match[3].trim();

                if (indent === 0) {
                    // Top-level key
                    currentKey = key;
                    
                    if (value) {
                        result[key] = this.parseValue(value);
                        inArray = false;
                    } else {
                        // Empty value means array or object follows
                        inArray = true;
                        if (key === 'handoffs') {
                            result[key] = [];
                        } else if (key === 'tools') {
                            result[key] = [];
                        }
                    }
                } else if (indent === 2 && currentKey === 'handoffs') {
                    // Handoff property
                    if (key === 'agent') {
                        currentObject = {
                            agentName: this.parseValue(value),
                            label: '',
                            prompt: '',
                            send: false
                        };
                        result.handoffs.push(currentObject);
                    } else if (currentObject) {
                        currentObject[key] = this.parseValue(value);
                    }
                }
            } else if (trimmed.startsWith('- ') && currentKey) {
                // Array item
                const value = trimmed.substring(2).trim();
                if (currentKey === 'tools') {
                    result.tools.push(this.parseValue(value));
                }
            }
        }

        return result;
    }

    /**
     * Parses a YAML value
     */
    private static parseValue(value: string): any {
        if (!value) {
            return '';
        }

        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.substring(1, value.length - 1).replace(/\\"/g, '"');
        }

        // Parse boolean
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }

        // Parse number
        if (/^-?\d+(\.\d+)?$/.test(value)) {
            return parseFloat(value);
        }

        return value;
    }

    /**
     * Converts filename to readable name
     */
    private static nameFromFileName(fileName: string): string {
        return fileName
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    /**
     * Converts parsed agents to Agent objects for canvas
     */
    public static toCanvasAgents(parsedAgents: ParsedAgent[]): Agent[] {
        const agents: Agent[] = [];
        const nameToIdMap = new Map<string, string>();

        // First pass: create agents with IDs
        parsedAgents.forEach((parsed, index) => {
            const id = `agent-${Date.now()}-${index}`;
            nameToIdMap.set(parsed.name, id);

            agents.push({
                id,
                name: parsed.name,
                description: parsed.description,
                tools: parsed.tools,
                model: parsed.model,
                position: { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
                handoffs: [],
                isEntryPoint: false
            });
        });

        // Second pass: resolve handoffs
        parsedAgents.forEach((parsed, index) => {
            const agent = agents[index];
            
            parsed.handoffs.forEach(handoff => {
                const targetId = nameToIdMap.get(handoff.agentName);
                if (targetId) {
                    agent.handoffs.push({
                        targetAgentId: targetId,
                        label: handoff.label,
                        prompt: handoff.prompt,
                        send: handoff.send
                    });
                }
            });
        });

        // Auto-detect entry points (agents with no incoming handoffs)
        const hasIncoming = new Set<string>();
        agents.forEach(agent => {
            agent.handoffs.forEach(handoff => {
                hasIncoming.add(handoff.targetAgentId);
            });
        });

        agents.forEach(agent => {
            if (!hasIncoming.has(agent.id)) {
                agent.isEntryPoint = true;
            }
        });

        return agents;
    }
}
