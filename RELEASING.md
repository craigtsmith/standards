# Releasing

release-please opens a release PR from conventional commits on `main`. Merging it tags the release, and `.github/workflows/release.yml` stages the version on npm through trusted publishing. Nothing goes live until a maintainer approves the staged version with 2FA.

## Trusted publisher

The trusted publisher on npmjs.com must match these values exactly. All fields are case-sensitive.

| Field                | Value                                                                     |
| -------------------- | ------------------------------------------------------------------------- |
| Publisher            | GitHub Actions                                                            |
| Organization or user | `craigtsmith`                                                             |
| Repository           | `standards`                                                               |
| Workflow filename    | `release.yml`                                                             |
| Environment name     | blank                                                                     |
| Allowed actions      | `npm stage publish` only; leave `npm publish` and `npm dist-tag` unticked |

`npm stage publish` is always allowed. Renaming `release.yml` breaks publishing until the trusted publisher is recreated: a connection cannot be edited, only deleted and added again. npm also checks that `repository.url` in `package.json` matches the GitHub repository.

## One-time setup

1. Enable 2FA on the npm account. Staged publishing and approval both need it.
2. Merge `chore/publish-readiness` into `main`. The release workflow runs on that push. If release-please opens a release PR before the `v0.1.0` tag exists, close it.
3. Make the GitHub repository public. npm generates provenance only for a public repository.
4. In the repository settings, under Actions > General > Workflow permissions, tick "Allow GitHub Actions to create and approve pull requests". release-please uses `GITHUB_TOKEN` to open its PR.
5. Publish 0.1.0 by hand from the `main` commit that carries version 0.1.0. A staged publish could create the package, but the trusted publisher can only be configured on a package that exists.

   ```sh
   pnpm install --frozen-lockfile
   npm publish --access public
   ```

   `prepack` runs `pnpm build`. npm prompts for 2FA.

6. Tag the same commit so release-please has a baseline. With `include-component-in-tag: false` the tag is `v0.1.0`. release-please looks for a GitHub release first, then for that tag.

   ```sh
   git tag v0.1.0
   git push origin v0.1.0
   ```

7. On npmjs.com, open the package's Settings > Publishing access and select "Require two-factor authentication and disallow tokens". Trusted publishing keeps working because it uses OIDC.

## First automated release

A new trusted publisher expires unless it completes a successful publish within 2 days. Configure it when a release PR is ready to merge.

1. On npmjs.com, open the package's Settings > Trusted publishing and add a GitHub Actions publisher with the values in the table above.
2. Merge the release PR within 2 days. If the publisher expires, delete it and add it again.

## Each release

1. release-please keeps a PR titled `chore(main): release <version>` up to date on every push to `main`. It runs only on pushes to `main`. CI does not run on this PR, because events created by `GITHUB_TOKEN` start no workflows.
2. Merge the PR. The release job tags `v<version>` and creates the GitHub release. The publish job checks out the tag, builds, tests, and runs `npm stage publish`.
3. Approve the staged version on npmjs.com in the Staged Packages tab, or from the CLI. Approval prompts for 2FA.

   ```sh
   npm stage list @craigts.dev/standards
   npm stage approve <stage-id>
   ```

To inspect before approving, use `npm stage view <stage-id>` or `npm stage download <stage-id>`.

A staged version holds its version number. Nothing else can publish that version until `npm stage reject <stage-id>` removes it. After a rejection, re-run the publish job to stage it again, or release a fix as the next version.

## Commits and versions

Versions follow conventional commits. While the version is below 1.0.0, `bump-minor-pre-major` makes a breaking change bump the minor version. `feat` bumps the minor, `fix` and `perf` the patch. The changelog lists `feat`, `fix`, `perf`, `revert` and `docs`; `chore`, `refactor`, `test`, `build`, `ci` and `style` are hidden.

## Troubleshooting

`ENEEDAUTH` or `E404` from `npm stage publish` means the run did not match the trusted publisher. Check the workflow filename, the owner and repository, and that the job has `id-token: write`.

## References

- https://docs.npmjs.com/staged-publishing/
- https://docs.npmjs.com/trusted-publishers/
- https://docs.npmjs.com/cli/v11/commands/npm-stage
- https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md
