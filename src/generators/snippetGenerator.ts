import { Tag } from '../types/index.js';
import { getTagType, getReturnType } from '../utils/typeHelpers.js';

export interface CallbackSnippet {
	snippetCallback: string;
	documentationCallback: string;
	returnTypeString: string;
	suffix: string;
}

export function generateCallbackSnippet(
	hookType: string,
	params: Tag[],
): CallbackSnippet {
	const snippetArgsString = params.map((param) => {
		const val = `\\${param.variable}`;
		const type = getTagType(param);

		if (!type) {
			return val;
		}

		if (!type.nullable) {
			return `${type.type} ${val}`;
		}

		return `?${type.type} ${val}`;
	}).join(', ');

	const docArgsString = snippetArgsString.replace(/\\\$/g, '$');
	const suffix = (params.length > 1 ? `, 10, ${params.length} ` : ' ');

	let snippetCallback = '';
	let documentationCallback = '';
	let returnTypeString = '';

	if (hookType === 'filter' || hookType === 'filter_reference') {
		const returnType = getReturnType(params[0]);

		if (returnType) {
			if (returnType.nullable) {
				returnTypeString = ` : ?${returnType.type}`;
			} else {
				returnTypeString = ` : ${returnType.type}`;
			}
		}

		snippetCallback = `( ${snippetArgsString} )${returnTypeString} {\n\t\${1}\n\treturn \\${params[0].variable};\n}`;
		documentationCallback = `( ${docArgsString} )${returnTypeString} {\n\treturn ${params[0].variable};\n}`;
	} else {
		const actionArgsString = snippetArgsString ? ` ${snippetArgsString} ` : '';
		snippetCallback = `(${actionArgsString}) : void {\n\t\${1}\n}`;
		documentationCallback = `(${docArgsString}) : void {\n}`;
	}

	return {
		snippetCallback,
		documentationCallback,
		returnTypeString,
		suffix,
	};
}

export const WORDPRESS_UTILITY_SNIPPETS = {
	__return_true: 'Return true',
	__return_false: 'Return false',
	__return_zero: 'Return zero',
	__return_empty_array: 'Return empty array',
	__return_empty_string: 'Return empty string',
};

export const SNIPPET_TYPES: { [key: string]: string[] } = {
	null: [],
	self: [],
	array: ['__return_empty_array'],
	callable: [],
	bool: ['__return_true', '__return_false'],
	float: ['__return_zero'],
	int: ['__return_zero'],
	string: ['__return_empty_string'],
	iterable: ['__return_empty_array'],
	object: [],
};
