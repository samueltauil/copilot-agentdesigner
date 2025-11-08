import * as vscode from 'vscode';
import { AgentDesignerPanel } from './AgentDesignerPanel';

export class AgentDesignEditorProvider implements vscode.CustomTextEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new AgentDesignEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            'agentDesigner.canvas',
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true,
                }
            }
        );
        return providerRegistration;
    }

    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Open the agent designer with this specific file
        AgentDesignerPanel.createOrShow(this.context.extensionUri, document.uri.fsPath);
    }
}
