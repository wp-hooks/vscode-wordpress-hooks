# WordPress Hook Autocompletion for VS Code

This extension adds autocomplete support for WordPress action and filter names.

## Usage

Start typing the name of a WordPress action or filter within `add_action()` or `add_filter()` and you'll get an autocomplete list of all matching actions or filters, plus information about the parameters and usage:

[![Screenshot](images/screenshot-1.png)](images/screenshot-1.png)

Autocomplete is also provided for the callback function, to save you keystrokes:

[![Screenshot](images/screenshot-2.png)](images/screenshot-2.png)

[![Screenshot](images/screenshot-3.png)](images/screenshot-3.png)

## License

This extension is free and open source software. It's licensed under the GPLv3.

## Thanks

* This extension uses the [wp-hooks library](https://github.com/johnbillion/wp-hooks) as the hook information provider.
* This extension uses some code inspired by the [Autocomplete WordPress Hooks extension for Atom](https://github.com/joehoyle/atom-autocomplete-wordpress-hooks).