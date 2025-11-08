# Publishing to VS Code Marketplace

## Prerequisites

1. **Create a Publisher Account**
   - Go to https://marketplace.visualstudio.com/manage
   - Sign in with Microsoft/GitHub account
   - Create a new publisher (e.g., `your-publisher-name`)

2. **Get Personal Access Token**
   - Go to https://dev.azure.com
   - Create a Personal Access Token with `Marketplace (Manage)` scope
   - Save the token securely

## Before Publishing

### 1. Update package.json

Update these fields:
- `"publisher": "TODO-publisher-name"` → Your actual publisher ID from marketplace
- `"author": { "name": "TODO-author-name" }` → Your name or organization
- Add repository URLs if desired (optional):
  ```json
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/copilot-agentdesigner"
  },
  "bugs": {
    "url": "https://github.com/yourusername/copilot-agentdesigner/issues"
  },
  "homepage": "https://github.com/yourusername/copilot-agentdesigner#readme"
  ```

### 2. Add Extension Icon (Optional)

Create a 128x128 PNG icon and add to root:
```bash
# Place icon at root
icon.png
```

Then add to package.json:
```json
"icon": "icon.png"
```

The icon field has been removed from package.json - add it back if you create an icon.

### 3. Review Files

Check `.vscodeignore` includes:
```
.vscode/**
.vscode-test/**
src/**
webview-ui/**
node_modules/**
.gitignore
.git/**
tsconfig.json
vsc-extension-quickstart.md
eslint.config.mjs
build-webview.js
*.md.backup
README.md.backup
```

## Install vsce

```bash
npm install -g @vscode/vsce
```

## Package Extension

```bash
# Build the extension
npm run vscode:prepublish

# Package as .vsix
vsce package

# This creates: copilot-agentdesigner-0.4.1.vsix
```

## Test Locally

```bash
# Install in VS Code
code --install-extension copilot-agentdesigner-0.4.1.vsix
```

## Publish

```bash
# Login with your token
vsce login your-publisher-name

# Publish to marketplace
vsce publish

# Or publish with version bump
vsce publish patch  # 0.4.1 → 0.4.2
vsce publish minor  # 0.4.1 → 0.5.0
vsce publish major  # 0.4.1 → 1.0.0
```

## Post-Publishing

1. **Verify on Marketplace**
   - Visit: https://marketplace.visualstudio.com/items?itemName=your-publisher-name.copilot-agentdesigner

2. **Update README**
   - Add marketplace badge once published:
     ```markdown
     [![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/your-publisher-name.copilot-agentdesigner)](https://marketplace.visualstudio.com/items?itemName=your-publisher-name.copilot-agentdesigner)
     ```
   - Add screenshots/GIFs of the extension in action

3. **Create GitHub Release**
   ```bash
   git tag v0.4.1
   git push origin v0.4.1
   ```

## Updating

```bash
# Make changes
# Update version in package.json
# Update CHANGELOG.md

# Build and publish
npm run vscode:prepublish
vsce publish
```

## Troubleshooting

**"Publisher not found"**
- Ensure you created a publisher on marketplace.visualstudio.com
- Update `"publisher"` in package.json

**"Icon not found"**
- Add icon.png (128x128) and add `"icon": "icon.png"` to package.json
- Or proceed without an icon (icon field already removed from package.json)

**"Missing README"**
- README.md must exist at root

**Package size too large**
- Check .vscodeignore excludes node_modules and source files
- Maximum size is 50MB

## Resources

- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [Marketplace](https://marketplace.visualstudio.com/)
