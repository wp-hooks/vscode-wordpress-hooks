# Contributing to Autocomplete WordPress Hooks

Code contributions, bug reports, and feedback are very welcome. These should be submitted through [the GitHub repository](https://github.com/johnbillion/vscode-wordpress-hooks).

* [Setting up Locally](#setting-up-locally)
* [Releasing a New Version](#releasing-a-new-version)

## Setting up Locally

You can clone this repo and then run the extension in development mode in VS Code.

### Prerequisites

* [Node](https://nodejs.org/)
* [VS Code](https://code.visualstudio.com/)

### Setup

1. Install the Node dependencies:

       npm install

2. Open the directory in VS Code and launch the extension from the `Run` panel.

The extension source code can be found in `src/extension.ts`.

## Releasing a New Version

These are the steps to take to release a new version of the extension (for contributors who have push access to the GitHub repo).

### Prior to Release

1. Check [the milestone on GitHub](https://github.com/johnbillion/vscode-wordpress-hooks/milestones) for open issues or PRs. Fix or reassign as necessary.
1. Ensure `readme.md` contains an up to date description, FAQs, screenshots, etc.
1. Ensure `.vscodeignore` is up to date with all files that shouldn't be part of the build.
1. Prepare a changelog for [the Releases page on GitHub](https://github.com/johnbillion/vscode-wordpress-hooks/releases).
   - The `git changelog -x` command from [Git Extras](https://github.com/tj/git-extras) is handy for this.

### For Release

1. Ensure you're on the `develop` branch and all the changes for this release have been merged in.
1. Bump the version number:
   - `npm version patch` for a patch release (1.2.3 => 1.2.4)
   - `npm version minor` for a minor release (1.2.3 => 1.3.0)
   - `npm version major` for a major release (1.2.3 => 2.0.0)
1. `git push origin develop`
1. `git checkout trunk`
1. `git merge develop`
1. `git push origin trunk`
1. `git push origin trunk:master` (VS Marketplace uses images from the master branch)
1. `git push origin --tags`
1. Enter the changelog into [the release on GitHub](https://github.com/johnbillion/vscode-wordpress-hooks/releases) and publish it.

Publishing a release on GitHub triggers an action which deploys the release to the VS Marketplace. No need to touch `vsce`.

### Manual Deployment

If necessary, manual deployment to the VS Marketplace can be done with:

    npm run deploy
