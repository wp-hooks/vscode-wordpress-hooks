import * as vscode from 'vscode';
import actions from '@johnbillion/wp-hooks/hooks/actions.json';
import filters from '@johnbillion/wp-hooks/hooks/filters.json';
import { Hook, Doc, Tag } from '@johnbillion/wp-hooks/interface';

function get_hook_completion( hook: Hook ): vscode.CompletionItem {
	var completion = new vscode.CompletionItem(hook.name, vscode.CompletionItemKind.Value);
	completion.detail = hook.doc.description;

	var description = hook.doc.long_description;

	description += "\n\n";

	const params = hook.doc.tags.filter( tag => 'param' === tag.name );

	params.forEach(function( tag: Tag ){
		if ( ! tag.types ) {
			return;
		}

		const types = tag.types.join('|');
		description += "\n\n";
		description += '_@param_' + " `" + types + " " + tag.variable + "`  \n";
		description += tag.content;
	});

	const everything_else = hook.doc.tags.filter( tag => 'param' !== tag.name );

	everything_else.forEach(function( tag: Tag ){
		description += "\n\n";
		description += '_@' + tag.name + '_' + " " + ( tag.content || "" ) + " " + ( tag.description || "" );
	});

	completion.documentation = new vscode.MarkdownString( description );

	return completion;
}

function isInFilter(line: string): RegExpMatchArray | null {
	return line.match( /(add|remove|has|doing)_filter\([\s]*('|")[^"|']*$/ );
}

function isInAction(line: string): RegExpMatchArray | null {
	return line.match( /(add|remove|has|doing|did)_action\([\s]*('|")[^"|']*$/ );
}

function isInFunctionDeclaration(line: string): RegExpMatchArray | null {
	return line.match( /add_(filter|action)\([\s]*['|"]([\S]+?)['|"],[\s]*[\w]*?$/ );
}

function getHook( name: string ): Hook | void {
	var hooks = filters.filter( filter => filter.name === name );

	if ( hooks.length == 0 ) {
		hooks = actions.filter( action => action.name === name );
	}

	if ( hooks.length ) {
		return hooks[0];
	}
}

export function activate(context: vscode.ExtensionContext): void {
	const hooksProvider = vscode.languages.registerCompletionItemProvider(
		'php',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// get all text until the `position` and check if it reads a certain value and if so then complete
				let linePrefix = document.lineAt(position).text.substr(0, position.character);

				if ( isInAction( linePrefix ) ) {
					return actions.map(get_hook_completion);
				}

				if ( isInFilter( linePrefix ) ) {
					return filters.map(get_hook_completion);
				}

				return undefined;
			}
		},
		"'",
		'"'
	);

	const callbackProvider = vscode.languages.registerCompletionItemProvider(
		'php',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// get all text until the `position` and check if it reads a certain value and if so then complete
				let linePrefix  = document.lineAt(position).text.substr(0, position.character);
				let declaration = isInFunctionDeclaration( linePrefix );

				if ( ! declaration ) {
					return undefined;
				}

					const hook = getHook( declaration[2] );

					if ( ! hook ) {
						return undefined;
					}

					let completions: vscode.CompletionItem[] = [];

					const params            = hook.doc.tags.filter( tag => 'param' === tag.name );
					const snippetArgsString = params.map( param => `\\${param.variable}` ).join( ', ' );
					const docArgsString     = params.map( param => param.variable ).join( ', ' );

					const snippetClosure = 'function(' + ( snippetArgsString ? ' ' + snippetArgsString + ' ' : '' ) + ') {\n\t${1}\n}' + ( params.length > 1 ? ', 10, ' + params.length + ' ' : ' ' );
					const documentationClosure = 'function(' + ( docArgsString ? ' ' + docArgsString + ' ' : '' ) + ') {\n}' + ( params.length > 1 ? ', 10, ' + params.length + ' ' : ' ' );

					var completionClosure = new vscode.CompletionItem('Closure callback', vscode.CompletionItemKind.Value);
					completionClosure.insertText = new vscode.SnippetString(snippetClosure);
					completionClosure.documentation = documentationClosure;

					completions.push( completionClosure );

					if ( 'filter' === hook.type ) {
						const snippets = {
						  __return_true: 'Return true',
						  __return_false: 'Return false',
						  __return_zero: 'Return zero',
						  __return_null: 'Return null',
						  __return_empty_array: 'Return empty array',
						  __return_empty_string: 'Return empty string'
						};

						for ( let [ snippet, documentation ] of Object.entries( snippets ) ) {
							snippet = `'${snippet}' `;

							var completionItem = new vscode.CompletionItem( documentation, vscode.CompletionItemKind.Value );
							completionItem.insertText = new vscode.SnippetString( snippet );
							completionItem.documentation = snippet;

							completions.push( completionItem );
						}
					}

					return completions;
				}
		},
		',',
		' '
	);

	context.subscriptions.push(hooksProvider,callbackProvider);
}
