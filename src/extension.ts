import * as vscode from 'vscode';
import actions from '@johnbillion/wp-hooks/hooks/actions.json';
import filters from '@johnbillion/wp-hooks/hooks/filters.json';
import { Hook, Tag } from '@johnbillion/wp-hooks/interface';
import * as meta from '../package.json';

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

				// https://www.php.net/manual/en/functions.arguments.php#functions.arguments.type-declaration
				const allowedTypes: { [key: string]: number } = {
					'self' :     5.0,
					'array' :    5.1,
					'callable' : 5.4,
					'bool' :     7.0,
					'float' :    7.0,
					'int' :      7.0,
					'string' :   7.0,
					'iterable' : 7.1,
					'object' :   7.2,
				};

				const typeDeclarationsEnabled: boolean = vscode.workspace.getConfiguration( meta.name ).get('typeDeclarations.enable') ?? true;
				let typeDeclarationsSupportSetting: string = vscode.workspace.getConfiguration( meta.name ).get('typeDeclarations.olderPhpVersionSupport') ?? '';
				let typeDeclarationsSupport: number;

				if ( ! typeDeclarationsSupportSetting || 'None' === typeDeclarationsSupportSetting ) {
					typeDeclarationsSupport = 999;
				} else {
					typeDeclarationsSupport = parseFloat( typeDeclarationsSupportSetting );
				}

				const params            = hook.doc.tags.filter( tag => 'param' === tag.name );
				const snippetArgsString = params.map( function( param ) {
					let val = `\\${param.variable}`;

					// Type declarations disabled? Bail.
					if ( ! typeDeclarationsEnabled ) {
						return val;
					}

					// No type info? Bail.
					if ( ! param.types ) {
						return val;
					}

					// More than one type? Bail.
					if ( param.types.length !== 1 ) {
						return val;
					}

					let type = param.types[0];

					// Un-hintable type? Bail.
					if ( [ 'null', 'mixed' ].includes( type ) ) {
						return val;
					}

					// Hinting for typed-arrays.
					if ( type.indexOf( '[]' ) !== -1 ) {
						type = 'array';
					}

					// Aliases for bool.
					if ( [ 'false', 'true', 'boolean' ].includes( type ) ) {
						type = 'bool';
					}

					// Alias for callable.
					if ( type === 'callback' ) {
						type = 'callable';
					}

					// Alias for int.
					if ( type === 'integer' ) {
						type = 'int';
					}

					// Check the allowed types, ignoring unknown types such as class and interface names.
					if ( allowedTypes[ type ] && ( allowedTypes[ type ] > typeDeclarationsSupport ) ) {
						return val;
					}

					return type + ' ' + val;
				} ).join( ', ' );
				const docArgsString = snippetArgsString.replace( /\\\$/g, '$' );

				let snippetClosure = null;
				let documentationClosure = null;

				if ( 'filter' === hook.type ) {
					snippetClosure = 'function( ' + snippetArgsString + ' ) {\n\t${1}\n\treturn \\' + params[0].variable + ';\n}' + ( params.length > 1 ? ', 10, ' + params.length + ' ' : ' ' );
					documentationClosure = 'function( ' + docArgsString + ' ) {\n\treturn ' + params[0].variable + ';\n}' + ( params.length > 1 ? ', 10, ' + params.length + ' ' : ' ' );
				} else {
					snippetClosure = 'function(' + ( snippetArgsString ? ' ' + snippetArgsString + ' ' : '' ) + ') {\n\t${1}\n}' + ( params.length > 1 ? ', 10, ' + params.length + ' ' : ' ' );
					documentationClosure = 'function(' + ( docArgsString ? ' ' + docArgsString + ' ' : '' ) + ') {\n}' + ( params.length > 1 ? ', 10, ' + params.length + ' ' : ' ' );
				}

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
