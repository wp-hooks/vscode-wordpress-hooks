import * as vscode from 'vscode';
import { createHookCompletionProvider } from './providers/hookCompletionProvider.js';
import { createCallbackCompletionProvider } from './providers/callbackCompletionProvider.js';
import { createHoverProvider } from './providers/hoverProvider.js';

export function activate(
	context: vscode.ExtensionContext,
): void {
	const hooksProvider = createHookCompletionProvider();
	const callbackProvider = createCallbackCompletionProvider();
	const hoverProvider = createHoverProvider();

	context.subscriptions.push(hooksProvider, callbackProvider, hoverProvider);
}
