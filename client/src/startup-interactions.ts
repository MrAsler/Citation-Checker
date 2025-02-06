import { processPdfFile } from "@/core";

const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const fileNameDisplay = document.getElementById("fileName") as HTMLParagraphElement;
const uploadZone = document.getElementById("uploadZone") as HTMLDivElement;
const helpButton = document.getElementById("helpButton") as HTMLButtonElement;
const closePopup = document.getElementById("closePopup") as HTMLButtonElement;
const helpPopup = document.getElementById("helpPopup") as HTMLButtonElement;

// Initialize sample items
// Handle file selection
fileInput.addEventListener("change", (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    fileNameDisplay.textContent = `Selected: ${file.name}`;
    processPdfFile(file);
  }
});

// Handle upload zone click
uploadZone.addEventListener("click", () => {
  fileInput.click();
});

// Handle drag and drop
uploadZone.addEventListener("dragover", (e: DragEvent) => {
  e.preventDefault();
  uploadZone.classList.remove("border-gray-300");
  uploadZone.classList.add("border-gray-500");
});

uploadZone.addEventListener("dragleave", (e: DragEvent) => {
  e.preventDefault();
  uploadZone.classList.remove("border-gray-500");
  uploadZone.classList.add("border-gray-300");
});

helpButton.addEventListener("click", async () => {
  helpPopup.classList.remove("hidden");
});

closePopup.addEventListener("click", () => {
  helpPopup.classList.add("hidden");
});

// Close the popup when clicking outside the popup content
helpPopup.addEventListener("click", (event) => {
  if (event.target === helpPopup) {
    helpPopup.classList.add("hidden");
  }
});

uploadZone.addEventListener("drop", (e: DragEvent) => {
  e.preventDefault();
  uploadZone.classList.remove("border-gray-500");
  uploadZone.classList.add("border-gray-300");

  const file = e.dataTransfer?.files[0];
  if (file && file.type === "application/pdf") {
    fileInput.files = e.dataTransfer?.files;
    fileNameDisplay.textContent = `Selected: ${file.name}`;
    processPdfFile(file);
  }
});
