import * as vscode from 'vscode';
import { hooks as actions } from '@wp-hooks/wordpress-core/hooks/actions.json';
import { hooks as filters } from '@wp-hooks/wordpress-core/hooks/filters.json';
import { getHookCompletion } from '../utils/hookHelpers';
import { isInAction, isInFilter } from '../utils/matchers';

export function createHookCompletionProvider(): vscode.Disposable {
	return vscode.languages.registerCompletionItemProvider(
		'php',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// get all text until the `position` and check if it reads a certain value and if so then complete
				const linePrefix = document.lineAt(position).text.substr(0, position.character);

				if (isInAction(linePrefix)) {
					return actions.map(getHookCompletion);
				}

				if (isInFilter(linePrefix)) {
					return filters.map(getHookCompletion);
				}

				return undefined;
			},
		},
		"'",
		'"',
	);
}
