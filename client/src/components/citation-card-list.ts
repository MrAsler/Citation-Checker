import { CitationEntry, CitationState } from "@/core";
import { searchPaperByTitle } from "@/logic/api";
import authors from "@/assets/authors.svg";
import calendar from "@/assets/calendar.svg";
import conference from "@/assets/conference.svg";
import title from "@/assets/title.svg";
import question_mark from "@/assets/gray-question_mark.svg";
import green_checkmark from "@/assets/green-checkmark.svg";
import red_cross from "@/assets/red-cross.svg";

export class CitationCardList {
  private unorderedList: HTMLUListElement;

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

  public render(citations: CitationEntry[]): void {
    this.unorderedList.innerHTML = "";
    citations.forEach((citation) => this.addCitation(citation));
  }

  private addCitation(citation: CitationEntry) {
    const year_template = `
          <div class="flex items-center border-b border-gray-300 pt-5 pb-4">
            <div class="size-6 mr-5">
              <img src="${calendar}"></>
            </div>
            <p class="text-left">
              ${citation.info.year}
            </p>
          </div>
`;
    const li = document.createElement("li");
    li.className =
      "p-4 bg-stone-200 transition-colors flex items-center mt-6 mb-6 border-2 border-gray-300 rounded-lg shadow-md text-gray-700";
    li.id = `citation-${citation.id}`;
    li.innerHTML = `
        <!-- Create badge number -->
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm mr-3">
          ${citation.id}
        </span>

        <div class="flex flex-col max-w-9/10">
          <div class="flex items-center border-b border-gray-300 pb-4" title="Author">
            <div class="size-6 mr-5">
              <img src="${authors}"></>
            </div>
            <p class="text-left">
              ${citation.info.authors}
            </p>
          </div>

          <div class="flex items-center border-b border-gray-300 pt-4 pb-4" title="Title"">
            <div class="size-6 mr-5">
              <img src="${title}"></>
            </div>
            <p class="text-left">
              ${citation.info.title}
            </p>
          </div>

          <div class="flex items-center border-b border-gray-300 pt-4 pb-4" title="Conference">
            <div class="size-6 mr-5">
              <img src="${conference}"></>
            </div>
            <p class="text-left">
              ${citation.info.conference}
            </p>
          </div>
        
          ${citation.info.year != null ? year_template : ""}

          <span class="text-gray-500 pt-4 mb-3 text-left cursor-help" title="${citation.info.originalText}"> ${citation.info.originalText} </span>

          <div class="flex h-14 p-2 pr-3 min-w-40 w-fit max-w-80 items-center space-x-3 border-2 border-gray-300 bg-gray-200 shadow-md" id="citation-state-${citation.id}">
            ${this.citationEntryStateHtml(citation)}
          </div>
        </div>
    `;

    this.unorderedList.appendChild(li);
  }

  private citationEntryStateHtml(citation: CitationEntry) {
    switch (citation.state) {
      case CitationState.Querying: {
        return `
            <span class="text-gray-700 text-left"> Searching... </span>
            <span class="inline-block w-4 h-4 border-3 border-t-transparent border-blue-500 rounded-full animate-spin"/>
`;
      }
      case CitationState.Error: {
        return `
          <div class="size-8">
            <img src="${red_cross}"/>
          </div>
          <p class="text-justify justify-center"> ${citation.metadata || "Unknown error"} </p>
`;
      }
      case CitationState.NotFound: {
        return `
          <div class="size-8">
            <img src="${question_mark}"/>
          </div>
          <p class="pl-2"> Paper not found </>
`;
      }
      case CitationState.Success: {
        return `
          <div class="size-8">
            <img src="${green_checkmark}"/>
          </div>
          <div class="flex flex-col">
            <a class="pl-2 text-left text-xs" href="${citation.metadata!.id}" target="_blank" rel="noopener noreferrer"> 
              ${citation.metadata!.display_name} 
            <a/>
            <p class="text-gray-700 text-left pl-2">Cited by: ${citation.metadata!.cited_by_count}</p>
          </div>
`;
      }
    }
  }

  public async updateCitationBasedOnApiResult(citation: CitationEntry) {
    const stateDiv = document.getElementById(`citation-state-${citation.id}`)!;
    const response = await searchPaperByTitle(citation.info.title);
    const responseBody = await response.json();

    if (!response.ok) {
      citation.state = CitationState.Error;
      citation.metadata = responseBody.error;
    } else {
      if (responseBody.length === 0) {
        citation.state = CitationState.NotFound;
      } else {
        citation.state = CitationState.Success;
        citation.metadata = responseBody[0];
      }
    }

    stateDiv.innerHTML = this.citationEntryStateHtml(citation);
  }
}
