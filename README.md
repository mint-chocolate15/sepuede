# sepuede

A personal research workspace for projects, tasks, jobs, weekly plans, daily learnings, and publications.

## Features

- Large project workspaces with clickable tasks and jobs
- Start and finish dates, project timelines, and task timelines
- A calendar and weekly plan driven by the same schedule
- Task colors with matching shades for individual jobs
- Daily completion records, work notes, and learnings
- Publication stages and editable manuscript outlines
- Automatic browser saving and JSON backup export/restore

## Run locally

No installation or build step is required. With Python installed, run from the repository root:

```sh
python -m http.server 4173
```

Open http://localhost:4173 in your browser.

## Check the app

With Node.js installed:

```sh
node --check workspace.js
node check-workspace.cjs
```

## Hosting

Serve the repository root using any static web host. All asset links are relative, so the app can run within a repository subdirectory.

## Your records

Records are stored in localStorage in the browser and are not committed to this repository. They do not sync between devices or website addresses. Use **Export backup** before changing browsers or hosting addresses, then **Restore backup** at the new address.

The app has no backend, account system, analytics, or database. Google Fonts are loaded by the stylesheet; system fonts provide a fallback.

