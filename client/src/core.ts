import { ParseCitations, CitationInformation } from "@/logic/pdf-parser";
import { CitationMetadata } from "@/types";
import { CitationCardList } from "@/components/citation-card-list";
import { SummaryPanel } from "@/components/summary-panel";

const itemsSection = document.getElementById("items-section") as HTMLDivElement;

const citationMap: Map<number, CitationEntry> = new Map<number, CitationEntry>();

var cardList: CitationCardList | null;
const activeFilters: Set<string> = new Set();

export type CitationEntry = {
  id: number;
  info: CitationInformation;
  state: CitationState;
  metadata: CitationMetadata | null;
  li: HTMLLIElement;
};

export enum CitationState {
  Querying = "querying",
  Error = "request-with-error",
  NotFound = "paper-not-found",
  Success = "paper-found",
}

export async function processPdfFile(file: File) {
  document.getElementById("tutorial-text")?.remove();
  const panel = new SummaryPanel("summary-div", "items-section");
  const cardList = new CitationCardList("citation-list", "items-section");

  // Then we parse the PDF file and obtain the list of references
  // With these references, we then add the entries to the DOM
  // In this initial state, each entry will have the "unverified" state
  const citations = await ParseCitations(file);

  if (typeof citations === "string") {
    console.log(citations);
    return;
  }

  for (let i = 0; i < citations.length; i++) {
    cardList.addCitation(citations[i], i + 1);
  }

  for (let i = 0; i < citations.length; i++) {
    // Need to wait some time between requests
    await sleep(100);
    await cardList.updateCitationBasedOnApiResult(citations[i], i + 1);
  }

  panel.updateSummaryDiv(cardList);

  // Afterwards, we check if each citation actually exists.
}

// Sleep function to add a delay
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
