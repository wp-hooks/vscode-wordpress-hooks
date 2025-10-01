import * as vscode from 'vscode';
import { createHookCompletionProvider } from './providers/hookCompletionProvider';
import { createCallbackCompletionProvider } from './providers/callbackCompletionProvider';
import { createHoverProvider } from './providers/hoverProvider';

export function activate(
	context: vscode.ExtensionContext,
): void {
	const hooksProvider = createHookCompletionProvider();
	const callbackProvider = createCallbackCompletionProvider();
	const hoverProvider = createHoverProvider();

	context.subscriptions.push(hooksProvider, callbackProvider, hoverProvider);
}
