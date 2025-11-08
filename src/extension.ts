import * as vscode from 'vscode';
import { AgentDesignerPanel } from './AgentDesignerPanel';
import { AgentDesignEditorProvider } from './AgentDesignEditorProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Agent Designer extension activated');

	// Register custom editor for .agentdesign.md files
	context.subscriptions.push(
		AgentDesignEditorProvider.register(context)
	);

	// Register command to open the agent designer canvas
	context.subscriptions.push(
		vscode.commands.registerCommand('agentDesigner.open', () => {
			AgentDesignerPanel.createOrShow(context.extensionUri);
		})
	);

	// Register command to open .agentdesign.md files
	context.subscriptions.push(
		vscode.commands.registerCommand('agentDesigner.openFile', (uri: vscode.Uri) => {
			AgentDesignerPanel.createOrShow(context.extensionUri);
		})
	);

	// Register other commands (will be implemented later)
	context.subscriptions.push(
		vscode.commands.registerCommand('agentDesigner.newFromTemplate', () => {
			AgentDesignerPanel.createOrShow(context.extensionUri);
			vscode.window.showInformationMessage('Template selection coming soon!');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('agentDesigner.export', () => {
			vscode.window.showInformationMessage('Export functionality coming soon!');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('agentDesigner.import', () => {
			vscode.window.showInformationMessage('Import functionality coming soon!');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('agentDesigner.simulate', () => {
			vscode.window.showInformationMessage('Simulation functionality coming soon!');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('agentDesigner.toggleEntryPoint', () => {
			vscode.window.showInformationMessage('Toggle entry point coming soon!');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('agentDesigner.customizeTheme', () => {
			vscode.window.showInformationMessage('Theme customization coming soon!');
		})
	);

	// Register command to open as text editor
	context.subscriptions.push(
		vscode.commands.registerCommand('agentDesigner.openAsText', async (uri?: vscode.Uri) => {
			let fileUri = uri;
			
			// If no URI provided, try to get from active editor
			if (!fileUri && vscode.window.activeTextEditor) {
				fileUri = vscode.window.activeTextEditor.document.uri;
			}
			
			if (!fileUri) {
				vscode.window.showErrorMessage('No file to open');
				return;
			}
			
			// Close the custom editor if open
			if (AgentDesignerPanel.currentPanel) {
				AgentDesignerPanel.currentPanel.dispose();
			}
			
			// Open in default text editor
			await vscode.commands.executeCommand('vscode.openWith', fileUri, 'default');
		})
	);
}

export function deactivate() {}
