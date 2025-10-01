import * as vscode from 'vscode';
import { hooks as actions } from '@wp-hooks/wordpress-core/hooks/actions.json';
import { hooks as filters } from '@wp-hooks/wordpress-core/hooks/filters.json';
import { Hook, Tag } from '../types';

export function getHook(
	name: string,
): Hook | void {
	let hooks = filters.filter((filter) => {
		if (filter.name === name) {
			return true;
		}

		if (filter.aliases?.includes(name)) {
			return true;
		}

		return false;
	});

	if (hooks.length === 0) {
		hooks = actions.filter((action) => {
			if (action.name === name) {
				return true;
			}

			if (action.aliases?.includes(name)) {
				return true;
			}

			return false;
		});
	}

	if (hooks.length) {
		return hooks[0];
	}
}

export function getHookSlug(
	hook: Hook,
): string {
	return hook.name.toLowerCase().replace(/[^a-z_-]/g, '');
}

export function getHookDescription(
	hook: Hook,
): vscode.MarkdownString {
	let description = hook.doc.long_description;
	const slug = getHookSlug(hook);

	description += `\n\n[View on developer.wordpress.org →](https://developer.wordpress.org/reference/hooks/${slug}/)\n\n`;

	const params = hook.doc.tags.filter((tag) => tag.name === 'param');

	params.forEach((tag: Tag) => {
		if (!tag.types) {
			return;
		}

		const types = tag.types.join('|');
		description += `\n\n_@param_ \`${types} ${tag.variable}\`  \n${tag.content}`;
	});

	const everythingElse = hook.doc.tags.filter((tag) => tag.name !== 'param');

	everythingElse.forEach((tag: Tag) => {
		description += `\n\n_@${tag.name}_ ${tag.content || tag.refers || ''} ${tag.description || ''}`;
	});

	return new vscode.MarkdownString(description);
}

export function getHookCompletion(
	hook: Hook,
): vscode.CompletionItem {
	const completion = new vscode.CompletionItem(hook.name, vscode.CompletionItemKind.Value);
	completion.detail = hook.doc.description;
	completion.documentation = getHookDescription(hook);

	if (hook.aliases) {
		completion.filterText = hook.aliases.join(' ');
	}

	return completion;
}
