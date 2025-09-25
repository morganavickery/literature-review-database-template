# Literature Review Database Template

This repository provides a plug-and-play web template for sharing a literature review database. All configuration lives in two editable files so non-coders can tailor the page without touching HTML, CSS, or JavaScript:

- `assets/config.json` – Controls the page title, hero text, sidebar info, filter labels, submit button, and social links.
- `assets/database.csv` – Holds the article data that drives the filterable card grid.

Open `database.html` in a browser after editing these files to see your changes instantly.

## 1. Customize Page Text & Branding

Edit `assets/config.json` in any text editor. Each field is plain English; update the sample values with your own content.

| Path | What it controls |
| --- | --- |
| `site.pageTitle` | Browser tab title. |
| `site.heroHeading` | Large title at the top of the database page. |
| `site.submitButtonText` | Label inside the optional “add article” button. |
| `site.submitButtonLink` | URL opened when that button is clicked (leave blank to hide the button). |
| `filters.focus.label` | Heading for the first filter column. |
| `filters.medical.label` | Heading for the second filter column. |
| `filters.findings.label` | Heading for the third filter column and the expanded “Findings” section inside each card. |
| `sidebar.name` | Name that appears above the navigation. |
| `sidebar.email` | Email displayed in the contact block. |
| `sidebar.profileImage` | Path (or URL) to the profile image in the sidebar. |
| `sidebar.socials` | Array of social links, each with a `label`, `url`, and optional `icon` path. |
| `branding.favicon` | Path to the favicon shown in the browser tab. |

📝 **Tips**
- Paths such as `assets/img/profile_headshot.png` are relative to the project root; swap them for your own images placed in the repo.
- Remove unwanted entries in the `sidebar.socials` array or add new ones by following the same object structure.
- Stick with valid JSON — double quotes around keys/values and commas between items.

## 2. Update the Literature Database

`assets/database.csv` is the only data source the page reads. You can edit it in Excel, Google Sheets, or any CSV-friendly tool. Keep the header row exactly as-is so the app can map each column correctly:

```
date,authors,title,participant_type,medical_cat,outcomes_cat,doi_link,camp_type,method,participant_details,finding1,finding2,finding3,finding4,finding5
```

- Each row becomes one card on the page.
- Use semicolons (e.g., `focus_a; focus_b`) inside `participant_type`, `medical_cat`, and `outcomes_cat` to give a paper more than one tag — the filters understand this automatically.
- Leave unused `finding` columns blank; the page hides empty fields for you.
- When you finish editing in Google Sheets, export as **CSV** and replace the existing `assets/database.csv` file.

## 3. Preview Your Changes

1. Open `database.html` in any modern browser.
2. Confirm the hero text, filters, sidebar, and card content reflect your updates.
3. Test the filters and the “Submit an Article” button (if enabled).

## 4. Optional Enhancements

- Swap images in `assets/img/` or add new ones, updating the paths in `config.json` to match.
- Adjust styling through `assets/css/database.css` if you are comfortable with CSS, but no edits are required for normal usage.
- Host the page with GitHub Pages or any static-site service once your content is ready.

## Need a Fresh Copy?

Fork this repository (or download the ZIP), adjust `config.json` and `database.csv`, and you have a ready-to-share literature review database tailored to your topic.
