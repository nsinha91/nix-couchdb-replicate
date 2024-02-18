#### VSCode Extensions

Running the project requires certain VS Code extensions, which are listed in `.vscode/extensions.json`. Install these extensions if they do not exist already.

#### Environment file

Create a `.env` file in the root of the project if it does not exist already. In it, create environment variables as demonstrated in `.env.example`.

#### Databases

Initialize test database installations using `docker-compose up -d`.

#### Install modules

Install packages using `npm i`.

#### Run setup

Run `node scripts/setup.js` to initialize system dbs inside the test db installations.

#### Testing the tool

- For higher frequency testing, run `node app/app.js` whenever required.
- Once you reach a checkpoint, run `npm i . -g` to install the package globally. Note that this will remove the production package from global npm installs if you have it installed. You can then run the tool on the command line like `package-name ...` or `package-name.cmd ...` on Windows.
- You can also run `npm link` to install the package globally, as well as accommodate any changes made to the code as you go. To revert `npm link`, uninstall the global package as you normally would, i.e., `npm un -g package-name`.

#### Readme generation

The `README.md` file is not to be directly edited, rather the `buildReadme()` function inside `scripts/build-readme.js` script is to be used to generate it. To make changes to the rendered `README.md`, make changes to the `readmeConfig` object in `scripts/build-readme.js`, and then run `node scripts/build-readme.js`.
