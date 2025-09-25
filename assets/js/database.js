const defaultConfig = {
  site: {
    pageTitle: "Medical Specialty Camp Literature Database",
    heroHeading: "Medical Specialty Camp Literature Database",
    submitButtonText: "Submit an Article",
    submitButtonLink: "https://forms.gle/42GckNJQ4EVMdHDr7"
  },
  filters: {
    focus: { label: "Focus" },
    medical: { label: "Medical Population" },
    findings: { label: "Findings" }
  },
  sidebar: {
    name: "Jonathan Gerth",
    email: "jonathan.gerth@yahoo.com",
    profileImage: "assets/img/profile_headshot.png",
    socials: [
      {
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/jonathan-gerth-4010b2318/",
        icon: "assets/img/icons/icon_linkedin.png"
      },
      {
        label: "Google Scholar",
        url: "https://scholar.google.com/citations?user=AAXLevAAAAAJ&hl=en",
        icon: "assets/img/icons/icon_gscholar.png"
      }
    ]
  },
  branding: {
    favicon: "assets/uploads/signpost-2.svg"
  }
};

let appConfig = cloneObject(defaultConfig);

document.addEventListener("DOMContentLoaded", async function () {
  let database = [];
  let filters = {
    focus_cat: [],
    medical_cat: [],
    outcome_cat: []
  };
  let filterLabels = {};

  await loadConfig();
  filterLabels = buildFilterLabels(appConfig);
  applyConfig(appConfig, filterLabels);

  await loadDatabase();

  async function loadDatabase() {
    try {
      const response = await fetch("assets/database.csv");
      if (!response.ok) throw new Error("Network response was not ok");
      const text = await response.text();

      const utf8decoder = new TextDecoder("utf-8");
      const decodedText = utf8decoder.decode(new TextEncoder().encode(text));

      const rows = decodedText.trim().split("\n").slice(1);

      database = rows
        .map((row) => {
          const columns = parseCSVRow(row);
          if (columns.length < 14) return null;

          return {
            year: columns[0].trim(),
            authors: decodeEntities(columns[1].trim()),
            title: decodeEntities(columns[2].trim()),
            focus_cat: decodeEntities(columns[3].trim()),
            medical_cat: decodeEntities(columns[4].trim()),
            outcome_cat: decodeEntities(columns[5].trim()),
            doi_link: columns[6].trim(),
            camp_type: decodeEntities(columns[7]?.trim() || ""),
            method: decodeEntities(columns[8]?.trim() || ""),
            participant_details: decodeEntities(columns[9]?.trim() || ""),
            finding1: decodeEntities(columns[10]?.trim() || ""),
            finding2: decodeEntities(columns[11]?.trim() || ""),
            finding3: decodeEntities(columns[12]?.trim() || ""),
            finding4: decodeEntities(columns[13]?.trim() || ""),
            finding5: decodeEntities(columns[14]?.trim() || "")
          };
        })
        .filter((item) => item !== null);

      generateFilters();
      displayCards();
    } catch (error) {
      const container = document.getElementById("database-cards");
      if (container) {
        container.innerHTML =
          '<div class="error-message">Couldn’t load data. Please try again later.</div>';
      }
      console.error("Failed to load database:", error);
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

  function generateFilters() {
    const categories = ["focus_cat", "medical_cat", "outcome_cat"];

    categories.forEach((category) => {
      const container = document.getElementById(`${category}-filters`);
      if (!container) return;

      container.innerHTML = "";
      const filterCounts = {};

      database.forEach((item) => {
        if (item[category]) {
          const values = item[category].split(";").map((value) => value.trim());
          values.forEach((value) => {
            filterCounts[value] = (filterCounts[value] || 0) + 1;
          });
        }
      });

      const sortedValues = Object.keys(filterCounts).sort();
      if (sortedValues.length === 0) {
        container.innerHTML = "<p>No options available.</p>";
        return;
      }

      const categoryLabel = filterLabels[category] || formatCategoryName(category);

      sortedValues.forEach((value) => {
        const count = filterCounts[value];
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = value;
        checkbox.id = `${category}-${value.replace(/\s+/g, "-").toLowerCase()}`;
        checkbox.setAttribute(
          "aria-label",
          `${categoryLabel}: ${value}`
        );
        checkbox.addEventListener("change", () => {
          updateFilters(category, value);
          debouncedUpdateFilterCounts();
        });

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.appendChild(checkbox);

        const textSpan = document.createElement("span");
        textSpan.textContent = ` ${value} `;

        const countSpan = document.createElement("span");
        countSpan.className = "filter-count";
        countSpan.textContent = `[${count}]`;

        label.appendChild(textSpan);
        label.appendChild(countSpan);
        container.appendChild(label);
      });
    });
  }

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const debouncedUpdateFilterCounts = debounce(updateFilterCounts, 100);

  function updateFilterCounts() {
    const categories = ["focus_cat", "medical_cat", "outcome_cat"];
    const filteredData = getFilteredData();

    categories.forEach((category) => {
      const filterCounts = {};

      filteredData.forEach((item) => {
        if (item[category]) {
          const values = item[category].split(";").map((value) => value.trim());
          values.forEach((value) => {
            filterCounts[value] = (filterCounts[value] || 0) + 1;
          });
        }
      });

      document
        .querySelectorAll(`#${category}-filters label`)
        .forEach((label) => {
          const checkbox = label.querySelector("input[type='checkbox']");
          const countSpan = label.querySelector(".filter-count");
          const filterValue = checkbox.value.trim();

          const count = filterCounts[filterValue] || 0;
          countSpan.textContent = `[${count}]`;

          if (count === 0) {
            label.classList.add("disabled-filter");
          } else {
            label.classList.remove("disabled-filter");
          }
        });
    });
  }

  function updateFilters(category, value) {
    const index = filters[category].indexOf(value);
    if (index > -1) {
      filters[category].splice(index, 1);
    } else {
      filters[category].push(value);
    }
    displayCards();
    debouncedUpdateFilterCounts();
  }

  function getFilteredData() {
    return database.filter((item) => {
      const focusCat = item.focus_cat
        ? item.focus_cat.split(";").map((v) => v.trim())
        : [];
      const medicalCat = item.medical_cat
        ? item.medical_cat.split(";").map((v) => v.trim())
        : [];
      const outcomeCat = item.outcome_cat
        ? item.outcome_cat.split(";").map((v) => v.trim())
        : [];

      return (
        (filters.focus_cat.length === 0 ||
          filters.focus_cat.some((filter) => focusCat.includes(filter))) &&
        (filters.medical_cat.length === 0 ||
          filters.medical_cat.some((filter) => medicalCat.includes(filter))) &&
        (filters.outcome_cat.length === 0 ||
          filters.outcome_cat.some((filter) => outcomeCat.includes(filter)))
      );
    });
  }

  function displayCards() {
    const container = document.getElementById("database-cards");
    if (!container) return;

    container.innerHTML = "";

    const filteredData = database.filter((item) => {
      return (
        (filters.focus_cat.length === 0 ||
          filters.focus_cat.some((filter) =>
            item.focus_cat.toLowerCase().includes(filter.toLowerCase().trim())
          )) &&
        (filters.medical_cat.length === 0 ||
          filters.medical_cat.some((filter) =>
            item.medical_cat.toLowerCase().includes(filter.toLowerCase().trim())
          )) &&
        (filters.outcome_cat.length === 0 ||
          filters.outcome_cat.some((filter) =>
            item.outcome_cat.toLowerCase().includes(filter.toLowerCase().trim())
          ))
      );
    });

    const fragment = document.createDocumentFragment();
    let expandedIdx = null;
    const prevExpanded = document.querySelector(".database-card.card-expanded");
    if (prevExpanded) {
      expandedIdx = parseInt(prevExpanded.getAttribute("data-card-idx"), 10);
    }

    const focusLabel = filterLabels.focus_cat;
    const medicalLabel = filterLabels.medical_cat;
    const outcomeLabel = filterLabels.outcome_cat;

    const cardElements = filteredData.map((item, idx) => {
      const doiURL = item.doi_link.trim();
      const hasDOI = doiURL !== "" && doiURL !== "-" && /^https?:\/\//.test(doiURL);

      const card = document.createElement("div");
      card.className = "database-card";
      card.setAttribute("data-card-idx", idx);
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Access paper: ${item.title}`);

      if (expandedIdx === idx) {
        card.classList.add("card-expanded");
      }

      card.addEventListener("click", function (e) {
        if (e.target.classList.contains("doi-flag")) return;
        document.querySelectorAll(".database-card.card-expanded").forEach((el) => {
          if (el !== card) el.classList.remove("card-expanded");
        });
        const isExpanding = !card.classList.contains("card-expanded");
        card.classList.toggle("card-expanded");
        if (isExpanding) {
          displayCardsWithExpanded(idx);
        }
        showHideExpanded();
      });

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          card.click();
          e.preventDefault();
        }
      });

      const createTagSection = (label, values) => {
        if (!label || !values || values.trim() === "" || values.trim() === "-") return "";
        const tagsArray = values
          .split(";")
          .map((value) => `<span class="tag">${value.trim()}</span>`)
          .join("");
        return `
                <div class="tag-section">
                    <div class="tag-heading">${label}:</div>
                    <div class="tag-container">${tagsArray}</div>
                </div>
            `;
      };

      const participantTags = createTagSection(focusLabel, item.focus_cat);
      const medicalTags = createTagSection(medicalLabel, item.medical_cat);
      const outcomeTags = createTagSection(outcomeLabel, item.outcome_cat);

      const tagSectionHTML =
        participantTags || medicalTags || outcomeTags
          ? `<div class="card-tags">${participantTags}${medicalTags}${outcomeTags}</div>`
          : "";

      const cleanTitle = item.title.replace(/^"(.*)"$/, "$1");

      const createDetailTagSection = (heading, value) => {
        if (!value || value.trim() === "" || value.trim() === "-") return "";
        return `
          <div class="tag-section">
            <div class="detail-heading">${heading}</div>
            <div class="tag-container">${value.trim()}</div>
          </div>
        `;
      };

      const createDetailFindingsSection = (heading, ...findings) => {
        const validFindings = findings.filter((f) => f && f.trim() && f.trim() !== "-");
        if (validFindings.length === 0) return "";
        return `
          <div class="tag-section findings-list">
            <div class="detail-heading">${heading}</div>
            <div class="tag-container">
              ${validFindings.map((f) => `&#8226; ${f.trim()}`).join("<br>")}
            </div>
          </div>
        `;
      };

      const detailContext = createDetailTagSection("Context:", item.camp_type);
      const detailMethod = createDetailTagSection("Method:", item.method);
      const detailParticipants = createDetailTagSection("Participants:", item.participant_details);
      const detailFindings = createDetailFindingsSection(
        outcomeLabel ? `${outcomeLabel}:` : "Findings:",
        item.finding1,
        item.finding2,
        item.finding3,
        item.finding4,
        item.finding5
      );

      let expandedDetails = "";
      if (detailContext || detailMethod || detailParticipants || detailFindings) {
        expandedDetails = `
          <div class="expanded-details" style="display:none;">
            <div class="detail-value">
              ${detailContext}
              ${detailMethod}
              ${detailParticipants}
              ${detailFindings}
            </div>
          </div>
        `;
      }

      card.innerHTML = `
            <div class="card-header">
                <div><p class="authors-year">${item.authors}, ${item.year}</p></div>
                ${hasDOI ? `<div class="doi-flag" tabindex="0" role="button" aria-label="Open paper in new tab">Access Paper</div>` : ""}
            </div>
            <div class="card-title">${cleanTitle}</div>
            ${tagSectionHTML}
            ${expandedDetails}
        `;

      const showHideExpanded = () => {
        const details = card.querySelector(".expanded-details");
        if (details) {
          details.style.display = card.classList.contains("card-expanded") ? "block" : "none";
        }
      };

      showHideExpanded();

      if (hasDOI) {
        const doiFlag = card.querySelector(".doi-flag");
        if (doiFlag) {
          doiFlag.addEventListener("click", (e) => {
            e.stopPropagation();
            window.open(doiURL, "_blank");
          });
          doiFlag.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              window.open(doiURL, "_blank");
            }
          });
        }
      }

      return card;
    });

    function displayCardsWithExpanded(expandedIdx) {
      container.innerHTML = "";
      const cardsPerRow = getCardsPerRow();
      if (expandedIdx < cardsPerRow && expandedIdx > 0) {
        const before = cardElements.slice(0, expandedIdx);
        const expanded = cardElements[expandedIdx];
        const after = cardElements.slice(expandedIdx + 1);
        container.appendChild(expanded);
        before.forEach((card) => container.appendChild(card));
        after.forEach((card) => container.appendChild(card));
      } else {
        cardElements.forEach((card) => container.appendChild(card));
      }
    }

    function getCardsPerRow() {
      const minCardWidth = 250;
      const gap = 24;
      const containerWidth = container.clientWidth || window.innerWidth;
      return Math.max(1, Math.floor((containerWidth + gap) / (minCardWidth + gap)));
    }

    if (
      expandedIdx !== null &&
      expandedIdx !== undefined &&
      document.querySelector(".database-card.card-expanded")
    ) {
      displayCardsWithExpanded(expandedIdx);
    } else {
      cardElements.forEach((card) => fragment.appendChild(card));
      container.appendChild(fragment);
    }
  }

  const resetFiltersButton = document.getElementById("reset-filters");
  if (resetFiltersButton) {
    resetFiltersButton.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-options input[type='checkbox']")
        .forEach((checkbox) => {
          checkbox.checked = false;
        });

      document.querySelectorAll(".filter-options select").forEach((select) => {
        select.selectedIndex = 0;
      });

      filters = { focus_cat: [], medical_cat: [], outcome_cat: [] };
      displayCards();
      updateFilterCounts();
    });
  }

  const toggle = document.querySelector(".header-toggle");
  const header = document.querySelector(".header");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      header.classList.toggle("header-show");
      document.body.classList.toggle("menu-open");
    });
  }

  const toggleButton = document.getElementById("toggle-filters");
  const filtersSection = document.querySelector(".filters");
  if (toggleButton && filtersSection) {
    toggleButton.addEventListener("click", function () {
      const isCollapsed = filtersSection.classList.toggle("collapsed");
      if (isCollapsed) {
        toggleButton.innerHTML = '<i id="arrow-icon" class="bi bi-arrow-down"></i> Show Filters';
      } else {
        toggleButton.innerHTML = '<i id="arrow-icon" class="bi bi-arrow-up"></i> Hide Filters';
      }
    });
  }
});

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
  const focusLabel = getFilterLabel(config, "focus", defaultConfig.filters.focus.label);
  const medicalLabel = getFilterLabel(config, "medical", defaultConfig.filters.medical.label);
  const findingsLabel = getFilterLabel(config, "findings", defaultConfig.filters.findings.label);

  return {
    focus_cat: focusLabel,
    medical_cat: medicalLabel,
    outcome_cat: findingsLabel
  };
}

function getFilterLabel(config, key, fallback) {
  const override = config?.filters?.[key]?.label;
  if (typeof override === "string" && override.trim().length > 0) {
    return override.trim();
  }
  return fallback;
}

function applyConfig(config, filterLabels) {
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

  if (filterLabels) {
    const headingMap = {
      focus: filterLabels.focus_cat,
      medical: filterLabels.medical_cat,
      findings: filterLabels.outcome_cat
    };

    Object.keys(headingMap).forEach((key) => {
      const heading = document.querySelector(`[data-config-filter="${key}"]`);
      if (heading && headingMap[key]) {
        heading.textContent = headingMap[key];
      }
    });
  }

  const faviconLink = document.querySelector("link[rel='icon']");
  const faviconPath = config?.branding?.favicon || defaultConfig.branding.favicon;
  if (faviconLink && faviconPath) {
    faviconLink.setAttribute("href", faviconPath);
  }

  const sitename = document.querySelector(".sitename");
  const sidebarName = config?.sidebar?.name || defaultConfig.sidebar.name;
  if (sitename && sidebarName) {
    sitename.textContent = sidebarName;
  }

  const profileImg = document.querySelector(".profile-img img");
  const profileSrc = config?.sidebar?.profileImage || defaultConfig.sidebar.profileImage;
  if (profileImg && profileSrc) {
    profileImg.setAttribute("src", profileSrc);
  }

  const emailTarget = document.querySelector(".contact-container strong");
  const sidebarEmail = config?.sidebar?.email || defaultConfig.sidebar.email;
  if (emailTarget) {
    emailTarget.textContent = sidebarEmail;
  }

  const socialLinksContainer = document.querySelector(".social-links");
  if (socialLinksContainer) {
    const socials = Array.isArray(config?.sidebar?.socials)
      ? config.sidebar.socials
      : [];

    socialLinksContainer.innerHTML = "";

    if (socials.length === 0) {
      socialLinksContainer.style.display = "none";
    } else {
      socialLinksContainer.style.display = "";
      socials.forEach((social, index) => {
        if (!social || !social.url) return;

        const link = document.createElement("a");
        link.href = social.url;
        link.className = "social-button";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute(
          "aria-label",
          social.label || `Social link ${index + 1}`
        );

        if (social.icon) {
          const img = document.createElement("img");
          img.src = social.icon;
          img.alt = social.label ? `${social.label} Icon` : "Social icon";
          img.className = "social-icon";
          link.appendChild(img);
        } else {
          link.textContent = social.label || social.url;
        }

        socialLinksContainer.appendChild(link);
      });
    }
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

function formatCategoryName(key) {
  const cleaned = key.replace("_cat", "").replace(/_/g, " ").trim();
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function decodeEntities(encodedString) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = encodedString;
  return textarea.value;
}
