# Peak card

A digital business card. One page, no build step, works offline once opened.

## Make it yours
1. Open `card.json` and fill in `phone`, `email`, and the TikTok `url`. Anything left empty is hidden.
2. Run `node build-vcard.mjs`. This regenerates `contact.vcf`, the file people download.
3. Commit and push.

## Put it online (GitHub Pages)
1. Create a repo (for example `card`) and push these files to the root.
2. Repo Settings > Pages > Deploy from branch > `main` / root.
3. Your card lives at `https://<username>.github.io/card/`.
4. Optional: add a custom domain such as `card.peakenterprise.ca` in the same Pages settings.

## Put it on your phone
Open the live URL on your phone, then:
- iPhone (Safari): Share > Add to Home Screen
- Android (Chrome): menu > Install app / Add to Home screen

Tap the icon, tap **Show QR**, and let them scan it. The QR always points at the page URL,
so editing `card.json` later never breaks cards you've already handed out.

## Notes
- `shareUrl` in `card.json` overrides the URL used in the QR (handy when testing locally).
- `photo` accepts a path such as `me.jpg` (about 400px square, under 100 KB). It replaces the initials badge
  and is embedded in the downloaded contact, so you show up with your face in people's phones.
- After changing files, the service worker serves fresh versions when you're online. If your
  phone seems stuck on an old version, bump `CACHE` in `sw.js` (for example `peak-card-v2`).
- Third-party code: `vendor/qrcode.js` is qrcode-generator by Kazuhiko Arase (MIT).
