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
let filterVisibility = {};
let filterLabels = {};
let infoLabels = {};
let expandedCardKey = null;
let venueOptions = [];
let activeVenues = new Set();
const VENUE_FILTER_KEY = "venueFilter";
const VENUE_FILTER_LABEL = "Venues";

const debouncedUpdateFilterCounts = debounce(updateFilterCounts, 100);

const TAG_PREFIX_REGEX = /^(?:\[[^\]]+\]\s*)+/i;

const FILTER_OPTION_MIN_FONT_SIZE = 8;
const filterTextContainers = new Set();
let filterTextFitScheduled = false;

function getDisplayTagValue(value) {
  if (typeof value !== "string") return "";
  const cleaned = value.replace(TAG_PREFIX_REGEX, "").trim();
  return cleaned;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();

  const { records, filters } = await loadDatabase();

  FILTER_KEYS = mergeFilterKeys(Object.keys(appConfig?.filters || {}), filters);
  filterLabels = buildFilterLabels(appConfig, FILTER_KEYS);
  infoLabels = buildInfoLabels(appConfig);

  activeFilters = createEmptyFilterState();
  filterVisibility = createDefaultFilterVisibility();
  filterVisibility[VENUE_FILTER_KEY] = true;

  renderFilterPanels(FILTER_KEYS, filterLabels);
  applyConfig(appConfig, filterLabels);
  database = ensureRecordsIncludeFilters(records, FILTER_KEYS);

  generateFilters(database, filterLabels);
  initializeVenueFilters(database);
  renderCards(database, filterLabels, infoLabels);
  updateFilterCounts();

  setupResetButton();
  setupFilterToggle();
});

window.addEventListener("resize", scheduleRefitAllFilterTexts);

function createEmptyFilterState() {
  return FILTER_KEYS.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});
}

function createDefaultFilterVisibility() {
  return FILTER_KEYS.reduce((acc, key) => {
    acc[key] = true;
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
    const rows = splitCSVRows(decodedText);

    if (rows.length === 0) {
      return { records: [], filters: [] };
    }

    const headerRow = parseCSVRow(rows[0]);
    const headerMap = buildHeaderMap(headerRow);
    const csvFilterKeys = extractFilterKeys(headerMap);

    const parsed = rows
      .slice(1)
      .map((row) => {
        const columns = parseCSVRow(row);
        if (columns.length === 0 || columns.every((value) => value.trim().length === 0)) {
          return null;
        }

        const record = {
          title: decodeEntities(getColumnValue(columns, headerMap, "title")),
          authors_abbrev: decodeEntities(getColumnValue(columns, headerMap, "authors_abbrev")),
          year: decodeEntities(getColumnValue(columns, headerMap, "year")),
          venue: decodeEntities(getColumnValue(columns, headerMap, "venue")),
          abstract: decodeEntities(getColumnValue(columns, headerMap, "abstract")),
          doi_link: getColumnValue(columns, headerMap, "doi_link")
        };

        csvFilterKeys.forEach((key) => {
          record[key] = decodeEntities(getColumnValue(columns, headerMap, key));
        });

        INFO_KEYS.forEach((key) => {
          record[key] = decodeEntities(getColumnValue(columns, headerMap, key));
        });

        return record;
      })
      .filter((item) => item !== null);

    return { records: parsed, filters: csvFilterKeys };
  } catch (error) {
    showErrorMessage();
    console.error("Failed to load database:", error);
    return { records: [], filters: [] };
  }
}

function showErrorMessage() {
  const container = document.getElementById("database-cards");
  if (container) {
    container.innerHTML = '<div class="error-message">Couldn’t load data. Please try again later.</div>';
  }
  updateArticlesCount(0);
}

function splitCSVRows(text) {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }

  const rows = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (insideQuotes && text[i + 1] === '"') {
        current += '""';
        i++;
        continue;
      }

      insideQuotes = !insideQuotes;
      current += char;
      continue;
    }

    if (!insideQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }

      if (current.trim().length > 0) {
        rows.push(current);
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    rows.push(current);
  }

  return rows;
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

function buildHeaderMap(headers = []) {
  return headers.reduce((map, header, index) => {
    const trimmed = typeof header === "string" ? header.trim() : "";
    if (trimmed.length > 0) {
      map[trimmed] = index;
    }
    return map;
  }, {});
}

function getColumnValue(columns, headerMap, key) {
  if (!key || !headerMap || !Object.prototype.hasOwnProperty.call(headerMap, key)) {
    return "";
  }

  const index = headerMap[key];
  if (index === undefined || index === null) {
    return "";
  }

  return columns[index]?.trim() || "";
}

function extractFilterKeys(headerMap) {
  if (!headerMap) return [];
  const keys = Object.keys(headerMap).filter((key) => isFilterKey(key));
  return sortFilterKeys(keys);
}

function mergeFilterKeys(configKeys = [], csvKeys = []) {
  const merged = [];
  const seen = new Set();

  const addKey = (key) => {
    if (typeof key !== "string") return;
    const trimmed = key.trim();
    if (trimmed.length === 0) return;
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    merged.push(trimmed);
  };

  configKeys.forEach(addKey);

  sortFilterKeys(csvKeys).forEach((key) => {
    if (!isFilterKey(key)) return;
    addKey(key);
  });

  if (merged.length === 0) {
    Object.keys(defaultConfig.filters || {}).forEach(addKey);
  }

  return merged;
}

function ensureRecordsIncludeFilters(records, filterKeys) {
  if (!Array.isArray(records)) return [];
  const keysToUse = Array.isArray(filterKeys) ? filterKeys : [];
  return records.map((record) => {
    const normalized = { ...record };
    keysToUse.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(normalized, key)) {
        normalized[key] = "";
      }
    });
    return normalized;
  });
}

function sortFilterKeys(keys = []) {
  return keys
    .filter((key) => typeof key === "string")
    .map((key) => key.trim())
    .filter((key) => key.length > 0)
    .sort((a, b) => {
      const indexA = getFilterIndex(a);
      const indexB = getFilterIndex(b);
      if (indexA !== indexB) {
        return indexA - indexB;
      }
      return a.localeCompare(b);
    });
}

function getFilterIndex(key) {
  const match = key && key.match(/\d+/);
  return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
}

function isFilterKey(key) {
  return typeof key === "string" && /^filter\d+$/i.test(key.trim());
}

function getDefaultFilterLabel(key, index) {
  const match = typeof key === "string" ? key.match(/\d+/) : null;
  if (match) {
    return `Filter ${parseInt(match[0], 10)}`;
  }
  return `Filter ${index + 1}`;
}

function renderFilterPanels(filterKeys, labels) {
  const filtersContainer = document.querySelector(".filters");
  if (!filtersContainer) return;

  let toggleList = filtersContainer.querySelector(".filter-toggle-list");
  if (!toggleList) {
    toggleList = document.createElement("div");
    toggleList.className = "filter-toggle-list";
    filtersContainer.appendChild(toggleList);
  }
  if (!toggleList.hasAttribute("role")) {
    toggleList.setAttribute("role", "group");
    toggleList.setAttribute("aria-label", "Filter categories");
  }

  let cardGrid = filtersContainer.querySelector(".filter-card-grid");
  if (!cardGrid) {
    cardGrid = document.createElement("div");
    cardGrid.className = "filter-card-grid";
    filtersContainer.appendChild(cardGrid);
  }

  toggleList.innerHTML = "";
  cardGrid.innerHTML = "";

  filterKeys.forEach((key, index) => {
    if (typeof filterVisibility[key] === "undefined") {
      filterVisibility[key] = true;
    }

    const displayLabel = labels[key] || getDefaultFilterLabel(key, index);

    const toggleRow = document.createElement("div");
    toggleRow.className = "filter-toggle-row";
    toggleRow.dataset.filterToggleRow = key;

    const nameSpan = document.createElement("span");
    nameSpan.className = "filter-toggle-name";
    nameSpan.setAttribute("data-config-filter", key);
    nameSpan.textContent = displayLabel;

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "filter-toggle";

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = Boolean(filterVisibility[key]);
    toggle.dataset.filterToggle = key;
    toggle.setAttribute("aria-label", `Toggle ${displayLabel} filter`);

    const slider = document.createElement("span");
    slider.className = "filter-toggle-slider";

    toggleLabel.appendChild(toggle);
    toggleLabel.appendChild(slider);

    toggleRow.appendChild(nameSpan);
    toggleRow.appendChild(toggleLabel);
    toggleList.appendChild(toggleRow);

    const card = document.createElement("div");
    card.className = "filter-group filter-card";
    card.dataset.filterGroup = key;

    const heading = document.createElement("h3");
    heading.className = "filter-card-title";
    heading.setAttribute("data-config-filter", key);
    heading.textContent = displayLabel;

    const options = document.createElement("div");
    options.className = "filter-options";
    options.id = `${key}-filters`;

    card.appendChild(heading);
    card.appendChild(options);
    cardGrid.appendChild(card);

    setFilterGroupState(key, toggle.checked);

    toggle.addEventListener("change", (event) => {
      const isEnabled = event.target.checked;
      handleFilterGroupToggle(key, isEnabled);
    });
  });

  renderVenueFilterPanel(toggleList, cardGrid);
}

function renderVenueFilterPanel(toggleList, cardGrid) {
  if (!toggleList || !cardGrid) return;

  if (typeof filterVisibility[VENUE_FILTER_KEY] === "undefined") {
    filterVisibility[VENUE_FILTER_KEY] = true;
  }

  const isEnabled = Boolean(filterVisibility[VENUE_FILTER_KEY]);

  const toggleRow = document.createElement("div");
  toggleRow.className = "filter-toggle-row";
  toggleRow.dataset.filterToggleRow = VENUE_FILTER_KEY;

  const nameSpan = document.createElement("span");
  nameSpan.className = "filter-toggle-name";
  nameSpan.textContent = VENUE_FILTER_LABEL;

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "filter-toggle";

  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.checked = isEnabled;
  toggle.dataset.filterToggle = VENUE_FILTER_KEY;
  toggle.setAttribute("aria-label", `Toggle ${VENUE_FILTER_LABEL} filter`);

  const slider = document.createElement("span");
  slider.className = "filter-toggle-slider";

  toggleLabel.appendChild(toggle);
  toggleLabel.appendChild(slider);

  toggleRow.appendChild(nameSpan);
  toggleRow.appendChild(toggleLabel);
  toggleList.appendChild(toggleRow);

  const card = document.createElement("div");
  card.className = "filter-group filter-card venue-filter-card";
  card.dataset.filterGroup = VENUE_FILTER_KEY;

  const heading = document.createElement("h3");
  heading.className = "filter-card-title";
  heading.textContent = VENUE_FILTER_LABEL;

  const options = document.createElement("div");
  options.className = "filter-options";
  options.id = "venue-filter-options";
  options.setAttribute("role", "group");
  options.setAttribute("aria-label", "Filter by venue");

  card.appendChild(heading);
  card.appendChild(options);
  cardGrid.appendChild(card);

  setFilterGroupState(VENUE_FILTER_KEY, isEnabled);

  toggle.addEventListener("change", (event) => {
    const enabled = event.target.checked;
    handleFilterGroupToggle(VENUE_FILTER_KEY, enabled);
  });
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

    const sortedValues = Object.keys(counts).sort((a, b) => {
      return getDisplayTagValue(a).localeCompare(getDisplayTagValue(b));
    });

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
      const checkboxId = `${key}-${value.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
      checkbox.id = checkboxId;
      const displayValue = getDisplayTagValue(value);
      checkbox.setAttribute(
        "aria-label",
        `${headingLabel || "Filter"}: ${displayValue || value}`
      );
      checkbox.disabled = !filterVisibility[key];
      checkbox.addEventListener("change", () => {
        handleFilterChange(key, value);
      });

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.appendChild(checkbox);

      const textSpan = document.createElement("span");
      textSpan.className = "filter-option-text";
      textSpan.textContent = displayValue || value;
      label.appendChild(textSpan);

      const countSpan = document.createElement("span");
      countSpan.className = "filter-count";
      countSpan.textContent = `[${counts[value]}]`;
      label.appendChild(countSpan);

      container.appendChild(label);
    });

    scheduleFilterOptionFit(container);
  });
}

function scheduleFilterOptionFit(container) {
  if (!container) return;
  filterTextContainers.add(container);
  requestAnimationFrame(() => {
    fitFilterOptionText(container);
  });
}

function scheduleRefitAllFilterTexts() {
  if (filterTextFitScheduled) return;
  filterTextFitScheduled = true;
  requestAnimationFrame(() => {
    filterTextContainers.forEach((container) => {
      fitFilterOptionText(container);
    });
    filterTextFitScheduled = false;
  });
}

function fitFilterOptionText(container) {
  if (!container) return;

  const textNodes = container.querySelectorAll(".filter-option-text");
  textNodes.forEach((span) => {
    if (!span.dataset.baseFontSize) {
      const computedSize = parseFloat(window.getComputedStyle(span).fontSize);
      span.dataset.baseFontSize = Number.isFinite(computedSize) ? String(computedSize) : "14";
    }
    const baseFontSize = parseFloat(span.dataset.baseFontSize) || 14;
    span.style.fontSize = `${baseFontSize}px`;
  });

  textNodes.forEach((span) => {
    const label = span.closest("label");
    if (!label || label.offsetParent === null) return;

    const baseFontSize = parseFloat(span.dataset.baseFontSize) || 14;
    const minFontSize = Math.max(FILTER_OPTION_MIN_FONT_SIZE, baseFontSize - 6);
    let currentSize = baseFontSize;
    span.style.fontSize = `${currentSize}px`;

    let iteration = 0;
    while (span.scrollWidth > span.clientWidth && currentSize > minFontSize && iteration < 12) {
      currentSize -= 0.5;
      span.style.fontSize = `${currentSize}px`;
      iteration++;
    }

    if (span.scrollWidth > span.clientWidth) {
      span.title = span.textContent.trim();
    } else {
      span.removeAttribute("title");
    }
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
  updateArticlesCount(filteredData.length);

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

function updateArticlesCount(count) {
  const countElement = document.getElementById("articles-count");
  if (!countElement) return;

  countElement.textContent = `${count} articles found`;
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
  const metaLineParts = [];
  if (item.authors_abbrev) metaLineParts.push(escapeHTML(item.authors_abbrev));
  if (item.year) metaLineParts.push(escapeHTML(item.year));
  const primaryMeta = metaLineParts.join(" • ");
  const venueMeta = item.venue ? escapeHTML(item.venue) : "";
  const cardMetaParts = [];
  if (primaryMeta) {
    cardMetaParts.push(`<span class="card-meta-primary">${primaryMeta}</span>`);
  }
  if (venueMeta) {
    cardMetaParts.push(`<span class="card-meta-venue">${venueMeta}</span>`);
  }
  const cardMetaHTML = cardMetaParts.join("");

  const filterTags = createCombinedTagSection(item);

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
      <div>${cardMetaHTML ? `<p class="card-meta">${cardMetaHTML}</p>` : ""}</div>
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

function createCombinedTagSection(item) {
  const allValues = FILTER_KEYS.flatMap((key) => getItemValues(item[key]));
  const seen = new Set();
  const tags = [];

  allValues.forEach((value) => {
    const displayValue = getDisplayTagValue(value);
    if (!displayValue) return;
    const normalized = displayValue.toLowerCase();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    tags.push(displayValue);
  });

  if (tags.length === 0) return "";

  const sortedTags = tags.sort((a, b) => a.localeCompare(b));

  return `<div class="tag-container">${sortedTags
    .map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`)
    .join("")}</div>`;
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
    const isVenueFilterEnabled = filterVisibility[VENUE_FILTER_KEY] !== false;
    if (isVenueFilterEnabled && venueOptions.length > 0) {
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
      if (!filterVisibility[key]) {
        return true;
      }
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
    const groupVisible = filterVisibility[key];
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

        if (count === 0 || !groupVisible) {
          label.classList.add("disabled-filter");
        } else {
          label.classList.remove("disabled-filter");
        }

        checkbox.disabled = !groupVisible;
      });
  });

  const venueGroupVisible = filterVisibility[VENUE_FILTER_KEY] !== false;
  const venueCounts = {};
  filteredData.forEach((item) => {
    const normalizedVenue = normalizeVenue(item.venue);
    if (normalizedVenue) {
      venueCounts[normalizedVenue] = (venueCounts[normalizedVenue] || 0) + 1;
    }
  });

  const venueContainer = document.getElementById("venue-filter-options");
  if (venueContainer) {
    venueContainer.querySelectorAll("label").forEach((label) => {
      const checkbox = label.querySelector("input[type='checkbox']");
      const countSpan = label.querySelector(".filter-count");
      if (!checkbox || !countSpan) return;

      const normalizedVenue = checkbox.value.trim();
      const count = venueCounts[normalizedVenue] || 0;
      countSpan.textContent = `[${count}]`;

      if (count === 0 || !venueGroupVisible) {
        label.classList.add("disabled-filter");
      } else {
        label.classList.remove("disabled-filter");
      }

      checkbox.disabled = !venueGroupVisible;
      if (!venueGroupVisible) {
        checkbox.setAttribute("aria-disabled", "true");
      } else {
        checkbox.removeAttribute("aria-disabled");
      }
    });
  }

  scheduleRefitAllFilterTexts();
}

function handleFilterGroupToggle(key, isEnabled) {
  setFilterGroupState(key, isEnabled);

  expandedCardKey = null;
  renderCards(database, filterLabels, infoLabels);
  updateFilterCounts();
}

function setFilterGroupState(key, isEnabled) {
  const isVenueFilter = key === VENUE_FILTER_KEY;
  filterVisibility[key] = isEnabled;
  const group = document.querySelector(`.filter-group[data-filter-group='${key}']`);
  const toggleRow = document.querySelector(`.filter-toggle-row[data-filter-toggle-row='${key}']`);
  const toggleInput = document.querySelector(`.filter-toggle input[data-filter-toggle='${key}']`);

  if (toggleInput && toggleInput.checked !== isEnabled) {
    toggleInput.checked = isEnabled;
  }

  if (toggleRow) {
    toggleRow.classList.toggle("filter-toggle-row--disabled", !isEnabled);
    if (isEnabled) {
      toggleRow.removeAttribute("aria-disabled");
    } else {
      toggleRow.setAttribute("aria-disabled", "true");
    }
  }

  if (!group) return;

  group.classList.toggle("filter-group--collapsed", !isEnabled);
  if (isEnabled) {
    group.removeAttribute("hidden");
  } else {
    group.setAttribute("hidden", "true");
  }

  const optionsContainer = group.querySelector(".filter-options");
  if (optionsContainer) {
    optionsContainer.hidden = !isEnabled;
    optionsContainer.setAttribute("aria-hidden", String(!isEnabled));
  }

  if (!isVenueFilter) {
    group
      .querySelectorAll(".filter-options input[type='checkbox']")
      .forEach((checkbox) => {
        checkbox.disabled = !isEnabled;
        if (!isEnabled) {
          checkbox.checked = false;
        }
      });

    if (!isEnabled && Object.prototype.hasOwnProperty.call(activeFilters, key)) {
      activeFilters[key] = [];
    }
    scheduleRefitAllFilterTexts();
    return;
  }

  setVenueFilterEnabledState(isEnabled);
  if (!isEnabled) {
    resetVenueFilters();
  }
  scheduleRefitAllFilterTexts();
}

function initializeVenueFilters(data) {
  const venueContainer = document.getElementById("venue-filter-options");
  const venueCard = document.querySelector(`.filter-group[data-filter-group='${VENUE_FILTER_KEY}']`);
  const toggleRow = document.querySelector(`.filter-toggle-row[data-filter-toggle-row='${VENUE_FILTER_KEY}']`);
  if (!venueContainer || !Array.isArray(data)) return;

  const venueMap = new Map();
  const venueCounts = new Map();
  data.forEach((item) => {
    const label = (item?.venue || "").trim();
    if (label.length === 0) return;
    const normalized = normalizeVenue(label);
    if (!venueMap.has(normalized)) {
      venueMap.set(normalized, label);
    }
    venueCounts.set(normalized, (venueCounts.get(normalized) || 0) + 1);
  });

  venueOptions = Array.from(venueMap.entries())
    .map(([normalized, label]) => ({ normalized, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (venueOptions.length === 0) {
    venueContainer.innerHTML = "";
    activeVenues = new Set();
    venueCard?.classList.add("filter-group--empty");
    venueCard?.setAttribute("hidden", "true");
    toggleRow?.setAttribute("hidden", "true");
    return;
  }

  toggleRow?.removeAttribute("hidden");
  venueCard?.classList.remove("filter-group--empty");
  venueCard?.removeAttribute("hidden");
  venueContainer.innerHTML = "";
  activeVenues = new Set(venueOptions.map((option) => option.normalized));

  venueOptions.forEach((option) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = option.normalized;
    const checkboxId = `venue-${option.normalized.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
    checkbox.id = checkboxId;
    checkbox.checked = true;
    checkbox.dataset.venue = option.normalized;
    checkbox.setAttribute("aria-label", `${VENUE_FILTER_LABEL}: ${option.label}`);
    checkbox.addEventListener("change", (event) => {
      handleVenueCheckboxChange(option.normalized, event.target.checked);
    });

    const label = document.createElement("label");
    label.className = "venue-filter-option";
    label.htmlFor = checkboxId;
    label.appendChild(checkbox);

    const textSpan = document.createElement("span");
    textSpan.className = "filter-option-text";
    textSpan.textContent = option.label;
    label.appendChild(textSpan);

    const countSpan = document.createElement("span");
    countSpan.className = "filter-count";
    countSpan.textContent = `[${venueCounts.get(option.normalized) || 0}]`;
    label.appendChild(countSpan);

    venueContainer.appendChild(label);
  });

  const isEnabled = filterVisibility[VENUE_FILTER_KEY] !== false;
  setFilterGroupState(VENUE_FILTER_KEY, isEnabled);
  scheduleFilterOptionFit(venueContainer);
}

function resetVenueFilters() {
  activeVenues = new Set(venueOptions.map((option) => option.normalized));
  document
    .querySelectorAll("#venue-filter-options input[type='checkbox']")
    .forEach((checkbox) => {
      checkbox.checked = true;
    });
}

function setVenueFilterEnabledState(isEnabled) {
  document
    .querySelectorAll("#venue-filter-options input[type='checkbox']")
    .forEach((checkbox) => {
      checkbox.disabled = !isEnabled;
      if (isEnabled) {
        checkbox.removeAttribute("aria-disabled");
      } else {
        checkbox.setAttribute("aria-disabled", "true");
      }
    });
}

function handleVenueCheckboxChange(normalizedName, isChecked) {
  if (!normalizedName || filterVisibility[VENUE_FILTER_KEY] === false) {
    return;
  }

  if (isChecked) {
    activeVenues.add(normalizedName);
  } else {
    activeVenues.delete(normalizedName);
  }

  expandedCardKey = null;
  renderCards(database, filterLabels, infoLabels);
  debouncedUpdateFilterCounts();
}

function normalizeVenue(value) {
  return (value || "").trim().toLowerCase();
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
    filterVisibility = createDefaultFilterVisibility();

    document
      .querySelectorAll(".filter-toggle input[type='checkbox']")
      .forEach((toggle) => {
        const key = toggle.dataset.filterToggle;
        toggle.checked = true;
        setFilterGroupState(key, true);
      });

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

function buildFilterLabels(config, keys) {
  const labels = {};
  const keysToUse = Array.isArray(keys) && keys.length > 0 ? keys : FILTER_KEYS;
  keysToUse.forEach((key, index) => {
    const fallback = defaultConfig.filters[key]?.label || getDefaultFilterLabel(key, index);
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
    document.querySelectorAll(`[data-config-filter="${key}"]`).forEach((heading) => {
      heading.textContent = filterLabelsMap[key] || heading.textContent;
    });
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
