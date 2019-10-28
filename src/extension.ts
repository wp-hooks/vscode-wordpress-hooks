import * as vscode from 'vscode';
import actions from '@johnbillion/wp-hooks/hooks/actions.json';
import filters from '@johnbillion/wp-hooks/hooks/filters.json';

function get_hook_completion( hook ) {
	var completion = new vscode.CompletionItem(hook.name, vscode.CompletionItemKind.Value);
	completion.detail = hook.doc.description;

	var description = hook.doc.long_description;

	description += "\n\n";

	const params = hook.doc.tags.filter( tag => 'param' === tag.name );

	params.forEach(function( tag ){
		const types = tag.types.join('|');
		description += "\n\n";
		description += '_@param_' + " `" + types + " " + tag.variable + "`  \n";
		description += tag.content;
	});

	completion.documentation = new vscode.MarkdownString( description );

	return completion;
}

export function activate(context: vscode.ExtensionContext) {
	const actionsProvider = vscode.languages.registerCompletionItemProvider(
		'php',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// get all text until the `position` and check if it reads `add_action('`
				// and if so then complete
				let linePrefix = document.lineAt(position).text.substr(0, position.character);
				if (!linePrefix.endsWith("add_action('")) {
					return undefined;
				}

				return actions.map(get_hook_completion);
			}
		},
		"'" // triggered whenever a '(' is being typed
	);

	const filtersProvider = vscode.languages.registerCompletionItemProvider(
		'php',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// get all text until the `position` and check if it reads `add_filter('`
				// and if so then complete
				let linePrefix = document.lineAt(position).text.substr(0, position.character);
				if (!linePrefix.endsWith("add_filter('")) {
					return undefined;
				}

				return filters.map(get_hook_completion);
			}
		},
		"'" // triggered whenever a '(' is being typed
	);

	context.subscriptions.push(actionsProvider,filtersProvider);
}
