# Literature Review Database Template

The Interactive Literature Review Database Template (ILDT), is an open-source, configurable web tool designed to support scholars’ discovery, exploration, and synthesis of research. The tool enables authors to transform any corpus—such as the full set of Journal of the Learning Sciences (JLS) articles used in our demonstration—into an interactive, filterable database organized around meaningful dimensions, including theoretical frameworks, methodologies, study contexts, pedagogical models, and constructs. Unlike traditional systematic reviews that culminate in static narrative summaries or meta-analytic findings, our approach pairs systematic review methods with a dynamic, publicly accessible database that continues to evolve alongside the literature it represents. We envision this tool as a living & crowdsource-able resource to support newcomers to the field and scaffold more transparent and sustainable review practices.

## BACKGROUND / CONTEXT

At its core, the template is designed as a plug-and-play web repository that requires only two editable files: a single JSON configuration file and a CSV containing the corpus. All functional logic–HTML, CSS, and JavaScript–is encapsulated in the template, allowing authors to customize, deploy, and update their databases without any programming expertise. This philosophy of a lightweight, accessible configuration makes the tool suitable for a wide range of scholars, including those new to literature reviews or who wish to provide transparent, interactive supplements alongside formal publications. By lowering the technical bar, the template supports the creation of living literature reviews that remain relevant and maintainable long after publication.

The alpha build of the template has been deployed using an existing corpus aggregated during a systematic review on research conducted by a collaborator on summer camps for youth with disabilities (see Gerth, 2025). This release was used in early usability testing to refine interface features and tagging workflows and demonstrate the cross-disciplinary portability and value for non-LS systematic reviews.

The beta release was used in the deployment in parallel with a systematic review of all JLS publications (see Figure 1, publication in progress). Articles were manually tagged across five dimensions—frameworks, methods, study contexts, pedagogical frameworks, and constructs—using a collaboratively developed review procedure (see Appendix). This implementation sought to demonstrate scalability, stress-test dynamic filtering, and assess the potential to explore longitudinal trends in LS.

Considering our aims to develop a tool that was context-agnostic, the first author (an early-career learning sciences researcher and the lead software developer) facilitated a workshop for the other 4 authors (all learning sciences graduate students in their first 2 years of study) where each student was tasked with configuring their own instance of the database (using release version 1.0). Here, each student conducted their own exploratory literature review on a niche topic of their interest to populate a smaller (relative to the JLS article corpus) literature database. This workshop functioned to (1) test for usability and accessibility issues, (2) refine the onboarding materials for clarity, and (3) reveal the limitations of the software across varying levels of user expertise, familiarity with their literature, and disciplinary focus. 

The template renders each literature item as an interactive tile that displays customizable metadata (e.g., title, authors, year) and provides 1-click access to the article. Users can filter, sort, or combine categories across five tagging dimensions—theoretical frameworks, methodological approaches, study contexts, pedagogical frameworks, and constructs—providing multiple avenues of discovery even for those without prior knowledge of relevant keywords.

The tool’s architecture includes several features that enhance both usability and transparency:
* Dynamic, multi-filter navigation: Users can apply multiple filters simultaneously, generating live cross-tabulations of the corpus that reveal patterns across methods, theories, contexts, and constructs.
* Browseable tag lists with live frequency counts: Rather than requiring users to guess keywords, the interface surfaces all available tags and their relative prevalence, allowing scholars to identify co-occurring concepts or underexplored topic areas.
* Automatic generation of filters based on corpus structure: The tool infers its filter categories directly from the CSV, ensuring that the interface adapts to the specific needs of any imported corpus.
* No-code deployment and updating: Authors can revise the CSV to add new publications or modify tags, and the site automatically reflects these changes without requiring technical edits.
* Flexible extensibility: Although designed with learning sciences corpora in mind, the architecture can be applied to any domain in which literature needs to be sorted, visualized, and explored interactively.

Notably, the keyword search functionality was intentionally deprioritized. Existing scholarly databases excel at keyword search, but they do little to scaffold exploration for users who lack prior knowledge of the keywords associated with their area of interest. Instead, the template emphasizes structured discoverability—surfacing the field's conceptual organization in ways that invite browsing, comparison, and curiosity-driven exploration.

## USING THE TEMPLATE

This repository provides a plug-and-play web template for sharing a literature review database. All configuration lives in two editable files so non-coders can tailor the page without touching HTML, CSS, or JavaScript:

* `assets/config.json` – Controls the page title, hero text, filter labels, info-field labels, submit button, and favicon.
* `assets/database.csv` – Holds the article data that drives the filterable card grid.

Open `database.html` in a browser after editing these files to see your changes instantly.

### 1. Customize Page Text & Branding

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
| `colors.primaryAccent` | Primary accent used for the hero background and other high-impact elements. |
| `colors.secondaryAccent` | Secondary accent used for interactive highlights such as toggle sliders and buttons. |

📝 **Tips**

* Neutral background, text, and surface colors are standardized in the stylesheet so every deployment starts with an accessible baseline palette.
* When referencing local assets (images, icons, etc.), use paths relative to the project root (for example, `assets/img/my-logo.png`).
* Omit optional fields by leaving them blank or removing them entirely.
* Stick with valid JSON — double quotes around keys/values and commas between items.
* Omit a color entry to fall back to the default palette baked into `assets/css/database.css`.

### 2. Update the Literature Database

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

### 3. Preview Your Changes

1. Open `database.html` in any modern browser.
2. Confirm the hero text, filters, and card content reflect your updates.
3. Test the filters and the “Submit an Article” button (if enabled).

### 4. Optional Enhancements

* Swap images in `assets/img/` or add new ones, updating the paths in `config.json` to match.
* Adjust styling through `assets/css/database.css` if you are comfortable with CSS, but no edits are required for normal usage.
* Host the page with GitHub Pages or any static-site service once your content is ready.

## Need a Fresh Copy?

Fork this repository (or download the ZIP), adjust `config.json` and `database.csv`, and you have a ready-to-share literature review database tailored to your topic.
