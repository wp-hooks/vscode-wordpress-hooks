# WordPress Hooks Intellisense for VS Code

This extension provides intellisense and autocomplete for WordPress hooks, actions, and filters.

* Autocomplete for action and filter names
  - Supports all actions and filters up to WordPress 6.1
* Autocomplete for action and filter callback functions
  - Supports functions, class methods, closures, arrow functions, and more
  - The parameter types, return type, and a docblock are included where appropriate
  - Various options can be controlled in the settings for the extension
* Hover information on action and filter names
  - Includes a useful link to the developer.wordpress.org documentation site


## Usage

Start typing the name of a WordPress action or filter within `add_action()` or `add_filter()` and you'll get an autocomplete list of all matching actions or filters, plus information about the parameters and usage:

[![Screenshot of VS Code showing an autocomplete list for the first parameter of the add_filter function](images/screenshot-1.png?v=0.3.0)](images/screenshot-1.png)

Autocomplete is also provided for the callback function. It's contextually aware and provides options for a function, a class method, a closure, an arrow function, and WordPress' built-in utility functions:

[![Screenshot of VS Code showing an autocomplete list for the callback parameter of the add_filter function](images/screenshot-2.png?v=0.3.0)](images/screenshot-2.png)

An autocompleted closure callback looks like this:

[![Screenshot of VS Code showing a completed callback closure for the add_filter function](images/screenshot-3.png?v=0.3.0)](images/screenshot-3.png)

Hover information for an action or filter name looks like this:

[![Screenshot of VS Code showing hover information for an action](images/screenshot-4.png?v=0.5.0)](images/screenshot-4.png)

## FAQ

### Which functions does the autocomplete list and hover information work with?

* `add_action()`
* `add_filter()`
* `remove_action()`
* `remove_filter()`
* `has_action()`
* `has_filter()`
* `doing_action()`
* `doing_filter()`
* `did_action()`
* `did_filter()`

### How can I trigger the autocomplete list if it doesn't show up?

Place your cursor within the first parameter of one of the supported functions, eg `add_action()` or `add_filter()`, and hit <kbd>ctrl</kbd>+<kbd>space</kbd>. This works with any autocomplete provider, not only this extension.

### Can I disable or adjust the type declarations / type hints / docblock?

Yes, open the preferences for VS Code and go to the **Extensions -> WordPress Hooks Intellisense** section.

### Where does the list of hook names come from?

They're generated directly from the WordPress core software and updated in time for each new release. They're bundled with this extension so there's no requirement for your project to include WordPress if you don't want to, and the extension doesn't scan the files in your project looking for actions and filters.

## Sponsors

The time that I spend maintaining this extension and other tools is in part sponsored by:

[![Automattic](images/gh/automattic.png)](https://automattic.com)

Plus all my kind sponsors on GitHub:

[![Sponsors](images/gh/everyone.png)](https://github.com/sponsors/johnbillion)

[Click here to find out about supporting this extension and my other WordPress development tools and plugins](https://github.com/sponsors/johnbillion).

## License

This extension is free and open source software. It's licensed under the GNU GPL version 3.

## Thanks

* This extension uses the [wp-hooks library](https://github.com/wp-hooks/wordpress-core) as the hook information provider.
* This extension uses some code inspired by the [Autocomplete WordPress Hooks extension for Atom](https://github.com/joehoyle/atom-autocomplete-wordpress-hooks).
