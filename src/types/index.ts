import * as vscode from 'vscode';

export { Hook, Tag } from '@wp-hooks/wordpress-core/interface';

export interface TagType {
	type: string;
	nullable: boolean;
}

export interface ContextualPosition {
	symbol: vscode.DocumentSymbol | null;
	inNamespace: boolean;
	inMethod: boolean;
	inFunction: boolean;
}
