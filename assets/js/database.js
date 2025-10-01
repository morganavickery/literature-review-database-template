const defaultConfig = {
  site: {
    pageTitle: "Medical Specialty Camp Literature Database",
    heroHeading: "Medical Specialty Camp Literature Database",
    submitButtonText: "Submit an Article",
    submitButtonLink: "https://forms.gle/42GckNJQ4EVMdHDr7"
  },
  filters: {
    filter1: { label: "Focus" },
    filter2: { label: "Medical Population" },
    filter3: { label: "Findings" }
  },
  infoFields: {
    info1: { label: "Context" },
    info2: { label: "Method" },
    info3: { label: "Participants" }
  },
  branding: {
    favicon: "assets/uploads/signpost-2.svg"
  }
};

let FILTER_KEYS = Object.keys(defaultConfig.filters || {});
const INFO_KEYS = ["info1", "info2", "info3"];

let appConfig = cloneObject(defaultConfig);
let database = [];
let activeFilters = {};
let filterLabels = {};
let infoLabels = {};
let expandedCardKey = null;
let venueOptions = [];
let activeVenues = new Set();

const debouncedUpdateFilterCounts = debounce(updateFilterCounts, 100);

document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
  FILTER_KEYS = getFilterKeys(appConfig);
  filterLabels = buildFilterLabels(appConfig);
  infoLabels = buildInfoLabels(appConfig);
  renderFilterGroups(FILTER_KEYS, filterLabels);
  activeFilters = createEmptyFilterState();
  applyConfig(appConfig, filterLabels);

  database = await loadDatabase();
  generateFilters(database, filterLabels);
  initializeVenueFilters(database);
  renderCards(database, filterLabels, infoLabels);
  updateFilterCounts();

  setupResetButton();
  setupFilterToggle();
});

function createEmptyFilterState() {
  return FILTER_KEYS.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});
}

async function loadDatabase() {
  try {
    const response = await fetch("assets/database.csv", { cache: "no-store" });
    if (!response.ok) throw new Error("Network response was not ok");
    const text = await response.text();
    const utf8decoder = new TextDecoder("utf-8");
    const decodedText = utf8decoder.decode(new TextEncoder().encode(text));
    const rows = decodedText
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter((row) => row.length > 0);

    if (rows.length === 0) {
      return [];
    }

    const headerRow = parseCSVRow(rows[0]);
    const headerMap = headerRow.reduce((acc, header, index) => {
      const key = header?.trim();
      if (key) {
        acc[key] = index;
      }
      return acc;
    }, {});

    const dataRows = rows.slice(1);

    const parsed = dataRows
      .map((row) => {
        const columns = parseCSVRow(row);
        if (!columns || columns.length === 0) return null;

        const record = {
          title: decodeEntities(getColumnValue(columns, headerMap, "title")),
          authors_abbrev: decodeEntities(
            getColumnValue(columns, headerMap, "authors_abbrev")
          ),
          year: decodeEntities(getColumnValue(columns, headerMap, "year")),
          venue: decodeEntities(getColumnValue(columns, headerMap, "venue")),
          abstract: decodeEntities(getColumnValue(columns, headerMap, "abstract")),
          doi_link: getColumnValue(columns, headerMap, "doi_link"),
          info1: decodeEntities(getColumnValue(columns, headerMap, "info1")),
          info2: decodeEntities(getColumnValue(columns, headerMap, "info2")),
          info3: decodeEntities(getColumnValue(columns, headerMap, "info3"))
        };

        FILTER_KEYS.forEach((key) => {
          record[key] = decodeEntities(getColumnValue(columns, headerMap, key));
        });

        return record;
      })
      .filter((item) => item !== null);

    return parsed;
  } catch (error) {
    showErrorMessage();
    console.error("Failed to load database:", error);
    return [];
  }
}

function showErrorMessage() {
  const container = document.getElementById("database-cards");
  if (container) {
    container.innerHTML = '<div class="error-message">Couldn’t load data. Please try again later.</div>';
  }
}

function parseCSVRow(row) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"' && row[i + 1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function generateFilters(data, labels) {
  FILTER_KEYS.forEach((key) => {
    const container = document.getElementById(`${key}-filters`);
    if (!container) return;
    const group = container.closest(".filter-group");

    container.innerHTML = "";
    const counts = {};

    data.forEach((item) => {
      getItemValues(item[key]).forEach((value) => {
        counts[value] = (counts[value] || 0) + 1;
      });
    });

    const sortedValues = Object.keys(counts).sort((a, b) => a.localeCompare(b));

    if (sortedValues.length === 0) {
      group?.classList.add("filter-group--empty");
      return;
    }

    group?.classList.remove("filter-group--empty");

    const headingLabel = labels[key];

    sortedValues.forEach((value) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = value;
      checkbox.id = `${key}-${value.replace(/\s+/g, "-").toLowerCase()}`;
      checkbox.setAttribute("aria-label", `${headingLabel || "Filter"}: ${value}`);
      checkbox.addEventListener("change", () => {
        handleFilterChange(key, value);
      });

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.appendChild(checkbox);

      const textSpan = document.createElement("span");
      textSpan.textContent = ` ${value} `;
      label.appendChild(textSpan);

      const countSpan = document.createElement("span");
      countSpan.className = "filter-count";
      countSpan.textContent = `[${counts[value]}]`;
      label.appendChild(countSpan);

      container.appendChild(label);
    });
  });
}

function handleFilterChange(key, value) {
  const selections = activeFilters[key];
  const index = selections.indexOf(value);
  if (index > -1) {
    selections.splice(index, 1);
  } else {
    selections.push(value);
  }

  expandedCardKey = null;
  renderCards(database, filterLabels, infoLabels);
  debouncedUpdateFilterCounts();
}

function renderCards(data, filterLabelsMap, infoLabelsMap) {
  const container = document.getElementById("database-cards");
  if (!container) return;

  const filteredData = getFilteredData(data);

  if (filteredData.length === 0) {
    expandedCardKey = null;
    container.innerHTML = '<div class="no-results">No records match your filters.</div>';
    return;
  }

  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  let hasExpandedCard = false;

  filteredData.forEach((item) => {
    const card = createCardElement(item, filterLabelsMap, infoLabelsMap);
    if (card.classList.contains("card-expanded")) {
      hasExpandedCard = true;
    }
    fragment.appendChild(card);
  });

  container.appendChild(fragment);

  if (!hasExpandedCard) {
    expandedCardKey = null;
  }
}

function createCardElement(item, filterLabelsMap, infoLabelsMap) {
  const card = document.createElement("div");
  card.className = "database-card";
  const cardKey = getCardKey(item);
  card.dataset.cardKey = cardKey;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View details for ${item.title}`);

  const isExpanded = expandedCardKey && expandedCardKey === cardKey;
  if (isExpanded) {
    card.classList.add("card-expanded");
  }

  const safeTitle = escapeHTML(item.title || "Untitled Paper");
  const metaParts = [];
  if (item.authors_abbrev) metaParts.push(escapeHTML(item.authors_abbrev));
  if (item.year) metaParts.push(escapeHTML(item.year));
  if (item.venue) metaParts.push(escapeHTML(item.venue));
  const cardMeta = metaParts.join(" • ");

  const filterTags = FILTER_KEYS.map((key) =>
    createTagSection(filterLabelsMap[key], item[key])
  )
    .filter(Boolean)
    .join("");

  const abstractSection = createDetailTextSection("Abstract", item.abstract);
  const infoSections = INFO_KEYS.map((key) =>
    createDetailTextSection(infoLabelsMap[key], item[key])
  )
    .filter(Boolean)
    .join("");

  const expandedContent = [abstractSection, infoSections].filter(Boolean).join("");
  const expandedDetails = expandedContent
    ? `<div class="expanded-details">${expandedContent}</div>`
    : "";

  const doiURL = item.doi_link ? item.doi_link.trim() : "";
  const hasDOI = doiURL !== "" && /^https?:\/\//.test(doiURL);

  card.innerHTML = `
    <div class="card-header">
      <div>${cardMeta ? `<p class="card-meta">${cardMeta}</p>` : ""}</div>
      ${hasDOI ? `<div class="doi-flag" tabindex="0" role="button" aria-label="Open paper in new tab">Access Paper</div>` : ""}
    </div>
    <div class="card-title">${safeTitle}</div>
    ${filterTags ? `<div class="card-tags">${filterTags}</div>` : ""}
    ${expandedDetails}
  `;

  card.addEventListener("click", (event) => {
    if (event.target.classList.contains("doi-flag")) return;
    expandedCardKey = expandedCardKey === cardKey ? null : cardKey;
    renderCards(database, filterLabels, infoLabels);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      card.click();
    }
  });

  if (hasDOI) {
    const doiFlag = card.querySelector(".doi-flag");
    doiFlag?.addEventListener("click", (event) => {
      event.stopPropagation();
      window.open(doiURL, "_blank");
    });
    doiFlag?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.open(doiURL, "_blank");
      }
    });
  }

  return card;
}

function getCardKey(item) {
  return [
    item.title || "",
    item.authors_abbrev || "",
    item.year || "",
    item.doi_link || ""
  ].join("::");
}

function createTagSection(label, values) {
  const tags = getItemValues(values);
  if (tags.length === 0) return "";
  const safeLabel = label ? escapeHTML(label) : "";
  const tagsHTML = tags
    .map((value) => `<span class="tag">${escapeHTML(value)}</span>`)
    .join("");
  const heading = safeLabel ? `${safeLabel}:` : "";
  return `
    <div class="tag-section">
      <div class="tag-heading">${heading}</div>
      <div class="tag-container">${tagsHTML}</div>
    </div>
  `;
}

function createDetailTextSection(label, value) {
  if (!value || value.trim() === "" || value.trim() === "-") return "";
  const safeValue = escapeHTML(value.trim());
  const safeLabel = label ? escapeHTML(label) : "";
  const heading = safeLabel ? `${safeLabel}:` : "";
  return `
    <div class="tag-section detail-text">
      <div class="detail-heading">${heading}</div>
      <div class="tag-container">${safeValue}</div>
    </div>
  `;
}

function getFilteredData(data) {
  return data.filter((item) => {
    if (venueOptions.length > 0) {
      if (activeVenues.size === 0) {
        return false;
      }

      const venueName = normalizeVenue(item.venue);
      if (!activeVenues.has(venueName)) {
        return false;
      }
    }

    return FILTER_KEYS.every((key) => {
      const active = activeFilters[key];
      if (!active || active.length === 0) return true;
      const values = getItemValues(item[key]);
      return active.some((selected) => values.includes(selected));
    });
  });
}

function getItemValues(rawValue) {
  if (!rawValue) return [];
  return rawValue
    .split(";")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function updateFilterCounts() {
  const filteredData = getFilteredData(database);

  FILTER_KEYS.forEach((key) => {
    const counts = {};
    filteredData.forEach((item) => {
      getItemValues(item[key]).forEach((value) => {
        counts[value] = (counts[value] || 0) + 1;
      });
    });

    document
      .querySelectorAll(`#${key}-filters label`)
      .forEach((label) => {
        const checkbox = label.querySelector("input[type='checkbox']");
        const countSpan = label.querySelector(".filter-count");
        if (!checkbox || !countSpan) return;

        const filterValue = checkbox.value.trim();
        const count = counts[filterValue] || 0;
        countSpan.textContent = `[${count}]`;

        if (count === 0) {
          label.classList.add("disabled-filter");
        } else {
          label.classList.remove("disabled-filter");
        }
      });
  });
}

function setupResetButton() {
  const resetButton = document.getElementById("reset-filters");
  if (!resetButton) return;

  resetButton.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-options input[type='checkbox']")
      .forEach((checkbox) => {
        checkbox.checked = false;
      });

    activeFilters = createEmptyFilterState();
    resetVenueFilters();
    expandedCardKey = null;
    renderCards(database, filterLabels, infoLabels);
    updateFilterCounts();
  });
}

function setupFilterToggle() {
  const toggleButton = document.getElementById("toggle-filters");
  const filtersSection = document.querySelector(".filters");
  if (!toggleButton || !filtersSection) return;

  toggleButton.addEventListener("click", () => {
    const isCollapsed = filtersSection.classList.toggle("collapsed");
    if (isCollapsed) {
      toggleButton.innerHTML = '<i id="arrow-icon" class="bi bi-arrow-down"></i> Show Filters';
    } else {
      toggleButton.innerHTML = '<i id="arrow-icon" class="bi bi-arrow-up"></i> Hide Filters';
    }
  });
}

async function loadConfig() {
  let mergedConfig = cloneObject(defaultConfig);
  try {
    const response = await fetch("assets/config.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Config not found");
    const userConfig = await response.json();
    mergedConfig = mergeDeep(defaultConfig, userConfig);
  } catch (error) {
    console.warn("Using default configuration due to error loading config:", error);
  }
  appConfig = mergedConfig;
}

function buildFilterLabels(config) {
  const labels = {};
  FILTER_KEYS.forEach((key, index) => {
    const fallback = defaultConfig.filters[key]?.label || `Filter ${index + 1}`;
    const override = config?.filters?.[key]?.label;
    labels[key] = typeof override === "string" && override.trim().length > 0 ? override.trim() : fallback;
  });
  return labels;
}

function buildInfoLabels(config) {
  const labels = {};
  INFO_KEYS.forEach((key, index) => {
    const fallback = defaultConfig.infoFields[key]?.label || `Info ${index + 1}`;
    const override = config?.infoFields?.[key]?.label;
    labels[key] = typeof override === "string" && override.trim().length > 0 ? override.trim() : fallback;
  });
  return labels;
}

function applyConfig(config, filterLabelsMap) {
  const siteTitle = config?.site?.pageTitle || defaultConfig.site.pageTitle;
  document.title = siteTitle;

  const heroHeading = document.querySelector(".hero-text h2");
  if (heroHeading) {
    heroHeading.textContent = config?.site?.heroHeading || defaultConfig.site.heroHeading;
  }

  const addButton = document.querySelector(".add-article-btn");
  if (addButton) {
    const buttonTextNode = addButton.querySelector(".add-article-text") || addButton;
    const buttonText = config?.site?.submitButtonText || defaultConfig.site.submitButtonText;
    buttonTextNode.textContent = buttonText;

    const submitLink = config?.site?.submitButtonLink;
    addButton.onclick = null;
    addButton.style.display = "";
    addButton.removeAttribute("aria-disabled");

    if (submitLink) {
      addButton.onclick = (event) => {
        event.preventDefault();
        window.open(submitLink, "_blank");
      };
    } else {
      addButton.style.display = "none";
      addButton.setAttribute("aria-disabled", "true");
    }
  }

  FILTER_KEYS.forEach((key) => {
    const heading = document.querySelector(`[data-config-filter="${key}"]`);
    if (heading) {
      heading.textContent = filterLabelsMap[key] || heading.textContent;
    }
  });

  const faviconLink = document.querySelector("link[rel='icon']");
  const faviconPath = config?.branding?.favicon || defaultConfig.branding.favicon;
  if (faviconLink && faviconPath) {
    faviconLink.setAttribute("href", faviconPath);
  }
}

function mergeDeep(target, source) {
  if (Array.isArray(source)) {
    return source.slice();
  }

  if (!isObject(source)) {
    return source;
  }

  const base = isObject(target) ? target : {};
  const output = {};

  Object.keys(base).forEach((key) => {
    output[key] = cloneObject(base[key]);
  });

  Object.keys(source).forEach((key) => {
    output[key] = mergeDeep(base[key], source[key]);
  });

  return output;
}

function getFilterKeys(config) {
  const configFilters = config?.filters && Object.keys(config.filters);
  if (configFilters && configFilters.length > 0) {
    return configFilters;
  }
  return Object.keys(defaultConfig.filters || {});
}

function renderFilterGroups(filterKeys, labels) {
  const filtersSection = document.querySelector(".filters");
  if (!filtersSection) return;

  filtersSection.innerHTML = "";

  filterKeys.forEach((key) => {
    const group = document.createElement("div");
    group.className = "filter-group";

    const heading = document.createElement("h3");
    heading.dataset.configFilter = key;
    heading.textContent = labels[key] || key;
    group.appendChild(heading);

    const options = document.createElement("div");
    options.id = `${key}-filters`;
    options.className = "filter-options";
    group.appendChild(options);

    filtersSection.appendChild(group);
  });
}

function getColumnValue(columns, headerMap, key) {
  const index = headerMap[key];
  if (typeof index !== "number") return "";
  return columns[index]?.trim() || "";
}

function initializeVenueFilters(data) {
  venueOptions = getUniqueVenues(data);
  activeVenues = new Set(venueOptions);
  renderVenueTags(venueOptions);
}

function renderVenueTags(venues) {
  const container = document.getElementById("venue-tags");
  const section = document.querySelector(".venue-filter-section");
  if (!container || !section) return;

  container.innerHTML = "";

  if (!venues || venues.length === 0) {
    section.setAttribute("hidden", "");
    return;
  }

  section.removeAttribute("hidden");

  venues.forEach((venue) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "venue-tag";
    const isActive = activeVenues.has(venue);
    button.classList.toggle("venue-tag--active", isActive);
    button.classList.toggle("venue-tag--inactive", !isActive);
    button.textContent = venue;
    button.dataset.venue = venue;
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    button.addEventListener("click", () => {
      toggleVenueFilter(venue);
    });

    container.appendChild(button);
  });
}

function toggleVenueFilter(venue) {
  if (activeVenues.has(venue)) {
    activeVenues.delete(venue);
  } else {
    activeVenues.add(venue);
  }

  renderVenueTags(venueOptions);
  expandedCardKey = null;
  renderCards(database, filterLabels, infoLabels);
  debouncedUpdateFilterCounts();
}

function resetVenueFilters() {
  activeVenues = new Set(venueOptions);
  renderVenueTags(venueOptions);
}

function getUniqueVenues(data) {
  const venues = new Set();
  data.forEach((item) => {
    const normalized = normalizeVenue(item.venue);
    if (normalized) {
      venues.add(normalized);
    }
  });

  return Array.from(venues).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

function normalizeVenue(value) {
  const trimmed = (value || "").trim();
  return trimmed.length > 0 ? trimmed : "No Venue Specified";
}

function isObject(item) {
  return Boolean(item) && typeof item === "object" && !Array.isArray(item);
}

function cloneObject(obj) {
  if (obj === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(obj));
}

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text || "";
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>'\"]/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function decodeEntities(encodedString) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = encodedString;
  return textarea.value;
}
