node-mv
=======

Command line tool for moving NodeJS files around and updating their dependents

## Usage
./src/node-mv file targetDir rootDir [--dry] [--no-backup]


## Limitations
* Module name in require() must be a string literal. The renaming is based on static analysis, so expressions will not be evaluated.
* Can't require a module more than once per file
* Conditionally included require's will not be processed.
