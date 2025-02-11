import { ParseCitations, ParsedCitation } from "@/logic/pdf-parser";
import { CitationMetadata } from "@/types";
import { CitationCardList } from "@/components/citation-card-list";
import { SummaryPanel } from "@/components/summary-panel";

var allCitations: CitationEntry[] = [];
var cardList: CitationCardList | null;
var panel: SummaryPanel | null;

export type CitationEntry = {
  id: number;
  info: ParsedCitation;
  state: CitationState;
  metadata: CitationMetadata | null;
};

export enum CitationState {
  Querying = "querying",
  Error = "request-with-error",
  NotFound = "paper-not-found",
  Success = "paper-found",
}

export async function processPdfFile(file: File) {
  document.getElementById("tutorial-text")?.remove();
  panel = new SummaryPanel("summary-div", "items-section");
  cardList = new CitationCardList("citation-list", "items-section");

  // Then we parse the PDF file and obtain the list of references
  // With these references, we then add the entries to the DOM
  // In this initial state, each entry will have the "unverified" state
  const parsedCitations = await ParseCitations(file);

  if (typeof parsedCitations === "string") {
    console.log(parsedCitations);
    alert(parsedCitations);
    return;
  }

  allCitations = buildCitationUIData(parsedCitations);
  cardList.render(allCitations);

  for (const citation of allCitations) {
    await sleep(200);
    await cardList.updateCitationBasedOnApiResult(citation);
  }

  panel.updateSummaryDiv(allCitations);
}

function buildCitationUIData(parsedCitations: ParsedCitation[]): CitationEntry[] {
  let result: CitationEntry[] = [];

  for (let i = 0; i < parsedCitations.length; i++) {
    const entry: CitationEntry = {
      id: i + 1,
      info: parsedCitations[i],
      state: CitationState.Querying,
      metadata: null,
    };
    result.push(entry);
  }

  return result;
}

// Sleep function to add a delay
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// This function takes into considerion the applied filters and sort
// and renders the correct citations
export function renderCitations(): void {
  const filteredCitations = panel!.filter!.applyFilter(allCitations);
  const filteredSortedCitations = panel!.sort!.applySort(filteredCitations);

  cardList!.render(filteredSortedCitations);
}
