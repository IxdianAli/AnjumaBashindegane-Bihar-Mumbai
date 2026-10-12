const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const impactStatus = document.querySelector("#impact-data-status");
const eventsList = document.querySelector("#events-list");

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    navigation.classList.toggle("is-open", !isExpanded);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      menuToggle.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    }
  });
}

document.querySelector("#current-year").textContent = new Date().getFullYear();

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error("The published sheet contains an unclosed CSV quote.");

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function parseEventDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) {
    return null;
  }
  return date;
}

function safeWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function updateCommitteeMembers(entries, warnings) {
  const committeeGrid = document.querySelector(".committee-grid");
  const cards = new Map(
    [...committeeGrid.querySelectorAll("[data-member-key]")].map((card) => [card.dataset.memberKey, card]),
  );

  entries
    .filter((entry) => entry.type.toLowerCase() === "member")
    .forEach((entry) => {
      if (!/^[a-z0-9][a-z0-9-]*$/i.test(entry.key)) {
        warnings.push(`Committee member "${entry.title || "untitled"}" needs a key made of letters, numbers and hyphens.`);
        return;
      }

      let card = cards.get(entry.key);
      if (entry.status.toLowerCase() === "draft") {
        if (card) card.hidden = true;
        return;
      }

      if (!card) {
        if (!entry.title || !entry.role || entry.status.toLowerCase() !== "published") {
          warnings.push(`New committee member "${entry.title || entry.key}" needs a name, role and published status.`);
          return;
        }

        card = document.createElement("details");
        card.className = "member-card";
        card.dataset.memberKey = entry.key;
        const summary = document.createElement("summary");
        summary.className = "member-trigger";
        const avatar = document.createElement("div");
        avatar.className = "member-avatar avatar-green";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = entry.title.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
        const identity = document.createElement("div");
        const name = document.createElement("h3");
        const role = document.createElement("p");
        identity.append(name, role);
        const arrow = document.createElement("span");
        arrow.className = "member-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "+";
        summary.append(avatar, identity, arrow);
        const bio = document.createElement("div");
        bio.className = "member-bio";
        card.append(summary, bio);
        committeeGrid.append(card);
        cards.set(entry.key, card);
      } else {
        card.hidden = false;
      }

      const name = card.querySelector(".member-trigger h3");
      const role = card.querySelector(".member-trigger p");
      if (entry.title) name.textContent = entry.title;
      if (entry.role) role.textContent = entry.role;

      if (entry.details) {
        let description = card.querySelector(".member-bio > p:not(.bio-urdu):not(.member-education)");
        if (!description) {
          description = document.createElement("p");
          card.querySelector(".member-bio").prepend(description);
        }
        description.textContent = entry.details;
      }

      if (entry.urdu) {
        let urdu = card.querySelector(".member-bio .bio-urdu");
        if (!urdu) {
          urdu = document.createElement("p");
          urdu.className = "bio-urdu";
          urdu.lang = "ur";
          urdu.dir = "rtl";
          card.querySelector(".member-bio").append(urdu);
        }
        urdu.textContent = entry.urdu;
      }

      if (entry.education) {
        let education = card.querySelector(".member-education");
        if (!education) {
          education = document.createElement("p");
          education.className = "member-education";
          card.querySelector(".member-bio").append(education);
        }
        education.textContent = entry.education;
      }

      if (entry.image) {
        const imageUrl = safeWebUrl(entry.image);
        if (!imageUrl || !imageUrl.startsWith("https://")) {
          warnings.push(`The photo for "${entry.title || entry.key}" must use a valid HTTPS image URL.`);
        } else {
          const avatar = card.querySelector(".member-avatar");
          const image = document.createElement("img");
          image.className = "member-avatar member-photo";
          image.src = imageUrl;
          image.alt = entry.title || entry.key;
          avatar.replaceWith(image);
        }
      }
      const memberImage = card.querySelector(".member-photo");
      if (memberImage && entry.title) memberImage.alt = entry.title;

      if (entry.link) {
        const profileUrl = safeWebUrl(entry.link);
        if (!profileUrl) {
          warnings.push(`The profile link for "${entry.title || entry.key}" must use HTTP or HTTPS.`);
        } else {
          let profileLink = card.querySelector(".member-profile-link");
          if (!profileLink) {
            profileLink = document.createElement("a");
            profileLink.className = "member-profile-link";
            profileLink.target = "_blank";
            profileLink.rel = "noopener noreferrer";
            profileLink.textContent = "Profile link ↗";
            card.querySelector(".member-bio").append(profileLink);
          }
          profileLink.href = profileUrl;
        }
      }
    });
}

function makeEventCard(event) {
  const article = document.createElement("article");
  article.className = "event-card";

  const date = document.createElement("p");
  date.className = "event-date";
  const formattedDate = event.date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  date.textContent = `${event.type === "session" ? "Open session" : "Community event"} · ${formattedDate}`;
  article.append(date);

  const title = document.createElement("h3");
  title.textContent = event.title;
  article.append(title);

  if (event.details) {
    const details = document.createElement("p");
    details.className = "event-details";
    details.textContent = event.details;
    article.append(details);
  }

  if (event.link) {
    const anchor = document.createElement("a");
    anchor.className = "event-link";
    anchor.href = event.link;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = "Event details ↗";
    article.append(anchor);
  }

  return article;
}

async function loadCommitteeUpdates() {
  const csvUrl = window.ANJUMAN_DATA_CSV_URL;
  if (!csvUrl) return;

  try {
    const response = await fetch(csvUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`The shared sheet returned HTTP ${response.status}.`);

    const rows = parseCsv(await response.text());
    if (rows.length === 0) throw new Error("The published sheet is empty.");

    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const requiredHeaders = ["type", "key", "value", "title", "date", "details", "link", "status"];
    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
    if (missingHeaders.length > 0) {
      throw new Error(`The sheet is missing these columns: ${missingHeaders.join(", ")}.`);
    }

    const entries = rows.slice(1).map((values) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = (values[index] || "").trim();
      });
      return entry;
    });
    const warnings = [];
    updateCommitteeMembers(entries, warnings);

    document.querySelectorAll("[data-impact-key]").forEach((element) => {
      const entry = entries.find((item) => item.type.toLowerCase() === "counter" && item.key.toLowerCase() === element.dataset.impactKey);
      if (!entry || entry.value === "") return;

      const count = Number(entry.value);
      if (!Number.isSafeInteger(count) || count < 0) {
        warnings.push(`The ${entry.key} counter must be a non-negative whole number.`);
        return;
      }
      element.textContent = new Intl.NumberFormat("en-IN").format(count);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = entries
      .filter((entry) => ["event", "session"].includes(entry.type.toLowerCase()) && entry.status.toLowerCase() === "published")
      .map((entry) => {
        const date = parseEventDate(entry.date);
        if (!entry.title || !date) {
          warnings.push(`Published event "${entry.title || entry.key || "untitled"}" needs a title and a valid YYYY-MM-DD date.`);
          return null;
        }
        const link = entry.link ? safeWebUrl(entry.link) : "";
        if (entry.link && !link) {
          warnings.push(`The link for "${entry.title}" must be a valid HTTP or HTTPS URL.`);
        }
        return { type: entry.type.toLowerCase(), title: entry.title, date, details: entry.details, link };
      })
      .filter((event) => event && event.date >= today)
      .sort((first, second) => first.date - second.date);

    eventsList.replaceChildren();
    if (events.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "events-empty";
      emptyMessage.textContent = "No upcoming events have been announced yet.";
      eventsList.append(emptyMessage);
    } else {
      events.forEach((event) => eventsList.append(makeEventCard(event)));
    }

    impactStatus.textContent = warnings.length
      ? `Committee updates loaded, but please check the sheet: ${warnings.join(" ")}`
      : "Impact figures and upcoming events are up to date with the committee's shared sheet.";
  } catch (error) {
    console.error("Unable to load the committee's published website updates.", error);
    impactStatus.textContent = "Committee updates could not be loaded. Please check the published sheet link and its column headings.";
  }
}

loadCommitteeUpdates();
