import { Agent, Handoff } from '../models/agent';

export interface ValidationIssue {
    type: 'error' | 'warning';
    message: string;
    agentId?: string;
    handoffIndex?: number;
    quickFix?: string;
}

export interface ValidationResult {
    isValid: boolean;
    issues: ValidationIssue[];
}

export class AgentValidator {
    /**
     * Validates the entire canvas state
     */
    public static validate(agents: Agent[]): ValidationResult {
        const issues: ValidationIssue[] = [];

        // Check if at least one entry point exists
        const entryPoints = agents.filter(a => a.isEntryPoint);
        if (entryPoints.length === 0) {
            issues.push({
                type: 'error',
                message: 'No entry point defined. At least one agent must be marked as an entry point.',
                quickFix: 'Right-click on an agent and select "Toggle Entry Point"'
            });
        }

        // Check for unique agent names
        const nameMap = new Map<string, number>();
        agents.forEach(agent => {
            const count = nameMap.get(agent.name) || 0;
            nameMap.set(agent.name, count + 1);
        });

        nameMap.forEach((count, name) => {
            if (count > 1) {
                issues.push({
                    type: 'error',
                    message: `Duplicate agent name "${name}" found. Agent names must be unique.`,
                    quickFix: 'Rename one of the agents with this name'
                });
            }
        });

        // Validate each agent
        agents.forEach(agent => {
            const agentIssues = this.validateAgent(agent, agents);
            issues.push(...agentIssues);
        });

        // Check for circular dependencies
        const circularPaths = this.detectCircularDependencies(agents);
        circularPaths.forEach(path => {
            issues.push({
                type: 'error',
                message: `Circular dependency detected: ${path.join(' → ')}`,
                quickFix: 'Remove one of the handoffs in the circular path'
            });
        });

        return {
            isValid: issues.filter(i => i.type === 'error').length === 0,
            issues
        };
    }

    /**
     * Validates a single agent
     */
    private static validateAgent(agent: Agent, allAgents: Agent[]): ValidationIssue[] {
        const issues: ValidationIssue[] = [];

        // Validate agent name
        if (!agent.name || agent.name.trim() === '') {
            issues.push({
                type: 'error',
                message: `Agent has no name`,
                agentId: agent.id,
                quickFix: 'Provide a name for this agent'
            });
        }

        // Validate handoffs
        agent.handoffs.forEach((handoff, index) => {
            const handoffIssues = this.validateHandoff(handoff, agent, allAgents, index);
            issues.push(...handoffIssues);
        });

        return issues;
    }

    /**
     * Validates a single handoff
     */
    private static validateHandoff(
        handoff: Handoff,
        sourceAgent: Agent,
        allAgents: Agent[],
        handoffIndex: number
    ): ValidationIssue[] {
        const issues: ValidationIssue[] = [];

        // Check if target agent exists
        const targetAgent = allAgents.find(a => a.id === handoff.targetAgentId);
        if (!targetAgent) {
            issues.push({
                type: 'error',
                message: `Handoff from "${sourceAgent.name}" references non-existent agent ID "${handoff.targetAgentId}"`,
                agentId: sourceAgent.id,
                handoffIndex,
                quickFix: 'Remove this handoff or fix the target agent reference'
            });
        }

        // Validate handoff label
        if (!handoff.label || handoff.label.trim() === '') {
            issues.push({
                type: 'warning',
                message: `Handoff from "${sourceAgent.name}" has no label`,
                agentId: sourceAgent.id,
                handoffIndex,
                quickFix: 'Add a descriptive label for this handoff button'
            });
        }

        // Validate handoff prompt
        if (!handoff.prompt || handoff.prompt.trim() === '') {
            issues.push({
                type: 'warning',
                message: `Handoff from "${sourceAgent.name}" has no prompt`,
                agentId: sourceAgent.id,
                handoffIndex,
                quickFix: 'Add a prompt message for this handoff'
            });
        }

        return issues;
    }

    /**
     * Detects circular dependencies in the agent graph
     */
    private static detectCircularDependencies(agents: Agent[]): string[][] {
        const circularPaths: string[][] = [];
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const currentPath: string[] = [];

        const dfs = (agentId: string): boolean => {
            visited.add(agentId);
            recursionStack.add(agentId);
            
            const agent = agents.find(a => a.id === agentId);
            if (!agent) {
                return false;
            }

            currentPath.push(agent.name);

            for (const handoff of agent.handoffs) {
                if (!visited.has(handoff.targetAgentId)) {
                    if (dfs(handoff.targetAgentId)) {
                        return true;
                    }
                } else if (recursionStack.has(handoff.targetAgentId)) {
                    // Found a cycle
                    const cycleStartIndex = currentPath.findIndex(
                        name => name === agents.find(a => a.id === handoff.targetAgentId)?.name
                    );
                    if (cycleStartIndex !== -1) {
                        const cyclePath = currentPath.slice(cycleStartIndex);
                        cyclePath.push(currentPath[cycleStartIndex]); // Close the cycle
                        circularPaths.push(cyclePath);
                    }
                }
            }

            currentPath.pop();
            recursionStack.delete(agentId);
            return false;
        };

        // Run DFS from each unvisited agent
        agents.forEach(agent => {
            if (!visited.has(agent.id)) {
                dfs(agent.id);
            }
        });

        return circularPaths;
    }

    /**
     * Validates handoff target during edge creation (real-time validation)
     */
    public static validateHandoffTarget(
        sourceAgentId: string,
        targetAgentId: string,
        agents: Agent[]
    ): { valid: boolean; message?: string } {
        const sourceAgent = agents.find(a => a.id === sourceAgentId);
        const targetAgent = agents.find(a => a.id === targetAgentId);

        if (!sourceAgent || !targetAgent) {
            return {
                valid: false,
                message: 'Source or target agent not found'
            };
        }

        // Check if this would create a self-loop
        if (sourceAgentId === targetAgentId) {
            return {
                valid: false,
                message: 'Agent cannot have a handoff to itself'
            };
        }

        // Check if this would create a circular dependency
        const testAgents = agents.map(a => ({
            ...a,
            handoffs: a.id === sourceAgentId
                ? [...a.handoffs, { targetAgentId, label: '', prompt: '', send: false }]
                : a.handoffs
        }));

        const circularPaths = this.detectCircularDependencies(testAgents);
        if (circularPaths.length > 0) {
            return {
                valid: false,
                message: `This handoff would create a circular dependency: ${circularPaths[0].join(' → ')}`
            };
        }

        return { valid: true };
    }
}
