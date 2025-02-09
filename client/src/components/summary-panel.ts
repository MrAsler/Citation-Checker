import { CitationCardList } from "@/components/citation-card-list";
import { CitationState } from "@/core";
import { DropdownSingleSelect } from "./dropdown-single-select";
import { DropdownMultiSelect } from "./dropdown-multi-select";

export class SummaryPanel {
  private panel: HTMLDivElement;

  constructor(panelId: string, containerId: string) {
    var panel = document.getElementById(panelId);
    if (!panel) {
      panel = document.createElement("div");
    }
    panel.className =
      "flex h-20 shadow-md border-2 items-center justify-center border-gray-400 bg-gray-300 text-gray-700";
    panel.id = "summary-div";
    panel.innerHTML = `
<span class="text-gray-700 font-bold pr-2">Waiting for all citation queries to be completed...</span>
<span class="inline-block w-4 h-4 border-3 border-t-transparent border-blue-500 rounded-full animate-spin"></span>
`;

    const container = document.getElementById(containerId)!;
    container.appendChild(panel);

    this.panel = panel as HTMLDivElement;
  }

  public updateSummaryDiv(cardList: CitationCardList) {
    const foundPapers = Array.from(
      cardList.citationMap.values().filter((entry) => entry.state == CitationState.Success),
    ).length;

    this.panel.classList.add("flex");
    this.panel.innerHTML = `
      <p class="text-left">
        ${foundPapers === cardList.citationMap.size ? "Found all papers!" : `Found ${foundPapers} / ${cardList.citationMap.size} papers.`}
      </p>
`;

    new DropdownMultiSelect("summary-div");
    new DropdownSingleSelect("summary-div");
  }
}
