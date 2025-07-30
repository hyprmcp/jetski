# Contributing

Thank you for your interest in contributing to Jetski!

## How to run Jetski for development

To run the Jetski locally, clone the repository and make sure that all necessary tools and tasks are defined in [mise.toml](mise.toml).

You can then start the necessary containers and the Jetski with:

```shell
# installs the necessary tools
mise install
# Start the database and a mock SMTP server
docker compose up -d
# Start Jetski backend & frontend
mise run serve && pnpm run start
```

## Backporting bugfixes

If the `main` branch already contains changes that would warrant a major or minor version bump but there is a need to create a patch release only,
it is possible to backport commits by pushing to the relevant `v*.*.x` branch.
For example, if a commit should be added to version 1.2.3, it must be pushed to the `v1.2.x` branch.

**Important:** Please keep in mind the following rules for backporting:

1. Do not backport changes that would require an inappropriate version bump.
   For example, do not add new features to the `v1.2.x` branch, only bugfixes.
2. Only backport changes that are already in `main`. Ideally, use `git cherry-pick`.
