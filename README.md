# Q KINGDOM

Brick-and-pipe skill grind. Follow [@MuazXinthi](https://x.com/MuazXinthi), enter with an X handle, clear 100 typing flags, then grind IQ / EQ / SQ / AQ / CQ like old RuneScape skills.

## Play locally

Open `index.html` in a browser, or from this folder:

```bash
python3 -m http.server 8080
```

## GitHub Pages

Repo Settings → Pages → Deploy from branch `main` → `/` (root).

## Real Sign in with X

1. Create an app at [developer.x.com](https://developer.x.com)
2. Enable OAuth 2.0, type Public client, callback = your exact Pages URL
3. Scopes: `tweet.read users.read follows.read follows.write offline.access`
4. Paste the Client ID into `CONFIG.xClientId` in `js/app.js`

Without a Client ID the castle gate still works: set handle, open the official follow intent, confirm.

Progress is saved in `localStorage` per handle.
