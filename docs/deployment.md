# Deployment

- Website: [cheahtj.github.io](https://cheahtj.github.io/)
- Source: [cheahTJ/cheahTJ.github.io](https://github.com/cheahTJ/cheahTJ.github.io)
- Publishing source in **Settings → Pages**: **GitHub Actions**
- Workflow: `.github/workflows/deploy.yml`

The repository now stores readable source and the active assets. Earlier commits
stored only generated website files. Do not replace the source tree with a build
ZIP or the contents of `dist/client`.

## Publish a change

1. Edit source or assets in this checkout.
2. Run `npm ci` if dependencies changed, then `npm run check` and `npm run build`.
3. Preview the build with `npm start`. Review affected scenes on desktop and phone.
4. Commit and push to `main`.
5. Check the **Validate and deploy portfolio** run in the repository's Actions tab.
   The build must pass before the deployment job can publish.
6. Verify the public page after the deployment completes.

Pull requests run the same checks and build, but do not publish. The workflow can
also be rerun manually from Actions. GitHub supplies a short-lived token for Pages;
no personal access token or other secret is stored in the repository.

The app uses root-relative asset URLs and is configured for the account-level
`cheahTJ.github.io` repository. Moving it to a project subpath requires a base-path
and asset-URL review.

## Restore a previous version

Revert the relevant source commit and push the revert to `main`. This runs the
same checks and republishes the previous behavior. A failed build does not deploy
an incomplete artifact.

Reference: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
