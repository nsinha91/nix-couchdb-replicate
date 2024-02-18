#### VSCode Extensions

Running the project requires certain VS Code extensions, which are listed in `.vscode/extensions.json`. Install these extensions if they do not exist already.

#### Environment file

Create a `.env` file in the root of the project if it does not exist already. In it, create environment variables as demonstrated in `.env.example`.

#### Databases

Initialize test databases using `docker-compose up -d`.

#### Install modules

Install packages using `npm i`.

#### Testing the tool

- For higher frequency testing, run `node app/app.js` whenever required.
- Once you reach a checkpoint, run `npm i . -g` to install the package globally. Note that this will remove the production package from global npm installs if you have it installed. You can then run the tool on the command line like `nix-couchdb-replicate ...` or `nix-couchdb-replicate.cmd ...` on Windows.
- You can also run `npm link` to install the package globally, as well as accommodate any changes made to the code as you go. To revert `npm link`, uninstall the global package as you normally would, i.e., `npm un -g nix-couchdb-replicate`.
