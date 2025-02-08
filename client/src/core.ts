import { ParseCitations, CitationInformation } from "@/logic/pdf-parser";
import { searchPaperByTitle } from "@/logic/api";
import { CitationMetadata } from "@/types";
import {
  createAuthorsIcon,
  createCalendarIcon,
  createConferenceIcon,
  createDarkGreyInterrogationPoint,
  createDefaultText,
  createGreenCheckmark,
  createRedCross,
  createTitleIcon,
} from "@/ui-elements";

const itemsSection = document.getElementById("itemsSection") as HTMLDivElement;

const citationMap: Map<number, CitationEntry> = new Map<number, CitationEntry>();

const activeFilters: Set<string> = new Set();

type CitationEntry = {
  id: number;
  info: CitationInformation;
  state: CitationState;
  metadata: CitationMetadata | null;
  li: HTMLLIElement;
};

enum CitationState {
  Querying = "querying",
  Error = "request-with-error",
  NotFound = "paper-not-found",
  Success = "paper-found",
}

export async function processPdfFile(file: File) {
  setupCitationsPanel();

  // Then we parse the PDF file and obtain the list of references
  // With these references, we then add the entries to the DOM
  // In this initial state, each entry will have the "unverified" state
  const citations = await ParseCitations(file);

  if (typeof citations === "string") {
    console.log(citations);
    return;
  }

  for (let i = 0; i < citations.length; i++) {
    addCitationToDom(citations[i], i + 1);
  }

  for (let i = 0; i < citations.length; i++) {
    // Need to wait some time between requests
    await sleep(100);
    await updateCitationBasedOnApiResult(citations[i], i + 1);
  }

  updateSummaryDiv();

  // Afterwards, we check if each citation actually exists.
}

function setupCitationsPanel() {
  // First we clean up the existing citations
  itemsSection.innerHTML = "";
  activeFilters.clear();
  citationMap.clear();

  const summaryDiv = document.createElement("div");
  summaryDiv.className = "h-20 shadow-md border-2 border border-gray-400 bg-gray-300";
  summaryDiv.id = "summaryDivId";
  const summaryDescription = document.createElement("span");

  summaryDescription.className = "text-gray-700 w-40 text-center";
  summaryDescription.textContent = "Calculating summary...";
  summaryDiv.appendChild(summaryDescription);

  const itemsList = document.createElement("ul");

  itemsList.id = "itemsList";
  itemsList.className = "divide-y divide-gray-200 overflow-y-auto max-h-[calc(100vh-350px)]";

  itemsSection.appendChild(summaryDiv);
  itemsSection.appendChild(itemsList);
}

function updateSummaryDiv() {
  const papersFoundNumber = Array.from(
    citationMap.values().filter((entry) => entry.state == CitationState.Success),
  ).length;
  const papersNotFound = citationMap.size - papersFoundNumber;

  const reportDiv = document.createElement("div");
  reportDiv.className = "w-50 h-full border-2 border-blue-500";

  const reportPapersFound = createDefaultText(`Papers found: ${papersFoundNumber}`, ["block"]);
  const reportPapersNotFound = createDefaultText(`Papers not found: ${papersNotFound}`, ["block"]);
  reportDiv.appendChild(reportPapersFound);
  reportDiv.appendChild(reportPapersNotFound);

  const filtersDiv = document.createElement("div");
  filtersDiv.className = "w-20 h-full";
  createButtons().forEach((button) => filtersDiv.appendChild(button));

  // const sortDiv = document.createElement("div");

  const summaryDiv = document.getElementById("summaryDivId")!;
  summaryDiv.classList.add("flex");
  summaryDiv.innerHTML = "";

  summaryDiv.appendChild(reportDiv);
  summaryDiv.appendChild(filtersDiv);
}

function createButtons(): HTMLButtonElement[] {
  // Create buttons
  const buttonData = [
    {
      label: "Found",
      color: "bg-green-600",
      selectedColor: "bg-green-800",
      filterValues: ["paper-found"],
    },
    {
      label: "Not Found",
      color: "bg-orange-600",
      selectedColor: "bg-orange-800",
      filterValues: ["paper-not-found", "request-with-error"],
    },
  ];

  const buttons = buttonData.map(({ label, color, selectedColor, filterValues }) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.className = `px-2 py-0.5 m-1 text-nowrap text-white font-semibold rounded-lg shadow-md ${color} hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2`;

    // Add click event listener
    button.addEventListener("click", () => {
      if (filterValues.some((v) => activeFilters.has(v))) {
        filterValues.forEach((v) => activeFilters.delete(v)); // Remove filter if already active
        button.classList.remove("ring-2", "ring-offset-2", "ring-black", selectedColor);
      } else {
        filterValues.forEach((v) => activeFilters.add(v));
        button.classList.add("ring-2", "ring-offset-2", "ring-black", selectedColor);
      }
      filterDivs();
    });

    return button;
  });

  return buttons;
}

// Function to filter divs
function filterDivs() {
  if (activeFilters.size === 0) {
    // Show all divs if no filters are active
    citationMap.forEach((entry) => (entry.li.style.display = "block"));
  } else {
    // Show only divs that match active filters
    citationMap.forEach((entry) => {
      const matchesFilter = Array.from(activeFilters).some((filter) => entry.state == filter);
      entry.li.style.display = matchesFilter ? "block" : "none";
    });
  }
}

// Sleep function to add a delay
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updateCitationBasedOnApiResult(citation: CitationInformation, id: number) {
  const stateDiv = document.getElementById(`citation-state-${id}`)!;
  const entry = citationMap.get(id)!;

  var icon = null;
  var text = null;
  var otherText = null;

  const response = await searchPaperByTitle(citation.title);

  if (!response.ok) {
    const errorData = await response.json();

    icon = createRedCross();
    text = createDefaultText("Unknown error", ["text-justify", "justify-center"]);
    text = createDefaultText(errorData.error || "Unknown error");
    entry.state = CitationState.Error;

    stateDiv.innerHTML = "";
    stateDiv.appendChild(icon!);
    stateDiv.appendChild(text);
  } else {
    const data: CitationMetadata[] = await response.json();
    const colDiv = document.createElement("div");
    colDiv.className = "flex flex-col";

    if (data.length == 0) {
      icon = createDarkGreyInterrogationPoint(["pl-2"]);
      text = createDefaultText("Paper not found");

      entry.state = CitationState.NotFound;
    } else {
      icon = createGreenCheckmark(["pl-2"]);

      text = document.createElement("a");
      text.href = data[0].id;
      text.className = "pl-2 text-left text-xs";
      text.textContent = data[0].display_name;
      text.target = "_blank";
      text.rel = "noopener noreferrer";
      entry.state = CitationState.Success;

      otherText = createDefaultText(`Cited by: ${data[0].cited_by_count}`, ["pl-2", "text-left"]);
    }

    stateDiv.innerHTML = "";
    colDiv.appendChild(text);
    if (otherText) {
      colDiv.appendChild(otherText);
    }

    stateDiv.appendChild(icon!);
    stateDiv.appendChild(colDiv);
  }
}

function addCitationToDom(citation: CitationInformation, id: number) {
  const li = document.createElement("li");
  li.className =
    "p-4 bg-stone-200 transition-colors flex items-center mt-6 mb-6 border-2 border-gray-300 rounded-lg shadow-md";
  li.id = `citation-${id}`;

  // Create number badge
  const badge = document.createElement("span");
  badge.className =
    "inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm mr-3";
  badge.textContent = `${id}`;

  // Create text content

  const authors = createCardTextEntry(createDefaultText(citation.authors), createAuthorsIcon(), [
    "border-b",
    "border-gray-300",
    "pb-4",
  ]);
  const title = createCardTextEntry(createDefaultText(citation.title), createTitleIcon(), [
    "border-b",
    "border-gray-300",
    "pt-4",
    "pb-4",
  ]);
  const conference = createCardTextEntry(
    createDefaultText(citation.conference),
    createConferenceIcon(),
    ["border-b", "border-gray-300", "pt-4", "pb-4"],
  );
  let year = null;
  if (citation.year != null) {
    year = createCardTextEntry(createDefaultText(citation.year), createCalendarIcon(), [
      "border-b",
      "border-gray-300",
      "pt-4",
      "pb-4",
    ]);
  }

  // Initial state - Loading
  const stateDiv = document.createElement("div");
  stateDiv.className =
    "flex h-14 p-2 pr-3 min-w-40 w-fit max-w-80 items-center space-x-3 border-2 border-gray-300 bg-gray-200 shadow-md";
  stateDiv.id = `citation-state-${id}`;

  const stateWheel = document.createElement("span");
  stateWheel.className =
    "inline-block w-4 h-4 border-3 border-t-transparent border-blue-500 rounded-full animate-spin";
  stateWheel.id = `citation-state-icon-${id}`;
  const stateText = document.createElement("span");
  stateText.className = "text-gray-700 text-left";
  stateText.id = `citation-state-text-${id}`;
  stateText.textContent = "Searching...";
  stateDiv.appendChild(stateText);
  stateDiv.appendChild(stateWheel);

  li.appendChild(badge);

  const originalText = document.createElement("span");
  originalText.className = "text-gray-500 truncate pt-4 mb-3 text-left";
  originalText.textContent = citation.originalText;
  originalText.title = citation.originalText;

  const paperInformation = document.createElement("div");
  paperInformation.className = "flex flex-col max-w-9/10";
  paperInformation.appendChild(authors);
  paperInformation.appendChild(title);
  paperInformation.appendChild(conference);

  if (year) {
    paperInformation.appendChild(year);
  }

  paperInformation.appendChild(originalText);

  paperInformation.appendChild(stateDiv);

  li.appendChild(paperInformation);

  const itemsList = document.getElementById("itemsList") as HTMLUListElement;
  itemsList.appendChild(li);

  const citationEntry: CitationEntry = {
    id: id,
    info: citation,
    state: CitationState.Querying,
    metadata: null,
    li: li,
  };

  citationMap.set(id, citationEntry);
}

function createCardTextEntry(
  text: HTMLParagraphElement,
  icon: HTMLSpanElement,
  additionalClasses?: string[],
): HTMLDivElement {
  const div = document.createElement("div");
  div.className = "flex items-center";

  if (additionalClasses != undefined) {
    additionalClasses.forEach((c) => div.classList.add(c));
  }

  icon.classList.add("mr-5");

  div.appendChild(icon);
  div.appendChild(text);

  return div;
}
