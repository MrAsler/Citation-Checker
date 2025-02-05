import { ParseCitations, CitationInformation } from "@/logic/pdf-parser";
import { searchPaperByTitle } from "@/logic/api";
import { CitationMetadata } from "src/types/types";
import {
  createDarkGreyInterrogationPoint,
  createDefaultText,
  createGreenCheckmark,
  createRedCross,
} from "@/ui-elements";

const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const fileNameDisplay = document.getElementById("fileName") as HTMLParagraphElement;
const uploadZone = document.getElementById("uploadZone") as HTMLDivElement;
const helpButton = document.getElementById("helpButton") as HTMLButtonElement;
const closePopup = document.getElementById("closePopup") as HTMLButtonElement;
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

async function processPdfFile(file: File) {
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
    await sleep(200);
    updateCitationBasedOnApiResult(citations[i], i + 1);
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
  itemsList.className = "divide-y divide-gray-200 overflow-y-auto max-h-[calc(100vh-300px)]";

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
      color: "bg-yellow-500",
      filterValues: ["paper-found"],
    },
    {
      label: "Not Found",
      color: "bg-green-500",
      filterValues: ["paper-not-found", "request-with-error"],
    },
  ];

  const buttons = buttonData.map(({ label, color, filterValues }) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.className = `px-2 py-0.5 m-1 text-nowrap text-white font-semibold rounded-lg shadow-md ${color} hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2`;

    // Add click event listener
    button.addEventListener("click", () => {
      if (filterValues.some((v) => activeFilters.has(v))) {
        filterValues.forEach((v) => activeFilters.delete(v)); // Remove filter if already active
        button.classList.remove("ring-2", "ring-offset-2", "ring-gray-300");
      } else {
        filterValues.forEach((v) => activeFilters.add(v));
        button.classList.add("ring-2", "ring-offset-2", "ring-gray-300");
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
  stateDiv.innerHTML = "";
  const entry = citationMap.get(id)!;

  var icon = null;
  var text = null;

  const response = await searchPaperByTitle(citation.title);

  if (!response.ok) {
    const errorData = await response.json();

    icon = createRedCross();
    text = createDefaultText(errorData.message || "Unknown error");
    entry.state = CitationState.Error;
  } else {
    const data: CitationMetadata[] = await response.json();

    if (data.length == 0) {
      icon = createDarkGreyInterrogationPoint();
      text = createDefaultText("Paper was not found");

      entry.state = CitationState.NotFound;
    } else {
      icon = createGreenCheckmark();

      text = document.createElement("a");
      text.href = data[0].id;
      text.textContent = "Paper found!";
      text.target = "_blank";
      text.rel = "noopener noreferrer";
      entry.state = CitationState.Success;
    }
  }

  stateDiv.appendChild(icon!);
  stateDiv.appendChild(text);
}

function addCitationToDom(citation: CitationInformation, id: number) {
  const li = document.createElement("li");
  li.className =
    "p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center mt-1 mb-1 border-2 border-gray-300 rounded-lg shadow-md";
  li.id = `citation-${id}`;

  // Create number badge
  const badge = document.createElement("span");
  badge.className =
    "inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm mr-3";
  badge.textContent = `${id}`;

  // Create text content

  const authors = document.createElement("span");
  authors.className = "text-gray-700 text-left mb-3";
  authors.textContent = citation.authors;

  const paperName = document.createElement("span");
  paperName.className = "text-gray-700 text-left mb-3";
  paperName.textContent = citation.title;

  const conference = document.createElement("span");
  conference.className = "text-gray-700 text-left mb-3";
  conference.textContent = citation.conference;

  // Initial state - Loading
  const stateDiv = document.createElement("div");
  stateDiv.className = "flex items-center space-x-2";
  stateDiv.id = `citation-state-${id}`;

  const stateWheel = document.createElement("span");
  stateWheel.className =
    "inline-block w-4 h-4 border-3 border-t-transparent border-blue-500 rounded-full animate-spin";
  stateWheel.id = `citation-state-icon-${id}`;
  const stateText = document.createElement("span");
  stateText.className = "text-gray-700 text-left";
  stateText.id = `citation-state-text-${id}`;
  stateText.textContent = "Querying...";
  stateDiv.appendChild(stateText);
  stateDiv.appendChild(stateWheel);

  li.appendChild(badge);

  const originalText = document.createElement("span");
  originalText.className = "text-gray-500 truncate mb-3 text-left";
  originalText.textContent = citation.originalText;
  originalText.title = citation.originalText;

  const paperInformation = document.createElement("div");
  paperInformation.className = "flex flex-col max-w-9/10";
  paperInformation.appendChild(authors);
  paperInformation.appendChild(paperName);
  paperInformation.appendChild(conference);
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

// Initialize sample items
// Handle file selection
fileInput.addEventListener("change", (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    fileNameDisplay.textContent = `Selected: ${file.name}`;
    processPdfFile(file);
  }
});

// Handle upload zone click
uploadZone.addEventListener("click", () => {
  fileInput.click();
});

// Handle drag and drop
uploadZone.addEventListener("dragover", (e: DragEvent) => {
  e.preventDefault();
  uploadZone.classList.remove("border-gray-300");
  uploadZone.classList.add("border-gray-500");
});

uploadZone.addEventListener("dragleave", (e: DragEvent) => {
  e.preventDefault();
  uploadZone.classList.remove("border-gray-500");
  uploadZone.classList.add("border-gray-300");
});

helpButton.addEventListener("click", async () => {
  helpPopup.classList.remove("hidden");
});

closePopup.addEventListener("click", () => {
  helpPopup.classList.add("hidden");
});

// Close the popup when clicking outside the popup content
helpPopup.addEventListener("click", (event) => {
  if (event.target === helpPopup) {
    helpPopup.classList.add("hidden");
  }
});

uploadZone.addEventListener("drop", (e: DragEvent) => {
  e.preventDefault();
  uploadZone.classList.remove("border-gray-500");
  uploadZone.classList.add("border-gray-300");

  const file = e.dataTransfer?.files[0];
  if (file && file.type === "application/pdf") {
    fileInput.files = e.dataTransfer?.files;
    fileNameDisplay.textContent = `Selected: ${file.name}`;
    processPdfFile(file);
  }
});
