import * as vscode from 'vscode';
import { Hook } from '../types';
import {
	getHook as coreGetHook,
	getHookSlug as coreGetHookSlug,
	getHookDescriptionData,
	getHookCompletionData,
} from '../core/hookHelpers.js';

// Re-export core functions for backward compatibility
export { coreGetHook as getHook, coreGetHookSlug as getHookSlug };

export function getHookDescription(
	hook: Hook,
): vscode.MarkdownString {
	const data = getHookDescriptionData(hook);
	return new vscode.MarkdownString(data.description);
}

export function getHookCompletion(
	hook: Hook,
): vscode.CompletionItem {
	const data = getHookCompletionData(hook);
	const completion = new vscode.CompletionItem(data.name, vscode.CompletionItemKind.Value);
	completion.detail = data.detail;
	completion.documentation = new vscode.MarkdownString(data.descriptionData.description);

	if (data.filterText) {
		completion.filterText = data.filterText;
	}

	return completion;
}
