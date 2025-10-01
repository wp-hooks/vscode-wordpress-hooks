import { Tag } from '../types/index.js';

export function generateDocblockLines(
	description: string,
	params: Tag[],
	returnParam?: Tag,
): string[] {
	const docblockLines = [
		'/**',
		` * ${description}`,
		' *',
	];

	const paramTypeLengths: number[] = [0];
	const paramNameLengths: number[] = [0];

	params.forEach((param) => {
		if (param.types) {
			paramTypeLengths.push(param.types.join('|').length);
		}
		if (param.variable) {
			paramNameLengths.push(param.variable.length);
		}
	});

	const longestParamType = Math.max(...paramTypeLengths);
	const longestParamName = Math.max(...paramNameLengths);

	params.forEach((param) => {
		const types = param.types?.join('|').padEnd(longestParamType, ' ') || '';
		const variable = param.variable?.padEnd(longestParamName, ' ') || '';
		docblockLines.push(` * @param ${types} ${variable} ${param.content}`);
	});

	if (returnParam) {
		docblockLines.push(` * @return ${returnParam.types?.join('|') || ''} ${returnParam.content}`);
	}

	docblockLines.push(' */');

	return docblockLines;
}
