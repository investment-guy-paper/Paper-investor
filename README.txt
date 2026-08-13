PAPER INVESTOR — version 0.1
========================

Upload ALL 7 files to the ROOT of your repo (not inside a folder):
  index.html  manifest.webmanifest  sw.js
  icon-180.png  icon-192.png  icon-512.png  icon-maskable-512.png

CHECKING THE UPDATE WORKED
--------------------------
Open the app and look at the top line: it should read "v0.1".
Also in Progress tab -> VERSION -> "Version 0.1".
If it still shows an older number, the phone is serving a cached copy.

IF THE SITE ISN'T UPDATING
--------------------------
1. On github.com, open your repo. index.html must be visible in the file
   list straight away. If you see a folder instead, open it, and re-upload
   the files to the root.
2. Check the commit actually happened: the file list should show your
   upload time, not "last week".
3. Settings -> Pages should say "Your site is live at ...".
4. GitHub's CDN caches for up to 10 minutes. Wait, then reload.
5. Test in a Safari PRIVATE tab - that ignores the cache entirely.
   If the private tab shows the new build but the home screen app doesn't,
   it's the app cache: remove the icon and re-add it.

Back up progress first: Progress tab -> Export save file.
