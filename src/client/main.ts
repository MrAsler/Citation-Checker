import { ParseCitations } from "@/logic/pdf-parser";

const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const fileNameDisplay = document.getElementById(
  "fileName",
) as HTMLParagraphElement;
const uploadZone = document.getElementById("uploadZone") as HTMLDivElement;
const helpButton = document.getElementById("helpButton");
const closePopup = document.getElementById("closePopup");
const itemsList = document.getElementById("itemsList") as HTMLUListElement;

async function processPdfFile(file: File) {
  // First we clean up the existing citations
  itemsList.innerHTML = "";
  document.getElementById("tutorial_pt_2")?.remove();

  // Then we parse the PDF file and obtain the list of references
  // With these references, we then add the entries to the DOM
  // In this initial state, each entry will have the "unverified" state
  const citations = await ParseCitations(file);

  console.log("Return is..!");
  console.log(citations);
  for (let i = 0; i < citations.length; i++) {
    addCitationToDom(citations[i], i + 1);
  }

  // Afterwards, we check if each citation actually exists.
}

// Generate 30 sample items
function addCitationToDom(citation: CitationInformation, id: number) {
  const li = document.createElement("li");
  li.className =
    "p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center";

  // Create number badge
  const badge = document.createElement("span");
  badge.className =
    "inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm mr-3";
  badge.textContent = `${id}`;

  // Create text content
  const paperName = document.createElement("span");
  paperName.className = "text-gray-700";
  paperName.textContent = citation.paper;

  const authors = document.createElement("span");
  authors.className = "text-gray-700";
  authors.textContent = citation.authors;

  li.appendChild(badge);

  const originalText = document.createElement("span");
  originalText.className = "text-gray-700 truncate";
  originalText.textContent = citation.originalText;

  const paperInformation = document.createElement("div");
  paperInformation.className = "flex flex-col";
  paperInformation.appendChild(authors);
  paperInformation.appendChild(paperName);
  li.appendChild(paperInformation);
  itemsList.appendChild(li);
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
