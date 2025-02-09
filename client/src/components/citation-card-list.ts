import { CitationEntry, CitationState } from "@/core";
import { searchPaperByTitle } from "@/logic/api";
import { CitationInformation } from "@/logic/pdf-parser";
import {
  createAuthorsIcon,
  createCalendarIcon,
  createConferenceIcon,
  createDarkGreyInterrogationPoint,
  createGreenCheckmark,
  createRedCross,
  createTitleIcon,
} from "@/ui-elements";

export class CitationCardList {
  private unorderedList: HTMLUListElement;
  citationMap: Map<number, CitationEntry> = new Map<number, CitationEntry>();

  constructor(listId: string, containerId: string) {
    var list = document.getElementById(listId);
    if (!list) {
      list = document.createElement("ul");
    }
    list.className = "divide-y divide-gray-200 overflow-y-auto max-h-[calc(100vh-350px)]";
    list.id = listId;
    list.innerHTML = "";

    const container = document.getElementById(containerId)!;
    container.appendChild(list);

    this.unorderedList = list as HTMLUListElement;
  }

  public addCitation(citation: CitationInformation, id: number) {
    const year_template = `
          <div class="flex items-center border-b border-gray-300 pt-5 pb-4">
            ${createCalendarIcon(["mr-5"]).outerHTML}
            <p class="text-left">
              ${citation.year}
            </p>
          </div>
`;
    const li = document.createElement("li");
    li.className =
      "p-4 bg-stone-200 transition-colors flex items-center mt-6 mb-6 border-2 border-gray-300 rounded-lg shadow-md text-gray-700";
    li.id = `citation-${id}`;
    li.innerHTML = `
        <!-- Create badge number -->
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm mr-3">
          ${id}
        </span>

        <div class="flex flex-col max-w-9/10">
          <div class="flex items-center border-b border-gray-300 pb-4">
            ${createAuthorsIcon(["mr-5"]).outerHTML}
            <p class="text-left">
              ${citation.authors}
            </p>
          </div>

          <div class="flex items-center border-b border-gray-300 pt-4 pb-4">
            ${createTitleIcon(["mr-5"]).outerHTML}
            <p class="text-left">
              ${citation.title}
            </p>
          </div>

          <div class="flex items-center border-b border-gray-300 pt-4 pb-4">
            ${createConferenceIcon(["mr-5"]).outerHTML}
            <p class="text-left">
              ${citation.conference}
            </p>
          </div>
        
          ${citation.year != null ? year_template : ""}

          <span class="text-gray-500 truncate pt-4 mb-3 text-left"> ${citation.originalText} </span>

          <div class="flex h-14 p-2 pr-3 min-w-40 w-fit max-w-80 items-center space-x-3 border-2 border-gray-300 bg-gray-200 shadow-md" id="citation-state-${id}">
            <span class="text-gray-700 text-left"> Searching... </span>
            <span class="inline-block w-4 h-4 border-3 border-t-transparent border-blue-500 rounded-full animate-spin"/>
          </div>
        </div>
    `;

    this.unorderedList.appendChild(li);

    const citationEntry: CitationEntry = {
      id: id,
      info: citation,
      state: CitationState.Querying,
      metadata: null,
      li: li,
    };

    this.citationMap.set(id, citationEntry);
  }

  public async updateCitationBasedOnApiResult(citation: CitationInformation, id: number) {
    const stateDiv = document.getElementById(`citation-state-${id}`)!;
    const entry = this.citationMap.get(id)!;
    const response = await searchPaperByTitle(citation.title);
    const responseBody = await response.json();

    if (!response.ok) {
      entry.state = CitationState.Error;
    } else {
      if (responseBody.length === 0) {
        entry.state = CitationState.NotFound;
      } else {
        entry.state = CitationState.Success;
      }
    }

    var html = "";
    switch (entry.state) {
      case CitationState.Error: {
        html = `
          ${createRedCross().outerHTML}
          <p class="text-justify justify-center"> ${responseBody.error || "Unknown error"} </p>
`;
        break;
      }
      case CitationState.NotFound: {
        html = `
          ${createDarkGreyInterrogationPoint().outerHTML}
          <p class="pl-2"> Paper not found </>
`;
        break;
      }
      case CitationState.Success: {
        html = `
          ${createGreenCheckmark().outerHTML}
          <div class="flex flex-col">
            <a class="pl-2 text-left text-xs" href="${responseBody[0].id}" target="_blank" rel="noopener noreferrer"> 
              ${responseBody[0].display_name} 
            <a/>
            <p class="text-gray-700 text-left pl-2">Cited by: ${responseBody[0].cited_by_count}</p>
          </div>
`;
        break;
      }
    }

    stateDiv.innerHTML = html;
  }
}
