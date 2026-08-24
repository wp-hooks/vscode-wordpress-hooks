import * as vscode from 'vscode';
import { getHook, getHookDescription } from '../utils/hookHelpers';
import { isInAction, isInFilter } from '../utils/matchers';

export function createHoverProvider(): vscode.Disposable {
	return vscode.languages.registerHoverProvider(
		'php',
		{
			provideHover(document, position) {
				const linePrefix = document.lineAt(position).text.substr(0, position.character);

				if (!isInAction(linePrefix) && !isInFilter(linePrefix)) {
					return undefined;
				}

				const hook = getHook(document.getText(document.getWordRangeAtPosition(position)));

				if (!hook) {
					return undefined;
				}

				return new vscode.Hover([
					new vscode.MarkdownString().appendCodeblock(hook.doc.description),
					getHookDescription(hook),
				]);
			},
		},
	);
}
