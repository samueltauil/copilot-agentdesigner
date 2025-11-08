# Project Context - Agent Designer for VS Code

**Last Updated:** November 8, 2025  
**Version:** 0.4.1  
**Status:** Ready for publication

## Project Overview

Agent Designer is a VS Code extension that provides a visual canvas for designing multi-agent workflows. Users can create, connect, and export GitHub Copilot agents using an intuitive drag-and-drop interface.

## Technology Stack

- **Backend:** TypeScript + VS Code Extension API (1.105.0+)
- **Frontend:** React 19.2.0 + React Flow (@xyflow/react 12.9.2)
- **Layout:** ELK.js 0.11.0 (currently using simple grid layout)
- **Build:** esbuild for webview bundling, TypeScript compiler for extension

## Current State

### Completed Features ✅

1. **Visual Canvas**
   - Interactive drag-and-drop interface
   - React Flow-based node system
   - Smoothstep edge routing with enhanced visibility
   - Zoom and pan controls
   - Background grid with dots pattern

2. **Agent Management**
   - Create/edit/delete agents
   - Configure: name, description, instructions, tools, model
   - Mark entry points
   - Click-to-edit nodes
   - Agent nodes with visual styling

3. **Handoff System**
   - Visual connections between agents
   - Click edges to edit handoff properties
   - Configure: label, prompt, auto-send
   - Smoothstep routing (3px stroke, hover effects)

4. **File Operations**
   - Import individual `.agent.md` files
   - Import from directory (scans all `.agent.md` files)
   - Export to `.github/agents/` or `.github/chatmodes/`
   - Drag-and-drop `.agent.md` files onto canvas
   - Custom editor for `.agentdesign.md` files (single tab, no double-opening)
   - "Open as Text" command for viewing raw markdown
   - State persistence in `.agentdesign.md` with JSON in YAML frontmatter

5. **Validation**
   - Real-time validation before export
   - Checks: circular dependencies, required fields, entry points
   - Validation panel with error/warning display

6. **UI/UX**
   - Flat modern toolbar design (matching VS Code aesthetic)
   - Removed minimap component
   - Clean button styling with hover effects
   - No double-tab opening (custom editor with default priority)

7. **File Format**
   - Changed from `.chat.md`/`.chatmode.md` to `.agent.md`
   - YAML frontmatter with agent metadata
   - Markdown body with name (H1) and instructions (H2)

### Known Issues ⚠️

1. **Auto-Layout Not Working**
   - Current implementation: Simple grid layout (3 columns, 400px spacing)
   - Issue: Nodes still appear grouped in center despite positioning
   - Attempted fixes:
     - Removed all `fitView` calls
     - Set explicit viewport
     - Created new node objects
     - Increased spacing dramatically
     - Simplified to basic grid layout
   - Root cause: Unknown (possibly React Flow internal behavior)
   - **Status:** Deferred for later investigation
   - **Workaround:** Users can manually arrange nodes

2. **TypeScript Errors (Pre-existing)**
   - Some type assertion issues in modal components
   - Does not affect compilation or runtime
   - Compiles successfully with `npm run compile`

## Project Structure

```
copilot-agentdesigner/
├── src/
│   ├── extension.ts                    # Extension entry point, commands
│   ├── AgentDesignerPanel.ts          # Webview panel controller, state management
│   ├── AgentDesignEditorProvider.ts   # Custom editor for .agentdesign.md
│   ├── models/
│   │   └── agent.ts                   # TypeScript interfaces, DEFAULT_PREFERENCES
│   └── generators/
│       ├── agentFileGenerator.ts      # Generates .agent.md files
│       └── agentFileParser.ts         # Parses .agent.md, scans directories
├── webview-ui/src/
│   ├── App.tsx                        # Main canvas, React Flow setup
│   ├── App.css                        # Canvas styling, edge animations
│   ├── AgentNode.tsx                  # Agent node component
│   ├── AgentEditModal.tsx             # Agent property editor
│   ├── HandoffModal.tsx               # Handoff editor
│   ├── ValidationPanel.tsx            # Validation UI
│   ├── SettingsPanel.tsx              # Settings UI
│   └── layout.ts                      # Layout algorithms (simple grid)
├── out/                               # Compiled output
├── package.json                       # Extension manifest, v0.4.1
├── README.md                          # Comprehensive documentation
├── CHANGELOG.md                       # Version history
├── LICENSE                            # MIT License
├── PUBLISHING.md                      # Publication guide
└── .vscodeignore                      # Files excluded from package
```

## Key Implementation Details

### State Management
- State stored in `.agentdesign.md` files
- Format: YAML frontmatter with JSON content
- Contains: agents array, preferences, theme, workflowDescription
- Auto-saves on changes

### File Format (.agent.md)
```yaml
---
description: Agent description
tools:
  - tool1
  - tool2
model: Claude Sonnet 4
handoffs:
  - agent: TargetAgent
    label: Handoff Label
    prompt: Optional prompt
    send: false
---

# Agent Name

## Instructions

Detailed instructions here...
```

### Custom Editor
- Registered for `*.agentdesign.md` files
- Priority: `default` (opens as canvas by default)
- Context menu: "Open as Text" command
- Single tab opening (no duplicate tabs)

### Edge Styling
- Type: `smoothstep`
- Stroke width: 3px
- Color: #9e9e9e (default), #1e88e5 (hover/selected)
- Z-index layering for visibility
- Hover effects with glow
- Selected animation (pulse)

### Toolbar Design
- Flat buttons with transparent background
- Border: 1px solid rgba(255, 255, 255, 0.15)
- Hover: subtle background + border highlight
- Primary actions (Add Agent, Add from File): VS Code button background

## Recent Changes (Last Session)

1. Changed file extension from `.chat.md`/`.chatmode.md` to `.agent.md`
2. Updated all file parsing and generation logic
3. Attempted multiple fixes for auto-layout (not successful)
4. Simplified layout to basic grid (3 columns)
5. Prepared repository for publication:
   - Updated package.json with metadata
   - Created comprehensive README.md
   - Added MIT LICENSE
   - Created PUBLISHING.md guide
   - Updated .vscodeignore

## Commands Available

### Fully Implemented
- `Agent Designer: Open Canvas` - Open new canvas
- `Agent Designer: Open Design File` - Open .agentdesign.md
- `Agent Designer: Export Agents` - Export to files
- `Agent Designer: Import Agents` - Import files
- `Agent Designer: Open as Text` - View design file as text

### Not Yet Implemented (Stubs Only)
- `Agent Designer: New From Template` - Shows "coming soon" message (templates exist in code but no UI)
- `Agent Designer: Run Simulation` - Shows "coming soon" message
- `Agent Designer: Toggle Entry Point` - Shows "coming soon" message (feature works via UI button)
- `Agent Designer: Customize Theme` - Shows "coming soon" message

## Development Workflow

### Build
```bash
npm run compile              # Compile extension
npm run compile:webview      # Compile webview
npm run vscode:prepublish    # Full build for publishing
```

### Watch Mode
```bash
npm run watch                # Watch extension
npm run watch:webview        # Watch webview (separate terminal)
```

### Run Extension
Press F5 in VS Code to launch Extension Development Host

### Test
1. Run extension (F5)
2. Open Command Palette (Ctrl+Shift+P)
3. Run "Agent Designer: Open Canvas"
4. Test features

## Publication Readiness

### Completed
- ✅ Package.json updated with metadata
- ✅ README.md comprehensive
- ✅ MIT License added
- ✅ CHANGELOG.md exists
- ✅ .vscodeignore configured
- ✅ Code compiles successfully
- ✅ PUBLISHING.md guide created

### Before Publishing
- [ ] Update publisher name in package.json (currently: `TODO-publisher-name`)
- [ ] Update author name in package.json (currently: `TODO-author-name`)
- [ ] Add repository URLs if desired (currently removed to avoid placeholders)
- [ ] Create icon.png (128x128) if desired (icon field removed from package.json)
- [ ] Create publisher account on marketplace
- [ ] Get Personal Access Token from Azure DevOps
- [ ] Add screenshots/GIFs to README
- [ ] Test .vsix package locally
- [ ] Remove or implement stub commands (template, simulation, theme) before v1.0.0

## Next Steps / Future Improvements

1. **Fix Auto-Layout**
   - Investigate React Flow positioning behavior
   - Consider using React Flow's built-in layout utilities
   - Test with explicit position updates and viewport control

2. **Implement Stub Commands**
   - Template gallery UI (templates exist in `src/templates/workflowTemplates.ts`)
   - Workflow simulation functionality
   - Theme customization UI
   - Wire up Toggle Entry Point command (UI button already works)

3. **Enhanced Features**
   - Undo/redo functionality
   - Export to different formats
   - Import from other sources

3. **UI Improvements**
   - Minimap toggle option
   - Customizable themes
   - Node color customization
   - Grid snapping

4. **Quality**
   - Fix TypeScript type assertions
   - Add unit tests
   - Add integration tests
   - Performance optimization for large graphs

## Important Notes

- Extension requires VS Code 1.105.0+
- Uses Node.js 22.x for development
- React Flow version: @xyflow/react 12.9.2
- File format changed to .agent.md (breaking change from earlier versions)
- Auto-layout feature needs rework (currently non-functional)

## Debugging Tips

- Enable Developer Tools: Help > Toggle Developer Tools
- Check Console for layout debug logs (look for [Layout] and [App] prefixes)
- State logs show agent count and handoff details
- Webview reloads require reopening canvas

## Contact/Resources

- VS Code Extension API: https://code.visualstudio.com/api
- React Flow docs: https://reactflow.dev/
- Publishing guide: ./PUBLISHING.md
- Repository: (update with your GitHub URL)

---

**How to Resume:**
1. Read this context file
2. Review CHANGELOG.md for version history
3. Check package.json for current dependencies
4. Run `npm install` if dependencies changed
5. Run `npm run vscode:prepublish` to build
6. Press F5 to test extension
7. Continue from "Next Steps" section above
