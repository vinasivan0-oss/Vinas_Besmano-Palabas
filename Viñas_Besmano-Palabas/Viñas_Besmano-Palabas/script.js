/*
"Talk is cheap. Show me the code."
—Linus Torvalds
*/

// Palabas · WS1 TV Show Search code-along (TVmaze API, no key needed)
// Open DevTools (F12): keep the Console AND the Network tab open.
// Sample or live mode: see config.js.

// ---------- Given: page elements ----------
const form = document.getElementById("searchForm");
const input = document.getElementById("query");
const statusText = document.getElementById("status");
const results = document.getElementById("results");
const dialog = document.getElementById("details");
const detailsBody = document.getElementById("detailsBody");
const closeBtn = document.getElementById("closeDetails");
const modeBadge = document.getElementById("modeBadge");

// ---------- Given: the API's URLs ----------
const API = "https://api.tvmaze.com";

// Turns "Breaking Bad" into "breaking-bad" (used for the sample-data file names)
function slug(text) {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// e.g. https://api.tvmaze.com/search/shows?q=breaking%20bad
function searchURL(query) {
  if (USE_SAMPLE_DATA) return `data/search/${slug(query)}.json`;
  return `${API}/search/shows?q=${encodeURIComponent(query)}`;
}

// e.g. https://api.tvmaze.com/shows/169
function showURL(id) {
  return USE_SAMPLE_DATA ? `data/shows/${id}.json` : `${API}/shows/${id}`;
}

// e.g. https://api.tvmaze.com/shows/169/cast
function castURL(id) {
  return USE_SAMPLE_DATA ? `data/cast/${id}.json` : `${API}/shows/${id}/cast`;
}

// e.g. https://api.tvmaze.com/shows/169/seasons
function seasonsURL(id) {
  return USE_SAMPLE_DATA ? `data/seasons/${id}.json` : `${API}/shows/${id}/seasons`;
}

// ---------- Given: helpers (no need to change) ----------

// Shows a message under the search box. type: "info", "loading" or "error"
function setStatus(message, type = "info") {
  statusText.textContent = message;
  statusText.className = "status " + type;
}

// Makes an element with an optional class and text: el("span", "year", "2008")
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// A poster <img>, or a placeholder when the show has no image (image is null)
function createPoster(show, size = "medium") {
  if (!show.image) {
    return el("span", "poster none", "No poster");
  }
  const img = el("img", "poster");
  img.src = show.image[size] || show.image.medium;
  img.alt = `Poster: ${show.name}`;
  img.loading = "lazy";
  img.addEventListener("error", () => img.replaceWith(el("span", "poster none", "No poster")));
  return img;
}

// "2008–2013", or "2016–" for a show that is still running
function yearRange(show) {
  const start = show.premiered ? show.premiered.slice(0, 4) : "?";
  const end = show.ended ? show.ended.slice(0, 4) : "";
  return `${start}–${end}`;
}

// TVmaze summaries contain HTML like "<p><b>Friends</b> follows…</p>".
// This keeps only the text. (Never put text from an API into innerHTML:
// if it contained a <script> or an onerror, it could run on your page.)
function stripTags(html) {
  if (!html) return "No summary yet.";
  return new DOMParser().parseFromString(html, "text/html").body.textContent;
}

// Close the details pop-up (Step 4) with the × button or by clicking outside it
closeBtn.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

// Show which mode we're in
modeBadge.textContent = USE_SAMPLE_DATA ? "Sample data" : "Live · TVmaze";
modeBadge.classList.toggle("live", !USE_SAMPLE_DATA);




// STEP 1 — Your first API request
// TODO: async function testRequest(): fetch searchURL("friends"), log the status and the JSON array

// STEP 2 — Search and show the results
// TODO: renderResults(items), searchShows(query), and a submit listener on the form
function renderResults(items) {
  results.innerHTML = "";
  items.forEach((item) => {
    const show = item.show;   // This is for to get the show’s data out of the search result so the rest of the code can use it easily.
    const card = el("button", "card");
    card.type = "button";
    card.dataset.id = show.id;  // This is to remembers which show each card belongs to, so a click on the card can tell you which show was picked.

    const rating = show.rating.average;
    card.append(
      createPoster(show),
      el("span", "title", show.name),   // To display the show name
      el("span", "year", yearRange(show)),
      el("span", "genres", show.genres.join(", ")),   // It show the list of genre into a readable sentence like text and put like this (, ) to separate the genre
      el("span", "rating", rating ? `★ ${rating}` : "Not rated yet")
    );
    results.appendChild(card);
  });
}

async function searchShows(query) {
  const response = await fetch(searchURL(query));
  const data = await response.json();
  renderResults(data);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();     //
  const query = input.value.trim();     //
  if (query === "") return;
  searchShows(query);
});


// STEP 3 — getJSON(): one careful helper for every request
// TODO: catch network errors, check 429 and response.ok; rewrite searchShows with try / catch and an empty-array check
async function getJSON(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (networkError) {
    throw new Error("Can't reach TVmaze. Check your internet, or use sample mode.");
  }
  if (response.status === 429) {    // This is the status code for to many requests
    throw new Error("Too many requests (429). Wait 10 seconds and try again.");
  }
  if (!response.ok) {     // This for if not response then false it well show an error message and if it well response its true
    throw new Error(`Request failed (HTTP ${response.status}).`);
  }
  return response.json();
}

async function searchShows(query) {
  setStatus(`Searching for "${query}"…`, "loading");    //  This is a message to display a loading for the search
  results.innerHTML = "";
  try {   // Its like run this code. If everything goes fine and the risky code will put here
    const data = await getJSON(searchURL(query));
    if (data.length === 0) {
      setStatus(`No shows found for "${query}".`, "error");
      return;
    }
    renderResults(data);
    setStatus(`${data.length} ${data.length === 1 ? "show" : "shows"} found for "${query}"`);
  } catch (error) {     // And this is to what to do if the risky code fail
    setStatus(error.message, "error");
  }
}

// STEP 4 — Click a show to see its details
// TODO: one click listener on #results, showDetails(id), renderDetails(show)
results.addEventListener("click", (event) => {
  const card = event.target.closest(".card");   // This is when you click a card, you might actually click the picture or the title inside it
  if (card) showDetails(card.dataset.id);   //  every card remembers its show’s id This reads that id back, so the code knows which show you clicked in short the identification
});

async function showDetails(id) {
  detailsBody.replaceChildren(el("p", "status loading", "Loading details…"));
  dialog.showModal();   // In this line the showModal well open the popup window. It opens right away with “Loading details…” so you see something happening
  try {
    const show = await getJSON(showURL(id));    // This is to like you click a card, the code finds the card, reads its id, opens a popup, and loads that show’s details inside it
    renderDetails(show);
  } catch (error) {
    detailsBody.replaceChildren(el("p", "status error", error.message));
  }
}
function renderDetails(show) {
  const where = show.network ? show.network.name : show.webChannel ? show.webChannel.name : "";
  const minutes = show.runtime || show.averageRuntime; // runtime is null when episodes vary

  const info = el("div", "info");
  info.append(
    el("h2", "", show.name),
    el("p", "meta", [yearRange(show), where, show.genres.join(", "), minutes ? `${minutes} min` : ""].filter(Boolean).join(" · ")),
    el("p", "score", show.rating.average ? `★ ${show.rating.average} / 10` : "Not rated yet"),
    el("p", "plot", stripTags(show.summary)) // text only, never innerHTML
  );

  const links = el("p", "links");
  const tvmaze = el("a", "", "View on TVmaze ↗");
  tvmaze.href = show.url;
  tvmaze.target = "_blank";
  links.append(tvmaze);
  info.append(links);

  detailsBody.replaceChildren(createPoster(show, "original"), info);
}


// STEP 5 — Promise.all: show + cast + seasons at the same time
// TODO: rewrite showDetails with Promise.all, and renderDetails(show, cast, seasons)

async function showDetails(id) {
  detailsBody.replaceChildren(el("p", "status loading", "Loading details…"));
  dialog.showModal();

  try {
    const start = performance.now();
    // Start all three requests now, then wait for ALL of them
    const [show, cast, seasons] = await Promise.all([   // This starts all three requests at the same time and waits until they are all done. It’s faster than doing them one after another
      getJSON(showURL(id)),
      getJSON(castURL(id)),   // And his builds the web address for the show’s cast list. The result goes into cast
      getJSON(seasonsURL(id)),    // This builds the web address for the show’s seasons. The result goes into seasons
    ]);
    console.log(`3 requests in ${Math.round(performance.now() - start)} ms`);
    renderDetails(show, cast, seasons);
  } catch (error) {
    // If ANY of the three fails, Promise.all rejects and we land here
    detailsBody.replaceChildren(el("p", "status error", error.message));
  }
}

function renderDetails(show, cast, seasons) {
  const where = show.network ? show.network.name : show.webChannel ? show.webChannel.name : "";
  const minutes = show.runtime || show.averageRuntime; // runtime is null when episodes vary
  const seasonText = seasons.length === 1 ? "1 season" : `${seasons.length} seasons`;

  const info = el("div", "info");
  info.append(
    el("h2", "", show.name),
    el("p", "meta", [yearRange(show), where, seasonText, minutes ? `${minutes} min` : ""].filter(Boolean).join(" · ")),
    el("p", "meta", show.genres.join(", ")),
    el("p", "score", show.rating.average ? `★ ${show.rating.average} / 10` : "Not rated yet"),
    el("p", "plot", stripTags(show.summary)) // text only, never innerHTML
  );

  // The first 6 cast members: "Bryan Cranston as Walter White"
  if (cast.length > 0) {
    const list = el("ul", "cast");
    cast.slice(0, 6).forEach((member) => {
      const li = el("li", "", member.person.name + " ");    //  This is the real actor’s name
      li.append(el("span", "", "as " + member.character.name));   //  This is the role the actor plays
      list.append(li);
    });
    info.append(el("h3", "", "Cast"), list);
  }

  const links = el("p", "links");
  const tvmaze = el("a", "", "View on TVmaze ↗");
  tvmaze.href = show.url;
  tvmaze.target = "_blank";
  links.append(tvmaze);
  info.append(links);

  detailsBody.replaceChildren(createPoster(show, "original"), info);
}


// Added  one feature

// Select the new sort button
const sortBtn = document.querySelector("#sortBtn");

// Stores the current search results so they can be sorted without re-fetching
let currentItems = [];

// Update your existing searchShows function to save the data
async function searchShows(query) {
  setStatus(`Searching for "${query}"…`, "loading");
  results.innerHTML = "";
  currentItems = []; // Reset on new search

  try {
    const data = await getJSON(searchURL(query));
    if (data.length === 0) {
      setStatus(`No shows found for "${query}".`, "error");
      return;
    }
    
    currentItems = data; // Save the results
    renderResults(currentItems);
    setStatus(`${data.length} ${data.length === 1 ? "show" : "shows"} found for "${query}".`);
  } catch (error) {
    setStatus(error.message, "error");
  }
}

// Reorders the currently displayed show cards from highest to lowest rating
function sortByRating() {
  if (currentItems.length === 0) return;

  // Create a copy with [...currentItems] so we don't mutate the original order permanently
  const sorted = [...currentItems].sort((a, b) => {
    // Treat null/missing ratings as -1 so they always go to the bottom
    const ratingA = a.show.rating.average ?? -1;
    const ratingB = b.show.rating.average ?? -1;
    return ratingB - ratingA;
  });

  renderResults(sorted);
}

// Listen for clicks on the sort button
sortBtn.addEventListener("click", sortByRating);