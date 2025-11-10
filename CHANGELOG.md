# Change Log

All notable changes to the "copilot-agentdesigner" extension will be documented in this file.

## [0.5.1] - 2025-11-10

### Fixed
- **Black Canvas Issue**: Fixed critical timing race condition that caused blank canvas on slower machines
  - Implemented bidirectional handshake protocol: webview signals ready, extension waits before sending state
  - Removed unreliable 100ms setTimeout that was insufficient for slower systems
  - Extension now waits for explicit `webviewReady` signal from webview before sending initial state
- **Extension Crash on No Workspace**: Fixed crash when opening extension with no workspace folder
  - Constructor no longer calls dispose() prematurely when workspace folder is missing
  - Initializes with empty state instead, allowing normal operation
  - Message handlers are now properly set up before any disposal logic
- **Silent React Errors**: Added Error Boundary component to catch rendering failures
  - Displays user-friendly error screen with error details when React crashes
  - Provides "Reload Canvas" button for quick recovery
  - Sends error information to extension for diagnostics
  - Prevents complete UI freeze on rendering errors
- **Enhanced Diagnostic Logging**: Added timestamps to all console logs for timing analysis
  - All logs now include `Date.now()` timestamps for debugging timing issues
  - Enhanced logging in state loading, agent detection, and webview communication
  - Null checks added to prevent silent failures in state transmission
- **Loading Indicator**: Added visual feedback during initialization
  - Shows "Loading Agent Designer..." overlay until initial state is received
  - Prevents user confusion during webview initialization
  - Automatically dismisses when canvas is ready

## [0.5.0] - 2025-11-10

### Added
- **Auto-Discovery of Existing Agents**: Extension now automatically detects and loads existing agent files
  - Scans `.github/agents/` and `.github/chatmodes/` directories on startup
  - Import banner appears when agents are found but canvas is empty
  - "Load Now" button to import all discovered agents instantly
  - "Dismiss" button to skip auto-import
  - 5-second Undo notification after auto-import
  - Grid layout with 250px spacing for auto-imported agents
- **Support for .chatmode.md Files**: In addition to `.agent.md`, extension now recognizes `.chatmode.md` files
  - Both file types parsed and loaded automatically
  - Proper naming convention applied to both formats
- **Multiple Handoffs per Agent**: YAML parser now supports array-based handoffs
  - Agents can now have multiple handoff targets
  - Array format: `handoffs: [{ agent: "qa", label: "Test" }, { agent: "pm", label: "Review" }]`
  - Legacy single-object format still supported for backward compatibility

### Fixed
- **Handoff Resolution**: Fixed filename-based handoff mapping for proper connection display
  - Maps both display names ("QA Analyst") and filename prefixes ("qa-analyst") to agent IDs
  - Enhanced logging shows resolution attempts with ✓/✗ indicators
  - Exact match first, then lowercase fallback for flexible matching
- **Agent Name Formatting**: Fixed name extraction from filenames
  - Properly strips `.agent` and `.chatmode` suffixes before formatting
  - Capitalizes each word correctly (e.g., "qa-analyst.agent.md" → "QA Analyst")
  - Handles hyphen and underscore separators
- **Entry Point Detection**: Improved auto-detection logic
  - Only marks agents as entry points when handoffs exist in workflow
  - Otherwise leaves all as false for manual user selection
  - Prevents over-marking agents as entry points

### Changed
- **Enhanced Debug Logging**: Comprehensive console logging for troubleshooting
  - Shows all available name mappings before handoff resolution
  - Logs each handoff resolution attempt with success/failure
  - Displays handoff counts and connection details for each agent
  - File parsing logs show handoff count per agent
- **Improved Error Handling**: Constructor no longer throws, better error recovery
- **State Management**: Updated parseDirectory() to return `{agents, fileNames}` structure

### Technical
- Modified `src/generators/agentFileParser.ts`: Rewrote YAML parser to handle handoff arrays, added filename mapping
- Modified `src/AgentDesignerPanel.ts`: Added auto-discovery logic, import banner messaging, Undo notifications
- Modified `webview-ui/src/App.tsx`: Added import banner UI, checkForAgents message handling
- All handoff resolution now uses dual-key mapping (display name + filename prefix)

## [0.4.1] - 2025-11-08

### Changed
- **File Extension**: Agent files now use `.agent.md` instead of `.chat.md` or `.chatmode.md`
  - Export generates `*.agent.md` files
  - Import/load operations now look for `.agent.md` files
  - Drag-and-drop accepts only `.agent.md` files
  - Clearer naming convention for agent definitions
- **Improved Connection Visibility**: Handoff lines now much easier to follow
  - Switched to 'smoothstep' edge routing for cleaner paths around boxes
  - Increased line thickness from 2.5px to 3px for better visibility
  - Lines appear above canvas background but below nodes (proper z-index layering)
  - Hover highlights edges with glow effect and increases thickness to 4px
  - Selected edges pulse with animation for clear identification
  - Brighter default color (#9e9e9e) and blue highlight (#1e88e5)
- **Auto Zoom**: Design files now zoom in once on load for better detail view
- **Removed MiniMap**: Cleaned up bottom-right corner
- **Removed Simulate Button**: Simplified toolbar

## [0.4.0] - 2025-11-08

### Added
- **Load from Directory**: New "Load from Directory" button to scan and import all agent files
  - Scans .github/agents, .github/chatmodes, or custom directory
  - Automatically parses all .chat.md and .chatmode.md files
  - Infers connections from handoff definitions in agent files
  - Auto-detects entry points (agents with no incoming connections)
  - Shows total agents and connections loaded
  - Replaces current canvas with imported workflow
- **Open .agentdesign.md Files**: Clicking on .agentdesign.md files now opens the canvas with saved state
  - Registered custom editor provider for .agentdesign.md files
  - Files automatically open in Agent Designer canvas instead of text editor (no double tabs)
  - Right-click on editor tab → "Open as Text" to view raw markdown
  - Command palette: "Agent Designer: Open as Text" for current file
  - Canvas loads all agents and connections from the specific design file clicked
  - Each .agentdesign.md file maintains its own independent canvas state
  - Switching between different design files properly loads their respective states
- **Add from File Button**: New toolbar button to add agents from existing .chat.md/.chatmode.md files
  - "Add from File" button in toolbar opens file picker
  - Select single agent file to add to canvas
  - Agent appears with all properties pre-filled (name, description, tools, model)
  - Positioned automatically in grid layout based on existing agent count
  - Success message shows agent name after adding
  - Only accepts .chat.md and .chatmode.md files
- **Drag-and-Drop Support**: Drag .chat.md/.chatmode.md files from Explorer directly onto canvas
  - Drop agent files anywhere on canvas to add them
  - Agent appears at exact drop position
  - Visual outline feedback during drag-over
  - Supports both file name and full path resolution
  - Automatic file location detection (.github/agents, .github/chatmodes)
  - Success message shows agent name and position

### Changed
- Added `AgentDesignEditorProvider` class for custom editor support
- Canvas now handles `dropFile` and `agentDropped` message types
- Enhanced App component with `onDrop`, `onDragOver`, `onDragEnter`, `onDragLeave` handlers
- Drop position converted from screen to flow coordinates for precise placement
- File drop handler searches multiple locations for agent files

### Fixed
- **Design File Save & Load**: Design file (.agentdesign.md) now properly saves and loads state
  - Auto-save triggers 500ms after any canvas modification (agents, connections, positions)
  - Export now saves design file before exporting agent files
  - Simplified save format to pure JSON in YAML frontmatter (easier parsing)
  - Fixed JSON parsing to properly handle saved format
  - Added comprehensive logging to track save and load operations
  - Each file maintains its own state independently
  - Logs show: file path, agent count, success/failure for both save and load

### Changed
- **Redesigned Toolbar UI**: Cleaner, more professional button styling
  - Flat design with subtle borders matching VS Code theme
  - Primary actions (Add Agent, Add from File) use accent color
  - Secondary actions use transparent background with hover effects
  - Improved spacing and alignment
  - No more gradient backgrounds or shine animations

### Technical
- Created `src/AgentDesignEditorProvider.ts`: Custom editor provider (28 lines)
- Modified `src/extension.ts`: Register custom editor and commands
- Modified `package.json`: Added customEditors and explorer context menu
- Modified `webview-ui/src/App.tsx`: Added drag-and-drop handlers with visual feedback and logging
- Modified `webview-ui/src/App.css`: Redesigned toolbar with flat, modern styling
- Modified `src/AgentDesignerPanel.ts`: Enhanced _handleDropFile with file resolution logic, added comprehensive logging for state operations

## [0.3.3] - 2025-11-07

### Fixed
- **Import Handoffs Resolution**: Import now properly preserves all agent connections (handoffs)
  - Two-pass import: first creates all agents with IDs, then resolves handoffs by name
  - Creates name-to-ID mapping to resolve handoff targets correctly
  - Includes existing agents in name map for cross-references between old and new agents
  - Auto-detects entry points (agents with no incoming handoffs)
  - Warns in console when handoff target agent is not found
  - All handoff properties preserved: label, prompt, send boolean
- **Import Agent Visibility**: All imported agents now display correctly on canvas
  - Proper grid positioning based on existing agent count
  - Unique ID generation using timestamp and index
  - Instructions field initialized (empty for imports)

### Changed
- AgentFileParser.parse() now returns ParsedAgent (with agent names in handoffs) instead of Agent (with IDs)
- Import handler performs handoff resolution after all agents are parsed
- Better logging: warns when handoff targets are missing

## [0.3.2] - 2025-11-07

### Fixed
- **State Loading Parser**: Fixed YAML parsing to properly load saved canvas state
  - Improved JSON parsing with fallback to line-by-line YAML parser
  - Added comprehensive logging for debugging state loading issues
  - Better error handling with user-facing warning messages
  - Fixed handling of different JSON/YAML formats
  - Console logging shows state file path and agent count on load
- **Import Parsing**: Fixed AgentFileParser.parse() method implementation
  - Added missing static parse() method to convert file content to Agent objects
  - Properly generates unique IDs for imported agents
  - Handles frontmatter parsing correctly
  - Grid positioning for imported agents (300px apart horizontally, 250px vertically)
  - Better error messages: "Make sure files have YAML frontmatter"

### Changed
- Enhanced error handling with try-catch blocks around file parsing
- Import now positions agents in grid based on existing agent count
- Console logging for import process debugging

## [0.3.1] - 2025-11-07

### Fixed
- **State Loading on Open**: Canvas now properly loads saved state from `.github/agentflow/.agentdesign.md` when opened
  - Added 100ms delay to ensure webview is ready before sending state
  - Fixed initialization sequence: HTML → Load State → Send to Webview
- **Import Functionality**: Import button now works with file picker dialog
  - Opens file picker to select .chat.md or .chatmode.md files
  - Supports multi-select for batch imports
  - Parses agent files and merges with existing canvas
  - Shows success message with count of imported agents
  - Defaults to `.github/agents/` directory
  - Error handling for invalid files

### Changed
- **Sleeker Button Design**: Enhanced toolbar buttons with modern, polished styling
  - Gradient backgrounds with depth (linear-gradient from 90% to 70% opacity)
  - Smooth transitions on all interactions (0.2s ease)
  - Hover effects: subtle lift (-1px translateY) with blue glow shadow
  - Animated shine effect on hover (sliding gradient overlay)
  - Active state with tactile press feedback
  - Increased padding (8px 16px) for better touch targets
  - Font weight 500 for improved readability
  - Backdrop blur effect on toolbar container (blur(10px))
  - Semi-transparent background with border for modern glass effect

### Technical
- Modified `src/AgentDesignerPanel.ts`: Fixed state loading sequence, implemented file picker import with AgentFileParser
- Modified `webview-ui/src/App.tsx`: Fixed import message type
- Modified `webview-ui/src/App.css`: Complete toolbar button redesign with gradients, animations, and modern effects

## [0.3.0] - 2025-11-07

### Added
- **Click-to-Edit Agent Boxes**: Clicking anywhere on an agent box now opens the edit modal for better UX
  - Previously required clicking the small ✏️ edit button
  - Action buttons use stopPropagation to prevent double-triggering
  - Added cursor pointer styling for visual feedback
  - Larger click target improves discoverability
- **Working Simulate Button**: Implemented functional workflow simulation preview
  - Shows agent count, handoff count, and entry point names
  - Visualizes flow sequence with arrows (e.g., "Agent A → Agent B → Agent C")
  - Validates entry points before simulation and shows clear error messages
  - Dialog shows: `Workflow Simulation Preview: Agents: 5, Handoffs: 4, Entry Points: Agent1, Agent2, Flow: Agent1 → Agent2 → Agent3`
- **Enhanced Validation with Suggestions**: Comprehensive attribute validation with helpful guidance
  - Checks for missing/empty fields: name, description, instructions, tools, model
  - Detects isolated agents (no handoffs in/out, not entry point)
  - Provides actionable quick fixes for each issue type
  - Shows warnings (non-blocking) and errors (blocking) appropriately
  - Character limit validation (name: 100, description: 1000, instructions: 8000)
  - Example warning: "Agent 'X' is incomplete: missing instructions, no tools configured → Click the agent box to edit"
  - Example error: "Agent 'X' name exceeds 100 character limit (150 chars) → Click the agent to edit and shorten"

### Changed
- Improved type safety in App.tsx with proper Node<> and Edge<> generic types
- Enhanced AgentNode component with clickable container div
- Validation now proactive with suggestions instead of just error checking

### Technical
- Modified `webview-ui/src/AgentNode.tsx`: Added onClick handler and stopPropagation on buttons
- Modified `webview-ui/src/App.tsx`: Implemented handleSimulate() with validation logic, fixed type declarations
- Modified `webview-ui/src/ValidationPanel.tsx`: Added comprehensive attribute checking with quick fix suggestions

## [0.2.0] - 2025-11-07

### Added
- **Handoff Connection Redesign**: Completely redesigned handoff modal to match VS Code frontmatter spec
  - Added `label` field for handoff display names (button text shown on handoff button)
  - Added `prompt` field for contextual instructions (message sent when handoff button is clicked)
  - Added `send` boolean toggle for auto-submit behavior (optional, defaults to false)
  - Shows target agent name in modal header with arrow indicator (e.g., "Handoff to → Implementation Agent")
  - Modern, sleek styling matching VS Code design system
  - Field descriptions explaining each property's purpose
  - Matches official spec: `handoffs: [{ label: "Start", agent: "impl", prompt: "Implement the plan", send: false }]`
- **Working Export Functionality**: Implemented complete file export pipeline
  - Generates .chat.md or .chatmode.md files with proper YAML frontmatter
  - Writes files to .github/agents/ or .github/chatmodes/ directories
  - Detects and prevents overwriting existing files with confirmation dialog
  - Shows success/error messages with file paths and count
  - Includes all agent properties: name, description, instructions, tools, model, handoffs
  - Proper YAML formatting with agent references by name
- **Enhanced Edge Styling**: Improved visual design of handoff connections
  - Smooth transitions for hover and selection states (0.2s ease)
  - Thicker stroke on hover (2.5px → 3px) with blue color
  - Glow shadow effect on selected edges
  - Better edge label visibility with dark background and padding
  - Selected edge labels show blue text with medium font weight

### Changed
- HandoffModal completely redesigned with new fields matching official spec (95 lines)
- Export button now performs actual file generation (was previously stub/validation only)
- Edge labels show handoff label instead of generic "Handoff"
- Edge interactions more responsive with visual feedback

### Technical
- Modified `webview-ui/src/HandoffModal.tsx`: Redesigned component with spec-compliant fields
- Created `webview-ui/src/HandoffModal.css`: New styling for handoff modal (55 lines)
- Modified `src/AgentDesignerPanel.ts`: Implemented _performExport() method with file I/O and conflict detection
- Modified `webview-ui/src/App.tsx`: Pass target agent name to modal, fix export data mapping
- Modified `webview-ui/src/App.css`: Enhanced edge styling with transitions, hover, and selection effects
- Modified `src/generators/agentFileGenerator.ts`: Updated to handle all handoff properties (label, prompt, send)

## [0.1.0] - 2025-11-07

### Added
- **Agent Property Editor**: Full-featured AgentEditModal for editing all agent properties
  - Edit name (max 100 characters) with real-time character counter
  - Edit description (max 1000 characters) with validation
  - Edit instructions (max 8000 characters) - NEW field matching VS Code spec
  - Edit tools (comma-separated list input)
  - Select model from dropdown (gpt-4o, gpt-4-turbo, gpt-4, claude-3.5-sonnet, claude-sonnet-4, gemini-2.0-flash)
  - Real-time character count display for all text fields
  - Field validation on save with clear error messages
  - VS Code theme integration with proper modal overlay
  - Click-outside-to-close functionality
  - Updates canvas immediately on save
- **Workflow Templates (Designed but Not Yet Accessible)**: 5 comprehensive templates created based on research from github/awesome-copilot (50+ examples analyzed)
  - Template definitions exist in `src/templates/workflowTemplates.ts` but command shows "Template selection coming soon!"
  - **Plan → Implement → Review**: Task Planner (550 chars) → Software Engineer (700 chars) → Code Reviewer (650 chars)
  - **Playwright Testing**: Playwright Tester → Test Generator
  - **Research → Document → Implement**: Task Researcher → Documentation Writer → Implementation Agent
  - **Mentor → Architect → Blueprint**: Socratic teaching → System design → Pragmatic implementation
  - **Azure Full-Stack**: Azure Solutions Architect → Backend Developer → Frontend Developer
  - All templates include realistic instructions (500-750 chars), proper tools, and appropriate models
  - **Note**: UI for template selection needs to be implemented to make these accessible to users

### Changed
- Agent model now includes `instructions` field in addition to description (breaking change)
- File generator updated to include instructions in agent.md body section
- Modal replaces inline editing for better UX

### Technical
- Created `webview-ui/src/AgentEditModal.tsx`: Full property editor component (220 lines)
- Created `webview-ui/src/AgentEditModal.css`: Styling for edit modal (60 lines) with VS Code theme variables
- Modified `src/templates/workflowTemplates.ts`: Completely overhauled all 5 templates with research-backed content
- Modified `src/models/agent.ts`: Added `instructions?: string` field to Agent interface
- Modified `src/generators/agentFileGenerator.ts`: Added instructions to file body section after description
- Modified `webview-ui/src/App.tsx`: Integrated AgentEditModal with state management and canvas updates

## [0.0.1] - Initial Release

### Added
- Visual canvas for designing agent workflows using React Flow
- Drag-and-drop agent node creation and positioning
- Handoff connection creation between agents
- Entry point marking for workflow entry agents
- Auto-layout using ELK.js for clean workflow visualization
- State persistence in .github/agentflow/.agentdesign.md
- Export to .chat.md/.chatmode.md format
- Import existing agent workflow designs
- Validation panel for checking workflow correctness
- Settings panel for preferences and theme
- MiniMap for workflow overview
- VS Code command: "Agent Designer: Open Canvas"

### Technical Details
- VS Code Extension API 1.105.0+
- React 19.2.0 + React Flow @xyflow/react 12.9.2
- TypeScript backend and frontend
- esbuild for webview bundling
- YAML frontmatter format matching VS Code spec
- Support for .chat.md and .chatmode.md files