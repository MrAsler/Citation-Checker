interface SortOption {
  id: string;
  label: string;
  checked: boolean;
}

export class DropdownMultiSelect {
  private button: HTMLButtonElement;
  private dropdown: HTMLDivElement;
  private isOpen: boolean = false;
  private options: SortOption[] = [
    { id: "name-asc", label: "Job Name A-Z", checked: false },
    { id: "name-desc", label: "Job Name Z-A", checked: false },
    { id: "date-asc", label: "Due Dates closest to now", checked: false },
    { id: "date-desc", label: "Due Dates farthest from now", checked: false },
  ];

  constructor(containerId: string) {
    // Create button
    this.button = document.createElement("button");
    this.button.innerHTML = `
      <span class="flex items-center gap-2">
        Filter By
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    `;
    this.button.className =
      "bg-white px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500";

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
        <div class="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
             onclick="this.toggleOption('${option.id}')">
          <div class="flex items-center h-5">
            <input
              type="checkbox"
              id="${option.id}"
              ${option.checked ? "checked" : ""}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              onclick="event.stopPropagation()"
            >
          </div>
          <label for="${option.id}" class="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
            ${option.label}
          </label>
        </div>
      `,
      )
      .join("");

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
      this.updateDropdownContent();

      // You can add your sorting logic here
      console.log(
        "Current selected options:",
        this.options.filter((opt) => opt.checked),
      );
    }
  }
}
