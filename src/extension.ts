import * as vscode from 'vscode';
import * as settingManager from './setting-manager';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('man-vscode.get-settings', () => {
		settingManager.getSettings();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('man-vscode.update-settings', () => {
		settingManager.updateSettings();
	}));
}
