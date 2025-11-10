import { Agent, Handoff, UserPreferences } from '../models/agent';
import * as path from 'path';
import * as fs from 'fs';

export interface GeneratedFile {
    filePath: string;
    content: string;
    exists: boolean;
    originalContent?: string;
}

export class AgentFileGenerator {
    /**
     * Generates agent files for all agents
     */
    public static generateFiles(
        agents: Agent[],
        preferences: UserPreferences,
        workspaceRoot: string
    ): GeneratedFile[] {
        const files: GeneratedFile[] = [];

        const extension = '.agent.md';
        const folder = preferences.exportPath === 'agents' ? 'agents' : 'chatmodes';
        const basePath = path.join(workspaceRoot, '.github', folder);

        agents.forEach(agent => {
            const fileName = this.sanitizeFileName(agent.name) + extension;
            const filePath = path.join(basePath, fileName);
            const content = this.generateAgentFile(agent, agents, preferences.fileFormat);

            const exists = fs.existsSync(filePath);
            const originalContent = exists ? fs.readFileSync(filePath, 'utf8') : undefined;

            files.push({
                filePath,
                content,
                exists,
                originalContent
            });
        });

        return files;
    }

    /**
     * Generates a single agent file content
     */
    private static generateAgentFile(
        agent: Agent,
        allAgents: Agent[],
        format: 'agent.md'
    ): string {
        const frontmatter = this.generateFrontmatter(agent, allAgents);
        const body = this.generateBody(agent);

        return `---
${frontmatter}---

${body}
`;
    }

    /**
     * Converts agent name to filename prefix (e.g., "Project Manager" -> "project-manager")
     */
    private static nameToFilePrefix(name: string): string {
        return name.toLowerCase().replace(/\s+/g, '-');
    }

    /**
     * Generates YAML frontmatter
     */
    private static generateFrontmatter(agent: Agent, allAgents: Agent[]): string {
        const lines: string[] = [];

        // Description
        if (agent.description) {
            lines.push(`description: ${this.escapeYamlString(agent.description)}`);
        }

        // Tools
        if (agent.tools && agent.tools.length > 0) {
            lines.push(`tools:`);
            agent.tools.forEach(tool => {
                lines.push(`  - ${this.escapeYamlString(tool)}`);
            });
        }

        // Model
        if (agent.model) {
            lines.push(`model: ${this.escapeYamlString(agent.model)}`);
        }

        // Handoffs
        if (agent.handoffs && agent.handoffs.length > 0) {
            lines.push(`handoffs:`);
            agent.handoffs.forEach(handoff => {
                const targetAgent = allAgents.find(a => a.id === handoff.targetAgentId);
                if (targetAgent) {
                    // Use filename prefix derived from agent name for consistency with file names
                    const filePrefix = this.nameToFilePrefix(targetAgent.name);
                    lines.push(`  - agent: ${this.escapeYamlString(filePrefix)}`);
                    lines.push(`    label: ${this.escapeYamlString(handoff.label)}`);
                    if (handoff.prompt) {
                        lines.push(`    prompt: ${this.escapeYamlString(handoff.prompt)}`);
                    }
                    lines.push(`    send: ${handoff.send}`);
                }
            });
        }

        return lines.join('\n') + '\n';
    }

    /**
     * Generates markdown body with instructions
     */
    private static generateBody(agent: Agent): string {
        const instructionsText = agent.instructions || 'Provide specific instructions for this agent\'s behavior and capabilities here.';
        
        return `# ${agent.name}

${agent.description || 'Agent description goes here.'}

## Instructions

${instructionsText}

## Tools

${agent.tools && agent.tools.length > 0 
    ? agent.tools.map(tool => `- ${tool}`).join('\n')
    : 'No tools configured for this agent.'}

## Handoffs

${agent.handoffs && agent.handoffs.length > 0
    ? 'This agent can hand off to the following agents:\n' + 
      agent.handoffs.map(h => `- **${h.label}**: ${h.prompt || 'No prompt specified'}`).join('\n')
    : 'No handoffs configured for this agent.'}
`;
    }

    /**
     * Escapes strings for YAML
     */
    private static escapeYamlString(str: string): string {
        if (!str) {
            return '""';
        }

        // Check if string needs quotes
        if (str.includes(':') || str.includes('#') || str.includes('\n') || 
            str.includes('"') || str.includes("'") || str.trim() !== str) {
            // Use double quotes and escape internal quotes
            return `"${str.replace(/"/g, '\\"')}"`;
        }

        return str;
    }

    /**
     * Sanitizes filename
     */
    private static sanitizeFileName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Writes files to disk
     */
    public static async writeFiles(files: GeneratedFile[]): Promise<void> {
        for (const file of files) {
            const dir = path.dirname(file.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(file.filePath, file.content, 'utf8');
        }
    }
}
