# How to update your site (no coding required)

Your site now rebuilds itself automatically. Every time you **push a change to
GitHub**, a robot (GitHub Actions) regenerates all the pages from the files in
the `content/` folder and republishes the live site — usually within about a
minute. You never need to hand-edit the `.html` files at the root of the repo
(`about_me.html`, `projects.html`, etc.) — they're regenerated from scratch
every time and any manual edits to them would just get overwritten.

The only two steps for *any* update are always:
1. Add/edit a file as described below.
2. `git add`, `git commit`, `git push`.

---

## One-time setup (do this once)

0. **Add the workflow file.** Everything else was written straight into your
   project folder for you, but GitHub blocks this kind of remote tool from
   writing into `.github/workflows/` for safety, so this one file needs a
   manual step: on github.com, open your repo → click **Add file → Create
   new file** → for the filename type `.github/workflows/deploy.yml`
   (GitHub creates the folders automatically) → paste in the contents shown
   below → commit directly to `main`. Takes under a minute, one time only.

   ```yaml
   name: Build and deploy site

   on:
     push:
       branches: ["main"]
     workflow_dispatch: {}

   permissions:
     contents: read
     pages: write
     id-token: write

   concurrency:
     group: "pages"
     cancel-in-progress: true

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4

         - name: Set up Node
           uses: actions/setup-node@v4
           with:
             node-version: "20"
             cache: "npm"

         - name: Install dependencies
           run: npm ci

         - name: Build site
           run: npm run build

         - name: Configure Pages
           uses: actions/configure-pages@v5

         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: .

     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

1. **Turn on GitHub Actions deployment for Pages.** On GitHub, go to your
   repo → **Settings → Pages** → under "Build and deployment", set **Source**
   to **GitHub Actions** (instead of "Deploy from a branch"). Save. This is
   what lets the workflow in `.github/workflows/deploy.yml` publish the site.
2. **Add your resume.** Drop your resume PDF into the `resume/` folder and
   name it exactly `Amaya-Devindi-Resume.pdf` (see `resume/README.txt`).
3. **Set your real contact email.** Open `content/site.json` and replace
   `"REPLACE_WITH_YOUR_EMAIL@example.com"` with your real email address.
4. **(Optional) Turn on the contact form for real.** Right now the contact
   form on the homepage falls back to opening the visitor's email app (no
   setup needed, works immediately). If you'd like messages to submit
   directly without opening email, sign up for a free account at
   [formspree.io](https://formspree.io) (no credit card needed), create a
   form, and paste the endpoint URL it gives you into `contactFormEndpoint`
   in `content/site.json`.

---

## Add a new project

1. Copy `content/projects/_TEMPLATE.md` to a new file in the same folder,
   e.g. `content/projects/08-my-new-project.md`.
2. Fill in the title, a thumbnail image path, tags, and the link.
3. Put the thumbnail image in `images/projects/`.
4. Push. The card appears on the Projects page automatically, including in
   the tag filters and search.

## Add a new certificate (Self Learning page)

1. Copy `content/self-learning/certificates/_TEMPLATE.md` to a new file.
2. Fill in the name, provider, certificate image path, and verify link.
3. Put the certificate image in `images/self_learned/`.
4. Push.

## Add a new learning topic (Self Learning page)

1. Copy `content/self-learning/topics/_TEMPLATE.md` to a new file (numbering
   it, e.g. `09-topic-name.md`, controls its position).
2. Fill in the title, a short description, and any resource links.
3. Push.

## Add a new community resource link

1. Copy `content/community-resources/_TEMPLATE.md` to a new file.
2. Set `group` to `al`, `ol`, or `uni` (or invent a new group — it will show
   up as its own card automatically), plus the subject name and link.
3. Add the actual notes page itself under `community_resourses/<group>/`.
4. Push.

## Add new art (Aesthetic page) — no file to edit at all

Just drop a new image (`.jpg`, `.png`, `.webp`) or video (`.mp4`, `.webm`)
into `images/art/` and push. It shows up automatically. If you want to give
it a specific caption (like "Watercolor Painting"), add a line for it in
`content/aesthetic-meta.json` — otherwise it gets a default caption made
from the filename.

## Add new garden photos (Hobbies page) — no file to edit at all

Drop a new photo into `images/garden/` and push. Name it starting with:
- `f_` for a flower photo (e.g. `f_8.jpg`)
- `fr_` for a fruit photo
- `v_` for a vegetable photo

The filter buttons and gallery update automatically based on these prefixes.

## Edit grades, education history, languages, or extracurriculars

These live in one file: `content/academic.json`. It's a structured file, not
a template you copy — just open it, find the section you want to change
(`educationHistory`, `results`, `languages`, or `extracurriculars`), edit the
values, and push. Keep the punctuation (`{ }`, `[ ]`, commas, quotes) intact —
a JSON validator (search "JSON validator" online, or most code editors flag
this automatically) will catch a typo before you push if you're unsure.

---

## Previewing changes before you push (optional)

If you have Node.js installed, you can preview a build locally:

```
npm install
npm run build
```

Then open `about_me.html` in your browser. This is optional — pushing to
GitHub triggers the same build automatically either way.

---

## Known gaps from the old site (worth knowing about)

- The two in-depth project write-ups ("Customer Churn Prediction…" and
  "Image Classifier") under `projects/` are large, self-contained exported
  notebooks and were left exactly as they were — they weren't rebuilt in the
  new visual style, only relinked.
- `community_resourses/ol/ol_maths.html` and `ol_ict.html` were already empty
  placeholder files on the old site — the new hub page still links to them,
  they just have no content yet.
- The old site had a broken link to an "Information Technology" / data
  structures notes page that never actually existed
  (`uni/data_structures.html`). It's been left out of the new Community
  Resources page rather than link to a dead page — create that file and add
  an entry in `content/community-resources/` to bring it back.
