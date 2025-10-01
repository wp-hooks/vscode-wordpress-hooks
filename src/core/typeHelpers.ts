import { Tag, TagType } from '../types';

export function getTagType(
	tag: Tag,
): TagType | null {
	// https://www.php.net/manual/en/functions.arguments.php#functions.arguments.type-declaration
	const allowedTypes: { [key: string]: number } = {
		self: 5.0,
		array: 5.1,
		callable: 5.4,
		bool: 7.0,
		float: 7.0,
		int: 7.0,
		string: 7.0,
		iterable: 7.1,
		object: 7.2,
	};

	const typeData: TagType = {
		type: '',
		nullable: false,
	};

	// No type info? Bail.
	if (!tag.types) {
		return null;
	}

	const types = [...tag.types];

	// Handle nullable type.
	if (types.length === 2) {
		if (types[0] === 'null') {
			types.splice(0, 1);
			typeData.nullable = true;
		} else if (types[1] === 'null') {
			types.splice(1, 1);
			typeData.nullable = true;
		}
	}

	// More than one type? Bail.
	if (types.length !== 1) {
		return null;
	}

	let type = types[0];

	// Un-hintable type? Bail.
	if (['mixed'].includes(type)) {
		return null;
	}

	// Hinting for typed-arrays.
	if (type.indexOf('[]') !== -1) {
		type = 'array';
	}

	// Aliases for bool.
	if (['false', 'true', 'boolean'].includes(type)) {
		type = 'bool';
	}

	// Alias for callable.
	if (type === 'callback') {
		type = 'callable';
	}

	// Alias for int.
	if (type === 'integer') {
		type = 'int';
	}

	// Convert stdClass to object to avoid fatals when the stdClass gets promoted to a real class.
	if (type === '\\stdClass') {
		type = 'object';
	}

	// Check the allowed types, ignoring unknown types such as class and interface names.
	if (allowedTypes[type]) {
		return null;
	}

	typeData.type = type;

	return typeData;
}

export function getReturnType(
	tag: Tag,
) : TagType | null {
	return getTagType(tag);
}
