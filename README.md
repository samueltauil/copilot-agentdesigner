# Agent Designer for VS Code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.4.1-green.svg)](https://github.com/samueltauil/copilot-agentdesigner)
[![GitHub](https://img.shields.io/github/stars/samueltauil/copilot-agentdesigner?style=social)](https://github.com/samueltauil/copilot-agentdesigner)

A powerful visual canvas extension for designing multi-agent workflows. Create, connect, and export GitHub Copilot agents with an intuitive drag-and-drop interface.

## ✨ Features

### 🎨 Visual Design

- **Interactive Canvas**: Drag-and-drop interface powered by React Flow
- **Agent Nodes**: Visual representation of AI agents with customizable properties
- **Connection Flows**: Draw connections between agents to define handoff workflows
- **Auto-Layout**: Automatic grid arrangement for clean organization
- **Zoom & Pan**: Navigate large workflows with ease

### 🤖 Agent Configuration

- **Rich Properties**: Name, description, instructions, tools, and AI model selection
- **Entry Points**: Mark agents as workflow starting points
- **Handoff Management**: Define transitions with labels, prompts, and auto-send options
- **Model Support**: GPT-4, GPT-5, Claude Sonnet 4, and more
- **Tool Integration**: Configure available tools for each agent

### 📁 File Management

- **Import/Export**: Save and load agent workflows
- **Directory Import**: Load entire directories of agent files
- **Drag-and-Drop**: Drop `.agent.md` files directly onto canvas
- **State Persistence**: Automatic saving to `.agentdesign.md` files
- **File Format**: Generates `.agent.md` files compatible with GitHub Copilot

### ✅ Validation & Quality

- **Real-time Validation**: Catch errors before export
- **Circular Dependency Detection**: Prevent infinite loops
- **Required Field Checks**: Ensure complete agent definitions
- **Entry Point Validation**: Verify workflow has proper starting points

## 🚀 Getting Started

### Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Agent Designer"
4. Click Install

### Quick Start

1. **Open the Canvas**
   - Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   - Run: `Agent Designer: Open Canvas`

2. **Create Your First Agent**
   - Click "Add Agent" button
   - Fill in agent details (name, description, instructions)
   - Click "Save"

3. **Connect Agents**
   - Drag from one agent to another to create a handoff
   - Click the connection line to configure handoff details

4. **Export Your Workflow**
   - Click "Export" to validate and save
   - Files are created in `.github/agents/` directory

## 📖 Usage Guide

### Opening the Canvas

- Command: `Agent Designer: Open Canvas`
- Or right-click an `.agentdesign.md` file in Explorer

### Creating Agents

**Add New Agent:**
- Click **Add Agent** button in toolbar
- Or use **Add from File** to import existing `.agent.md` files

**Configure Agent:**
1. Click **Edit** (✏️) on the agent node
2. Fill in properties:
   - **Name**: Agent identifier (max 100 chars)
   - **Description**: Brief overview (max 1000 chars)
   - **Instructions**: Detailed behavior guide (max 8000 chars)
   - **Model**: Select AI model (GPT-4, Claude Sonnet 4, etc.)
   - **Tools**: Comma-separated list (e.g., `fetch, search, files`)
3. Click **Save**

**Agent Actions:**
- **Entry Point** (⭐): Mark as workflow starting point
- **Edit** (✏️): Modify agent properties
- **Delete** (🗑️): Remove agent from canvas

### Creating Handoffs

**Connect Agents:**
1. Click and drag from one agent to another
2. A connection line appears

**Configure Handoff:**
1. Click on the connection line
2. Edit properties:
   - **Label**: Button text in chat UI (e.g., "Start Implementation")
   - **Prompt**: Message sent on handoff (optional)
   - **Auto-send**: Automatically submit prompt (checkbox)
3. Click **Save**

### Import & Export

**Import:**
- **Import Files**: Select multiple `.agent.md` files
- **Load from Directory**: Scan folder for all agent files
- **Drag & Drop**: Drop `.agent.md` files onto canvas

**Export:**
1. Click **Export** button
2. Review validation results
3. Files saved to `.github/agents/` directory

### Settings

**Access Settings:**
- Click **Settings** button in toolbar

**Configuration Options:**
- **Export Path**: Choose between `.github/agents` or `.github/chatmodes`
- **File Format**: Always exports as `.agent.md` files

## 📋 Requirements

- **VS Code**: Version 1.105.0 or higher
- **Node.js**: 22.x or higher (for development only)

## 🎯 Extension Commands

| Command | Description |
|---------|-------------|
| `Agent Designer: Open Canvas` | Open the visual designer |
| `Agent Designer: Open Design File` | Open existing `.agentdesign.md` file |
| `Agent Designer: Export Agents` | Export agents to `.agent.md` files |
| `Agent Designer: Import Agents` | Import agent files |
| `Agent Designer: Open as Text` | View design file as text |

**Note**: Some commands (New From Template, Run Simulation, Customize Theme) are registered but not yet implemented. The Toggle Entry Point feature is available via the UI button on agent nodes.

## 📄 Generated File Format

Agent Designer exports `.agent.md` files compatible with GitHub Copilot:

```markdown
---
description: Generate an implementation plan
tools:
  - fetch
  - search
  - usages
model: Claude Sonnet 4
handoffs:
  - agent: Implement
    label: Start Implementation
    prompt: Now implement the plan outlined above.
    send: false
---

# Plan

## Instructions

Generate an implementation plan for new features or refactoring.

Collect project context and create detailed implementation steps...
```

**File Structure:**
- **YAML Frontmatter**: Agent metadata and handoff definitions
- **Markdown Body**: Agent name (H1) and instructions (H2)
- **Location**: Exported to `.github/agents/` directory

## 🛠️ Development

### Setup

```bash
# Clone repository
git clone https://github.com/samueltauil/copilot-agentdesigner.git
cd copilot-agentdesigner

# Install dependencies
npm install
```

### Build

```bash
# Compile extension
npm run compile

# Compile webview
npm run compile:webview

# Build for publishing
npm run vscode:prepublish
```

### Development Mode

```bash
# Watch extension
npm run watch

# Watch webview (separate terminal)
npm run watch:webview

# Launch extension
Press F5 in VS Code
```

### Project Structure

```
copilot-agentdesigner/
├── src/                      # Extension source
│   ├── extension.ts         # Extension entry point
│   ├── AgentDesignerPanel.ts # Webview panel controller
│   ├── AgentDesignEditorProvider.ts # Custom editor
│   ├── models/              # TypeScript interfaces
│   └── generators/          # File generation/parsing
├── webview-ui/              # React frontend
│   └── src/
│       ├── App.tsx          # Main canvas component
│       ├── AgentNode.tsx    # Agent node component
│       └── layout.ts        # Layout algorithms
├── out/                     # Compiled output
└── package.json             # Extension manifest
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React Flow](https://reactflow.dev/) for canvas visualization
- Powered by [VS Code Extension API](https://code.visualstudio.com/api)

## 📧 Support

For questions, issues, or feature requests:
- [Open an issue](https://github.com/samueltauil/copilot-agentdesigner/issues)
- [View documentation](https://github.com/samueltauil/copilot-agentdesigner#readme)

---

Made with ❤️ for the VS Code community
