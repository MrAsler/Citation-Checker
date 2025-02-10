import { CitationEntry, renderCitations } from "@/core";

interface SortOption {
  id: SortOptionEnum;
  label: string;
}

enum SortOptionEnum {
  ID_ASC,
  ID_DESC,
  CITATION_COUNT_ASC,
  CITATION_COUNT_DESC,
}

export class SortDropdownSingleSelect {
  private button: HTMLButtonElement;
  private dropdown: HTMLDivElement;
  private currentSort: SortOptionEnum;
  private isOpen: boolean = false;

  private options: SortOption[] = [
    { id: SortOptionEnum.ID_ASC, label: "Citation number Asc." },
    { id: SortOptionEnum.ID_DESC, label: "Citation number Desc." },
    { id: SortOptionEnum.CITATION_COUNT_ASC, label: "Citation count Asc." },
    { id: SortOptionEnum.CITATION_COUNT_DESC, label: "Citation count Desc." },
  ];

  constructor(containerId: string) {
    // Create button
    this.button = document.createElement("button");
    this.button.innerHTML = `
      <span class="flex items-center gap-2">
        Sort by
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    `;
    this.button.className =
      "bg-white px-4 py-2 border-2 border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500";

    // Create dropdown
    this.dropdown = document.createElement("div");
    this.dropdown.className =
      "absolute mt-2 w-64 bg-white rounded-md shadow-lg hidden text-gray-700";
    this.updateDropdownContent();

    // Add to container
    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(this.button);
      container.appendChild(this.dropdown);
    }

    // Add event listeners
    this.button.addEventListener("click", () => this.toggleDropdown());
    document.addEventListener("click", (e) => this.handleClickOutside(e));
    this.currentSort = this.options[0].id;
  }

  private toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.dropdown.classList.toggle("hidden");
  }

  private handleClickOutside(event: MouseEvent): void {
    const target = event.target as Node;
    if (!this.button.contains(target) && !this.dropdown.contains(target)) {
      this.isOpen = false;
      this.dropdown.classList.add("hidden");
    }
  }

  private updateDropdownContent(): void {
    this.dropdown.innerHTML = this.options
      .map(
        (option) => `
        <button
          class="w-full text-left px-4 py-2 hover:bg-stone-200" data-option-id="${option.id}">
          ${option.label}
        </button>
      `,
      )
      .join("");

    // Add click event listeners to the option divs
    const optionDivs = this.dropdown.querySelectorAll("button[data-option-id]");
    optionDivs.forEach((div) => {
      div.addEventListener("click", (_) => {
        const optionId = div.getAttribute("data-option-id");
        if (optionId) {
          this.setSort(Number(optionId) as SortOptionEnum);
        }
      });
    });
  }

  public setSort(optionId: SortOptionEnum): void {
    if (this.currentSort === optionId) {
      return;
    }

    const oldSelected = this.dropdown.querySelector(
      `button[data-option-id="${this.currentSort}"]`,
    )!;
    const newSelected = this.dropdown.querySelector(`button[data-option-id="${optionId}"]`)!;

    oldSelected.classList.remove("bg-stone-300");
    oldSelected.classList.add("hober:bg-stone-200");

    newSelected.classList.add("bg-stone-300");
    newSelected.classList.remove("hover:bg-stone-200");

    this.currentSort = optionId;
    renderCitations();
  }

  public applySort(list: CitationEntry[]): CitationEntry[] {
    switch (this.currentSort) {
      case SortOptionEnum.ID_ASC:
        return list.sort((a, b) => a.id - b.id);
      case SortOptionEnum.ID_DESC:
        return list.sort((a, b) => b.id - a.id);
      case SortOptionEnum.CITATION_COUNT_ASC:
        return list.sort(
          (a, b) => (a.metadata?.cited_by_count || 0) - (b.metadata?.cited_by_count || 0),
        );
      case SortOptionEnum.CITATION_COUNT_DESC:
        return list.sort(
          (a, b) => (b.metadata?.cited_by_count || 0) - (a.metadata?.cited_by_count || 0),
        );
    }
  }
}
