import { CitationEntry, CitationState, renderCitations } from "@/core";

interface FilterOption {
  id: string;
  label: string;
  checked: boolean;
}

export class FilterDropdownMultiSelect {
  private button: HTMLButtonElement;
  private dropdown: HTMLDivElement;
  private isOpen: boolean = false;
  private options: FilterOption[] = [
    { id: "found-filter", label: "Found", checked: false },
    { id: "not-found-filter", label: "Not Found", checked: false },
    { id: "error-filter", label: "Request with error", checked: false },
  ];

  constructor(containerId: string) {
    // Create button
    this.button = document.createElement("button");
    this.button.innerHTML = `
      <span class="flex items-center gap-2">
        Filter by
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    `;
    this.button.className =
      "bg-white px-4 py-2 border-2 border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500";

    // Create dropdown
    this.dropdown = document.createElement("div");
    this.dropdown.className = "absolute mt-2 w-64 bg-white rounded-md shadow-lg hidden";
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
        <div class="flex items-center px-4 py-2 hover:bg-stone-200 cursor-pointer" data-option-id="${option.id}">
          <div class="flex items-center h-5">
            <input
              type="checkbox"
              id="${option.id}"
              ${option.checked ? "checked" : ""}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            >
          </div>
          <label for="${option.id}" class="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
            ${option.label}
          </label>
        </div>
      `,
      )
      .join("");

    // Add click event listeners to the option divs
    const optionDivs = this.dropdown.querySelectorAll("div[data-option-id]");
    optionDivs.forEach((div) => {
      div.addEventListener("click", (_) => {
        const optionId = div.getAttribute("data-option-id");
        if (optionId) {
          this.toggleOption(optionId);
        }
      });
    });

    // Re-attach event listeners for checkboxes
    this.options.forEach((option) => {
      const checkbox = this.dropdown.querySelector(`#${option.id}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.addEventListener("change", (e) => {
          e.stopPropagation();
          this.toggleOption(option.id);
        });
      }
    });
  }

  public toggleOption(optionId: string): void {
    const option = this.options.find((opt) => opt.id === optionId);
    if (option) {
      option.checked = !option.checked;

      // Just update the checkbox state instead of recreating the entire content
      const checkbox = this.dropdown.querySelector(`#${optionId}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = option.checked;
      }

      // Update the div background
      const optionDiv = this.dropdown.querySelector(`div[data-option-id="${optionId}"]`);
      if (optionDiv) {
        if (option.checked) {
          optionDiv.classList.add("bg-stone-300");
          optionDiv.classList.remove("hover:bg-stone-200");
        } else {
          optionDiv.classList.remove("bg-stone-300");
          optionDiv.classList.add("hover:bg-stone-200");
        }
      }

      renderCitations();
    }
  }

  public applyFilter(list: CitationEntry[]): CitationEntry[] {
    const filterMap: { [key: string]: CitationState } = {
      "found-filter": CitationState.Success,
      "not-found-filter": CitationState.NotFound,
      "error-filter": CitationState.Error,
    };

    // Get the list of CitationState values to filter by
    const activeFilters = this.options
      .filter((option) => option.checked) // Only include checked filters
      .map((option) => filterMap[option.id]); // Map filter IDs to CitationState values

    console.log(activeFilters);
    // If no filters are active, return the original list
    if (activeFilters.length === 0) {
      return list;
    }

    // Filter the entries based on the active filters
    return list.filter((entry) => activeFilters.includes(entry.state));
  }
}
