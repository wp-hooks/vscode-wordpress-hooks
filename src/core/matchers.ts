export function isInFilter(
	line: string,
): RegExpMatchArray | null {
	return line.match(/(add|remove|has|doing)_filter\([\s]*('|")[^"|']*$/);
}

export function isInAction(
	line: string,
): RegExpMatchArray | null {
	return line.match(/(add|remove|has|doing|did)_action\([\s]*('|")[^"|']*$/);
}

export function isInFunctionDeclaration(
	line: string,
): RegExpMatchArray | null {
	//                 add_   filter|action  (    '"    {hook}     '" ,
	return line.match(/add_(?:filter|action)\(\s*['"](?<hook>\S+?)['"],\s*\w*?$/);
}
