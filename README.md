# WorldCast Site — GitHub Pages Deployment

## Deployment

1. Push this folder's contents to your GitHub repo (default branch or `gh-pages` branch).
2. In repo Settings → Pages, set source to your branch + `/root` folder.
3. Wait 1-2 minutes; site will be live at `https://<user>.github.io/<repo>/`.

## Notes

- `.nojekyll` disables Jekyll processing (so `_`-prefixed folders work).
- All asset paths are relative; no base URL needed.
- Total size: ~215MB. GitHub Pages soft limit is 1GB.
