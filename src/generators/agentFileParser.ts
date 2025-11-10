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
     * Extracts agent name from filename (e.g., "qa-analyst.agent.md" -> "QA Analyst")
     */
    public static extractAgentNameFromFilename(fileName: string): string {
        // Remove file extension
        const baseName = path.basename(fileName, path.extname(fileName));
        // Remove .agent or .chatmode suffix
        const cleanName = baseName.replace(/\.(agent|chatmode)$/, '');
        // Replace hyphens and underscores with spaces, capitalize each word
        return cleanName
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Parses agent file content and returns parsed data (not resolved yet)
     */
    public static parse(content: string, filePath: string): ParsedAgent | null {
        try {
            const fileName = path.basename(filePath);
            
            // Strip UTF-8 BOM if present
            content = content.replace(/^\uFEFF/, '');
            // Trim leading whitespace
            content = content.trimStart();

            // Try to match frontmatter with CRLF support
            const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);

            if (!match) {
                // No frontmatter found - use defaults
                const agentName = this.extractAgentNameFromFilename(fileName);
                console.log(`[Parser] No frontmatter in ${fileName}, using defaults`);
                console.log(`[Parser] Extracted name from filename: "${agentName}"`);
                console.log(`[Parser] Missing description, using empty string`);
                console.log(`[Parser] Missing tools, using empty array`);
                console.log(`[Parser] Missing model, using "Claude Sonnet 4"`);
                console.warn(`[Parser] Agent "${agentName}" imported without description - user should add this in editor`);
                console.warn(`[Parser] Agent "${agentName}" imported without instructions - user should add this in editor`);
                
                return {
                    name: agentName,
                    description: '',
                    tools: [],
                    model: 'Claude Sonnet 4',
                    handoffs: []
                };
            }

            const frontmatter = this.parseFrontmatter(match[1]);
            const agentName = frontmatter.name || this.extractAgentNameFromFilename(fileName);
            
            // Count fields and log what's present/missing
            let fieldCount = 0;
            const totalFields = 5;
            
            if (frontmatter.name) fieldCount++;
            else console.log(`[Parser] Missing name in ${fileName}, using filename-derived: "${agentName}"`);
            
            if (frontmatter.description) fieldCount++;
            else {
                console.log(`[Parser] Missing description in ${fileName}, using empty string`);
                console.warn(`[Parser] Agent "${agentName}" imported without description - user should add this in editor`);
            }
            
            if (frontmatter.tools && frontmatter.tools.length > 0) fieldCount++;
            else console.log(`[Parser] Missing tools in ${fileName}, using empty array`);
            
            if (frontmatter.model) fieldCount++;
            else console.log(`[Parser] Missing model in ${fileName}, using "Claude Sonnet 4"`);
            
            if (frontmatter.handoffs && frontmatter.handoffs.length > 0) fieldCount++;
            
            console.log(`[Parser] Imported ${fileName} with ${fieldCount}/${totalFields} fields from frontmatter`);

            return {
                name: agentName,
                description: frontmatter.description || '',
                tools: frontmatter.tools || [],
                model: frontmatter.model || 'Claude Sonnet 4',
                handoffs: frontmatter.handoffs || []
            };
        } catch (error) {
            console.error(`[Parser] Failed to parse agent file ${path.basename(filePath)}:`, error);
            return null;
        }
    }

    /**
     * Parses agent files from a directory
     */
    public static parseDirectory(dirPath: string): { agents: ParsedAgent[]; fileNames: string[] } {
        const agents: ParsedAgent[] = [];
        const fileNames: string[] = [];

        if (!fs.existsSync(dirPath)) {
            return { agents, fileNames };
        }

        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
            // Support both .agent.md and .chatmode.md extensions
            if (file.endsWith('.agent.md') || file.endsWith('.chatmode.md')) {
                const filePath = path.join(dirPath, file);
                try {
                    const agent = this.parseFile(filePath);
                    if (agent) {
                        agents.push(agent);
                        fileNames.push(file);
                        console.log(`[AgentFileParser] Loaded ${file} from ${dirPath}`);
                    }
                } catch (error) {
                    console.error(`Error parsing ${file}:`, error);
                }
            }
        }

        return { agents, fileNames };
    }

    /**
     * Parses a single agent file
     */
    public static parseFile(filePath: string): ParsedAgent | null {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            
            // Strip UTF-8 BOM if present
            content = content.replace(/^\uFEFF/, '');
            // Trim leading whitespace
            content = content.trimStart();

            // Try to match frontmatter with CRLF support
            const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);

            if (!match) {
                // No frontmatter found - use defaults
                const agentName = this.extractAgentNameFromFilename(fileName);
                console.log(`[Parser] No frontmatter in ${fileName}, using defaults`);
                console.log(`[Parser] Extracted name from filename: "${agentName}"`);
                console.log(`[Parser] Missing description, using empty string`);
                console.log(`[Parser] Missing tools, using empty array`);
                console.log(`[Parser] Missing model, using "Claude Sonnet 4"`);
                console.warn(`[Parser] Agent "${agentName}" imported without description - user should add this in editor`);
                console.warn(`[Parser] Agent "${agentName}" imported without instructions - user should add this in editor`);
                
                return {
                    name: agentName,
                    description: '',
                    tools: [],
                    model: 'Claude Sonnet 4',
                    handoffs: []
                };
            }

            const frontmatter = this.parseFrontmatter(match[1]);
            const agentName = frontmatter.name || this.extractAgentNameFromFilename(fileName);
            
            // Count fields and log what's present/missing
            let fieldCount = 0;
            const totalFields = 5;
            
            if (frontmatter.name) fieldCount++;
            else console.log(`[Parser] Missing name in ${fileName}, using filename-derived: "${agentName}"`);
            
            if (frontmatter.description) fieldCount++;
            else {
                console.log(`[Parser] Missing description in ${fileName}, using empty string`);
                console.warn(`[Parser] Agent "${agentName}" imported without description - user should add this in editor`);
            }
            
            if (frontmatter.tools && frontmatter.tools.length > 0) fieldCount++;
            else console.log(`[Parser] Missing tools in ${fileName}, using empty array`);
            
            if (frontmatter.model) fieldCount++;
            else console.log(`[Parser] Missing model in ${fileName}, using "Claude Sonnet 4"`);
            
            if (frontmatter.handoffs && frontmatter.handoffs.length > 0) fieldCount++;
            
            console.log(`[Parser] Imported ${fileName} with ${fieldCount}/${totalFields} fields from frontmatter`);
            console.log(`[AgentFileParser] Parsed ${fileName}: ${frontmatter.handoffs?.length || 0} handoffs`);

            return {
                name: agentName,
                description: frontmatter.description || '',
                tools: frontmatter.tools || [],
                model: frontmatter.model || 'Claude Sonnet 4',
                handoffs: frontmatter.handoffs || []
            };
        } catch (error) {
            console.error(`[Parser] Failed to parse ${path.basename(filePath)}:`, error);
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

            // Check for array item marker (-)
            if (trimmed.startsWith('- ') && currentKey) {
                const restOfLine = trimmed.substring(2).trim();
                
                if (currentKey === 'tools') {
                    // Simple string array item
                    result.tools.push(this.parseValue(restOfLine));
                } else if (currentKey === 'handoffs') {
                    // Start of new handoff object in array
                    const match = restOfLine.match(/^(\w+):\s*(.*)$/);
                    if (match && match[1] === 'agent') {
                        currentObject = {
                            agentName: this.parseValue(match[2]),
                            label: '',
                            prompt: '',
                            send: false
                        };
                        result.handoffs.push(currentObject);
                    }
                }
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
                } else if (indent === 2 && currentKey === 'handoffs' && currentObject) {
                    // Property of current handoff object
                    if (key === 'agent') {
                        // This is a non-array handoff format (old style)
                        currentObject = {
                            agentName: this.parseValue(value),
                            label: '',
                            prompt: '',
                            send: false
                        };
                        result.handoffs.push(currentObject);
                    } else {
                        // Add property to current handoff object
                        currentObject[key] = this.parseValue(value);
                    }
                } else if (indent === 4 && currentKey === 'handoffs' && currentObject) {
                    // Property within array item handoff (with - prefix)
                    currentObject[key] = this.parseValue(value);
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
     * Converts filename to readable name (legacy method, use extractAgentNameFromFilename)
     * @deprecated Use extractAgentNameFromFilename instead
     */
    private static nameFromFileName(fileName: string): string {
        return this.extractAgentNameFromFilename(fileName);
    }

    /**
     * Converts parsed agents to Agent objects for canvas
     */
    public static toCanvasAgents(parsedAgents: ParsedAgent[], fileNames?: string[]): Agent[] {
        const agents: Agent[] = [];
        const nameToIdMap = new Map<string, string>();

        // First pass: create agents with IDs
        parsedAgents.forEach((parsed, index) => {
            const id = `agent-${Date.now()}-${index}`;
            
            // Map both the display name and the filename prefix for handoff resolution
            nameToIdMap.set(parsed.name, id);
            
            // If fileNames provided, also map the filename prefix (e.g., "developer" from "developer.agent.md")
            if (fileNames && fileNames[index]) {
                const fileNamePrefix = fileNames[index]
                    .replace(/\.(agent|chatmode)\.md$/, '')
                    .toLowerCase();
                nameToIdMap.set(fileNamePrefix, id);
                console.log(`[AgentFileParser] Mapped filename "${fileNamePrefix}" to agent "${parsed.name}" (${id})`);
            }

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

        // Second pass: resolve handoffs (try exact match first, then lowercase)
        console.log(`[AgentFileParser] Resolving handoffs. Available name mappings:`, Array.from(nameToIdMap.keys()));
        
        parsedAgents.forEach((parsed, index) => {
            const agent = agents[index];
            
            if (parsed.handoffs.length > 0) {
                console.log(`[AgentFileParser] Processing ${parsed.handoffs.length} handoffs for ${parsed.name}`);
            }
            
            parsed.handoffs.forEach(handoff => {
                console.log(`[AgentFileParser] Trying to resolve handoff: "${handoff.agentName}"`);
                
                // Try exact match first
                let targetId = nameToIdMap.get(handoff.agentName);
                
                // If not found, try lowercase (filename convention)
                if (!targetId) {
                    targetId = nameToIdMap.get(handoff.agentName.toLowerCase());
                }
                
                if (targetId) {
                    agent.handoffs.push({
                        targetAgentId: targetId,
                        label: handoff.label,
                        prompt: handoff.prompt,
                        send: handoff.send
                    });
                    console.log(`[AgentFileParser] ✓ Resolved handoff: ${parsed.name} -> ${handoff.agentName} (${targetId})`);
                } else {
                    console.warn(`[AgentFileParser] ✗ Could not resolve handoff from ${parsed.name} to "${handoff.agentName}". Available:`, Array.from(nameToIdMap.keys()));
                }
            });
        });

        // Auto-detect entry points (agents with no incoming handoffs)
        const hasIncoming = new Set<string>();
        const hasAnyHandoffs = agents.some(agent => agent.handoffs.length > 0);
        
        agents.forEach(agent => {
            agent.handoffs.forEach(handoff => {
                hasIncoming.add(handoff.targetAgentId);
            });
        });

        // Only set entry points if there are handoffs in the workflow
        if (hasAnyHandoffs) {
            agents.forEach(agent => {
                if (!hasIncoming.has(agent.id)) {
                    agent.isEntryPoint = true;
                    console.log(`[AgentFileParser] Marked ${agent.name} as entry point (no incoming handoffs)`);
                }
            });
        } else {
            console.log(`[AgentFileParser] No handoffs found, leaving all entry points as false`);
        }

        return agents;
    }
}
