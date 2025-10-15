# Literature Review Database Template

This repository provides a plug-and-play web template for sharing a literature review database. All configuration lives in two editable files so non-coders can tailor the page without touching HTML, CSS, or JavaScript:

* `assets/config.json` – Controls the page title, hero text, filter labels, info-field labels, submit button, and favicon.
* `assets/database.csv` – Holds the article data that drives the filterable card grid.

Open `database.html` in a browser after editing these files to see your changes instantly.

## 1. Customize Page Text & Branding

Edit `assets/config.json` in any text editor. Each field is plain English; update the sample values with your own content.

| Path | What it controls |
|----|----|
| `site.pageTitle` | Browser tab title and primary hero heading. |
| `site.pageSubtitle` | Subtitle text displayed below the hero title. |
| `site.heroHeading` | Fallback hero title used when `site.pageTitle` is omitted. |
| `site.submitButtonText` | Label inside the optional “add article” button. |
| `site.submitButtonLink` | URL opened when that button is clicked (leave blank to hide the button). |
| `filters.filter1.label` | Heading for the first filter column. |
| `filters.filter2.label` | Heading for the second filter column. |
| `filters.filter3.label` | Heading for the third filter column. |
| `filters.filterX.label` | Add more entries (e.g., `filter4`, `filter5`, …) to create additional filter panels. |
| `infoFields.info1.label` | Heading used in the card details for the first info field. |
| `infoFields.info2.label` | Heading used in the card details for the second info field. |
| `infoFields.info3.label` | Heading used in the card details for the third info field. |
| `branding.favicon` | Path to the favicon shown in the browser tab. |
| `colors.background` | Base page background color. |
| `colors.surface` | Primary surface color for filter panels and other elevated sections. |
| `colors.surfaceStrong` | Secondary surface tone used for filter sidebars and dividers. |
| `colors.text` | Default body text color. |
| `colors.heading` | Color applied to headings. |
| `colors.muted` | Muted text and border color for metadata and outlines. |
| `colors.accent` | Accent color for buttons, active states, and focus rings. |
| `colors.accentStrong` | Darker accent hue used for toggles and selected tags. |
| `colors.contrast` | Text color displayed on top of the accent backgrounds. |
| `colors.heroText` | Text color used within the hero section. |
| `colors.cardBackground` | Background color for each article card. |
| `colors.tagBackground` | Fill color for tag pills and info chips. |

📝 **Tips**

* When referencing local assets (images, icons, etc.), use paths relative to the project root (for example, `assets/img/my-logo.png`).
* Omit optional fields by leaving them blank or removing them entirely.
* Stick with valid JSON — double quotes around keys/values and commas between items.
* Delete any color entry to fall back to the default palette baked into `assets/css/database.css`.

## 2. Update the Literature Database

`assets/database.csv` is the only data source the page reads. You can edit it in Excel, Google Sheets, or any CSV-friendly tool. Keep the existing column names so the app can map each column correctly; add more `filter` columns if you introduce additional filters in `config.json`.

```
title,authors_abbrev,year,venue,abstract,doi_link,filter1,filter2,filter3,info1,info2,info3
```

* Copy this starter template into your spreadsheet (the first row must remain the header above):

```
"Example Intervention Improves Outcomes","Lee et al.","Journal of Camp Medicine","Brief abstract or summary of the paper.",https://doi.org/10.1234/example,(ind.) emotional outcomes; (ind.) social outcomes,cancer,youth,"Weekend oncology camp","Mixed-method evaluation","45 campers"
"Peer Mentoring in Specialty Camps","Martinez & Chen","Recreation & Health","Key findings or abstract text.",,"emerging practice","multiple conditions",,"Summer sessions","Qualitative interviews","32 counselors"
"Technology Toolkit for Remote Camps","Singh et al.","International Journal of eHealth","Optional abstract text goes here.",https://doi.org/10.5678/toolkit,framework / practice,diabetes; autism spectrum disorder,parents,"Virtual camp format","Toolkit description",""
```

* Each row becomes one card on the page.
* Use semicolons (e.g., `theory; practice`) inside any filter column to give a paper more than one tag — the filters understand this automatically.
* Leave optional columns blank when you do not need them; the page hides empty fields for you.
* The `filter` columns feed the filter panels, and their display names come from `config.json`. Add as many `filterX` columns as you need — the page will create matching panels automatically and fall back to generic labels if no custom name is provided.
* The three `info` columns populate the expandable details area, each labelled via `config.json`.
* When you finish editing in Google Sheets, export as **CSV** and replace the existing `assets/database.csv` file.

## 3. Preview Your Changes



1. Open `database.html` in any modern browser.
2. Confirm the hero text, filters, and card content reflect your updates.
3. Test the filters and the “Submit an Article” button (if enabled).

## 4. Optional Enhancements

* Swap images in `assets/img/` or add new ones, updating the paths in `config.json` to match.
* Adjust styling through `assets/css/database.css` if you are comfortable with CSS, but no edits are required for normal usage.
* Host the page with GitHub Pages or any static-site service once your content is ready.

## Need a Fresh Copy?

Fork this repository (or download the ZIP), adjust `config.json` and `database.csv`, and you have a ready-to-share literature review database tailored to your topic.
