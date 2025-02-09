// Create an enum for sort options
enum SortOption {
  NAME_ASC = "Job Name A-Z",
  NAME_DESC = "Job Name Z-A",
  DATE_ASC = "Due Dates closest to now",
  DATE_DESC = "Due Dates farthest from now",
}

export class DropdownSingleSelect {
  private button: HTMLButtonElement;
  private dropdown: HTMLDivElement;
  private currentSort: SortOption = SortOption.NAME_ASC;
  private isOpen: boolean = false;

  constructor(containerId: string) {
    // Create button
    this.button = document.createElement("button");
    this.button.innerHTML = `
      <span class="flex items-center gap-2 text-gray-700">
        Sort by
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    `;
    this.button.className =
      "bg-white px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500";

    // Create dropdown
    this.dropdown = document.createElement("div");
    this.dropdown.className =
      "absolute mt-2 w-64 bg-white rounded-md shadow-lg hidden text-gray-700";
    this.updateDropdownContent();

    // Add to container
    const container = document.getElementById(containerId);
    console.log(container);
    if (container) {
      container.appendChild(this.button);
      container.appendChild(this.dropdown);
      console.log(container);
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
    this.dropdown.innerHTML = Object.values(SortOption)
      .map(
        (option) => `
        <button
          class="w-full text-left px-4 py-2 hover:bg-stone-300 ${this.currentSort === option ? "bg-orange-100" : ""}"
          onclick="this.setSort('${option}')"
        >
          ${option}
        </button>
      `,
      )
      .join("");
  }

  public setSort(option: SortOption): void {
    this.currentSort = option;
    this.updateDropdownContent();
    this.toggleDropdown();
    // You can add your sorting logic here
    console.log(`Sorting by: ${option}`);
  }
}
