import { CitationEntry, CitationState } from "@/core";
import { SortDropdownSingleSelect } from "@/components/sort-dropdown-single-select";
import { FilterDropdownMultiSelect } from "@/components/filter-dropdown-multi-select";

export class SummaryPanel {
  private panel: HTMLDivElement;
  public filter: FilterDropdownMultiSelect | undefined;
  public sort: SortDropdownSingleSelect | undefined;

  constructor(panelId: string, containerId: string) {
    var panel = document.getElementById(panelId);
    if (!panel) {
      panel = document.createElement("div");
    }
    panel.className =
      "flex h-17 shadow-md border-2 items-center justify-center border-gray-400 bg-gray-300 text-gray-700";
    panel.id = "summary-div";
    panel.innerHTML = `
<span class="text-gray-700 font-bold pr-2">Waiting for all citation queries to be completed...</span>
<span class="inline-block w-4 h-4 border-3 border-t-transparent border-blue-500 rounded-full animate-spin"></span>
`;

    const container = document.getElementById(containerId)!;
    container.appendChild(panel);

    this.panel = panel as HTMLDivElement;
  }

  public updateSummaryDiv(citations: CitationEntry[]) {
    const foundPapers = citations.filter((entry) => entry.state == CitationState.Success).length;

    this.panel.classList.remove("justify-center");
    this.panel.classList.add("justify-between");
    this.panel.innerHTML = `
      <p class="text-left font-bold ml-10">
        ${foundPapers === citations.length ? "Found all papers!" : `Found ${foundPapers} / ${citations.length} papers.`}
      </p>
    `;

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "space-x-3";
    buttonContainer.id = "button-container";

    this.panel.appendChild(buttonContainer);

    this.filter = new FilterDropdownMultiSelect(buttonContainer.id);
    this.sort = new SortDropdownSingleSelect(buttonContainer.id);
  }
}
