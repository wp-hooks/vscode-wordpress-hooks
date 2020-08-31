# Autocomplete WordPress Hooks for VS Code

This extension provides autocomplete support for WordPress action and filter names.

Last updated for WordPress 5.5.

## Usage

Start typing the name of a WordPress action or filter within `add_action()` or `add_filter()` and you'll get an autocomplete list of all matching actions or filters, plus information about the parameters and usage:

[![Screenshot of VS Code showing an autocomplete list for the first parameter of the add_filter function](images/screenshot-1.png)](images/screenshot-1.png)

Autocomplete is also provided for a closure callback function and other built-in callbacks to save you keystrokes:

[![Screenshot of VS Code showing an autocomplete list for the callback parameter of the add_filter function](images/screenshot-2.png)](images/screenshot-2.png)

An autocompleted closure callback looks like this:

```php
add_filter( 'template_directory', function( $template_dir, $template, $theme_root ) {
    |
    return $template_dir;
}, 10, 3 );
```

Parameter and return type declarations are provided where appropriate. The behaviour of these can be adjusted in the settings for the extension.

## FAQ

### Which functions does the autocomplete list work with?

* `add_action()`
* `add_filter()`
* `remove_action()`
* `remove_filter()`
* `has_action()`
* `has_filter()`
* `doing_action()`
* `doing_filter()`
* `did_action()`

### How can I trigger the autocomplete list if it doesn't show up?

Place your cursor within the first parameter of one of the supported functions, eg `add_action()` or `add_filter()`, and hit <kbd>ctrl</kbd>+<kbd>space</kbd>. This works with any autocomplete provider, not only this extension.

### Can I disable or adjust the type declarations / type hints?

Yes, open the preferences for VS Code and go to the **Extensions -> Autocomplete WordPress Hooks** section.

## License

This extension is free and open source software. It's licensed under the GPLv3.

## Thanks

* This extension uses the [wp-hooks library](https://github.com/johnbillion/wp-hooks) as the hook information provider.
* This extension uses some code inspired by the [Autocomplete WordPress Hooks extension for Atom](https://github.com/joehoyle/atom-autocomplete-wordpress-hooks).
