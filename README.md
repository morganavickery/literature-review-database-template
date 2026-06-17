# Build Your Own Literature Review Tool

This repository is a GitHub template for making a searchable, filterable literature review website without writing code. You can create your own copy, change the text, replace the sample data, and publish it as a live site.

If you are brand new to GitHub, this guide is written for you. You can do the full setup in your web browser on GitHub. You do not need to install a separate code editor or text editor.

## What This Template Does

Your finished site will:


1. Show a list of articles or sources as cards.
2. Let visitors filter those sources by tags such as theory, method, setting, or population.
3. Let you share the tool with a public link.

For most people, you only need to edit two files:

* `assets/config.json`
* `assets/database.csv`

## Quick Vocabulary

If GitHub is new to you, these words matter:

* **Repository**: a project folder stored on GitHub.
* **Template repository**: a starter project you can copy to make your own version.
* **Commit**: GitHub's word for saving a change.
* **Push**: sending changes from your own computer up to GitHub. If you edit files directly on GitHub in your browser, you usually do **not** need to push anything.
* **Branch**: a version of your repository. In this guide, you can usually keep saving to the default branch, which is often called `main`.

## Before You Start

You will need:


1. A GitHub account: <https://github.com>
2. A title for your database.
3. A spreadsheet of the sources you want to include, or at least a few sample entries to start with.

You do **not** need to know how to code.

## How Saving Works on GitHub

If you edit a file directly on GitHub in your browser:


1. Open the file.
2. Click the pencil icon.
3. Make your changes.
4. Click **Commit changes...**
5. Add a short message, such as `Update site title` or `Replace sample articles`.
6. Choose **Commit directly to the main branch**.
7. Click **Commit changes** again.

That is the browser-based version of saving your work.

Important:

* In this guide, **commit** means "save your changes on GitHub."
* You do **not** need to install software to do this.
* You do **not** need to push separately if you made the edit on GitHub's website.

## Step 1: Create Your Own Copy of This Template


1. Open the main page of this template repository on GitHub.
2. Click **Use this template**.
3. Click **Create a new repository**.
4. Choose the account that should own the project.
5. Type a repository name.
6. Choose whether the repository should be **Public** or **Private**.
7. Click **Create repository from template**.

You now have your own copy of the tool.

## Step 2: Learn the Two Files You Will Edit

Inside your new repository, most files should be left alone. Focus on these:

* `assets/config.json`: controls the page title, subtitle, filter names, info-field labels, button text, favicon, and accent colors.
* `assets/database.csv`: holds the articles, tags, links, and other metadata shown on the page.

The homepage file is already set up for you as `index.html`. You do not need to edit it for normal use.

For most users, the easiest workflow is:


1. Open a file on GitHub.
2. Click the pencil icon.
3. Edit in the browser.
4. Commit the change.

## Step 3: Edit the Site Title, Labels, and Colors


1. In your repository, open `assets/config.json`.
2. Click the pencil icon to edit the file.
3. Replace the sample text with your own.
4. Scroll down and click **Commit changes...**
5. Enter a short message, such as `Update config text`.
6. Choose **Commit directly to the main branch**.
7. Click **Commit changes** to save.

The most important settings are:

| Setting | What it changes |
|----|----|
| `site.pageTitle` | The large title at the top of the page and the browser tab title |
| `site.pageSubtitle` | The smaller subtitle under the title |
| `site.submitButtonText` | The text on the optional submit button, if you choose to use it |
| `site.submitButtonLink` | The link opened by the optional submit button |
| `filters.filter1.label` | The name of your first filter group |
| `filters.filter2.label` | The name of your second filter group |
| `filters.filter3.label` | The name of your third filter group |
| `infoFields.info1.label` | Label for the first extra detail field on each card |
| `infoFields.info2.label` | Label for the second extra detail field on each card |
| `infoFields.info3.label` | Label for the third extra detail field on each card |
| `colors.primaryAccent` | Main accent color |
| `colors.secondaryAccent` | Secondary accent color |

If your version of the template does not show a submit button on the page, you can ignore the two `submitButton` settings.

### Example

If you want a neutral starting point, your config might look like this:

```json
{
  "site": {
    "pageTitle": "Example Research Database",
    "pageSubtitle": "An interactive literature review",
    "heroHeading": "Example Research Database",
    "submitButtonText": "Suggest a Source",
    "submitButtonLink": ""
  },
  "filters": {
    "filter1": { "label": "Theory" },
    "filter2": { "label": "Method" },
    "filter3": { "label": "Population" }
  },
  "infoFields": {
    "info1": { "label": "Setting" },
    "info2": { "label": "Data Source" },
    "info3": { "label": "Notes" }
  }
}
```

### Important Rule

The filter names in `config.json` must match the column names in your CSV.

For example:

* `filters.filter1.label` matches the `filter1` column in `assets/database.csv`
* `filters.filter2.label` matches the `filter2` column
* `filters.filter3.label` matches the `filter3` column

If you add `filter4` in `config.json`, also add a `filter4` column in your CSV.

## Step 4: Build Your Spreadsheet

Open `assets/database.csv` and look at the first row. That row is the header. The header tells the site what each column means.

These are the core columns:

| Column name | What goes there |
|----|----|
| `title` | Title of the article or source |
| `authors_abbrev` | Short author name, such as `Smith et al.` |
| `year` | Publication year |
| `venue` | Journal, conference, book, or source name |
| `abstract` | Summary or abstract |
| `doi_link` | DOI URL or article link |
| `filter1`, `filter2`, `filter3`, etc. | Tags used for filtering |
| `info1`, `info2`, `info3` | Optional extra details shown on each card |

The sample file also includes an `id` column. You can keep it if it helps you organize your spreadsheet, but the website does not require it.

## Step 5: Replace the Sample Data

You can edit `assets/database.csv` in:

* GitHub directly in your browser
* Excel
* Google Sheets
* Numbers

If you want to avoid extra software, edit the file directly on GitHub.

Use a structure like this:

```csv
title,authors_abbrev,year,venue,abstract,doi_link,filter1,filter2,filter3,info1,info2,info3
"Example Source One","Lee et al.",2024,"Example Journal","Short summary goes here.","https://doi.org/10.1234/example1","Theory A","Interview Study","Undergraduates","University classroom","Interviews","Starter sample"
"Example Source Two","Patel and Nguyen",2022,"Sample Review","Another short summary.","https://doi.org/10.1234/example2","Theory B; Theory C","Case Study","Teachers","Professional development","Observations","Multiple tags example"
```

Rules to follow:


1. Keep the column names exactly as written.
2. Put one source on each row.
3. Separate multiple tags in a filter column with semicolons.
4. Leave optional cells blank if you do not need them.
5. Save or export the file as a **CSV** if you edited it outside GitHub.

If you edit `assets/database.csv` on GitHub:


1. Open `assets/database.csv` in your repository.
2. Click the pencil icon.
3. Replace the sample content with your CSV content.
4. Click **Commit changes...**
5. Enter a short message, such as `Replace sample database`.
6. Choose **Commit directly to the main branch**.
7. Click **Commit changes** to save.

## Step 6: Add or Remove Filter Groups

You are not limited to three filters.

If you want more filter groups:


1. Add a new filter in `assets/config.json`, such as `filter4`.
2. Give it a label, such as `"Setting"` or `"Construct"`.
3. Add a matching `filter4` column to `assets/database.csv`.
4. Fill that column with tags for each row.

Example:

```json
"filters": {
  "filter1": { "label": "Theory" },
  "filter2": { "label": "Method" },
  "filter3": { "label": "Population" },
  "filter4": { "label": "Setting" }
}
```

And then in your CSV:

```csv
title,authors_abbrev,year,venue,abstract,doi_link,filter1,filter2,filter3,filter4
```

## Step 7: Publish the Site with GitHub Pages

If you want a shareable web link, publish the repository with GitHub Pages.


1. In your repository, click **Settings**.
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose your main branch.
5. Choose the folder `/(root)`.
6. Click **Save**.

GitHub will build the site and give you a URL.

Because this template already includes `index.html` in the repository root, GitHub Pages can publish it directly.

### Important Publishing Note

GitHub Pages sites are public on the web. If your repository contains material you do not want to share publicly, do not publish it until you remove that material.

Also note:

* On GitHub Free, GitHub Pages is available for public repositories.
* If your repository is private and you are on a plan that allows Pages, the site itself is still publicly accessible once published.

## Step 8: Update the Tool Later

To update your tool in the future:


1. Open your repository on GitHub.
2. Edit `assets/database.csv` to add or revise sources, or edit `assets/config.json` to change labels, colors, or button text.
3. Click **Commit changes...**
4. Add a short message describing what you changed.
5. Choose **Commit directly to the main branch**.
6. Click **Commit changes**.

GitHub Pages will republish the site after the update.

If you made the change in the GitHub browser, there is nothing extra to push. Your commit is already on GitHub.

## Optional: Preview the Site on Your Computer

If you download the repository to your computer, you can open `index.html` in a browser to preview the site locally.

This is optional. Many users can complete the whole setup directly on GitHub.

If you ever work on a downloaded copy later, that is when you would need to **push** your commits back to GitHub. For the browser-only workflow in this README, you can ignore pushing.

## Troubleshooting

### My filters are not showing up correctly

Check that:


1. The filter key exists in both places.
2. The names match exactly, such as `filter4` in both `config.json` and the CSV header.
3. Your CSV is still saved as a real `.csv` file.

### My site is blank or looks broken

Check that:


1. `assets/config.json` still uses valid JSON formatting.
2. Your CSV header row was not accidentally deleted.
3. The homepage file is still named `index.html`.

### I do not understand "commit" or "push"

Use this rule:

* If you are editing on GitHub's website, click **Commit changes** to save. You are done.
* If someone tells you to "push," that only matters when you are editing files on your own computer instead of in the browser.

## Suggested Workflow for First-Time Users

If you want the simplest possible path, do this in order:


1. Create your repository from the template.
2. Edit `assets/config.json` in the GitHub browser.
3. Replace `assets/database.csv` in the GitHub browser.
4. Commit each change on GitHub.
5. Turn on GitHub Pages.
6. Open the live link and test the filters.

## GitHub Docs

If you need GitHub-specific help, these official guides are the most useful:

* Creating a repository from a template: <https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template>
* Editing files on GitHub: <https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files>
* Configuring GitHub Pages: <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>