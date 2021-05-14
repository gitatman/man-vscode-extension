// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as settingManager from './setting-manager';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	let commandId = 'man-vscode.get-settings';
	context.subscriptions.push(vscode.commands.registerCommand(commandId, () => {
		settingManager.getSettings();
	}));
}
