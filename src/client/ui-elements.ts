export function createDefaultText(text: string, additionalClasses?: string[]) {
  const span = document.createElement("span");
  span.className = "text-gray-700 text-left mb-3";
  span.textContent = text;

  if (additionalClasses != undefined) {
    additionalClasses.forEach((c) => span.classList.add(c));
  }
  return span;
}

export function createRedCross() {
  const redCrossSpan = document.createElement("span");
  redCrossSpan.className = "inline-block w-4 h-4 flex items-center justify-center text-red-500";

  // Create the SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("fill", "none");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("class", "w-full h-full");

  // Create the path element for the cross
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "3"); // Thicker stroke
  path.setAttribute("d", "M6 18L18 6M6 6l12 12"); // Cross shape

  // Append the path to the SVG
  svg.appendChild(path);

  // Append the SVG to the span
  redCrossSpan.appendChild(svg);

  return redCrossSpan;
}

export function createGreenCheckmark() {
  // Create the span element
  const greenCheckmarkSpan = document.createElement("span");
  greenCheckmarkSpan.className =
    "inline-block w-4 h-4 flex items-center justify-center text-green-500";

  // Create the SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("fill", "none");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("class", "w-full h-full");

  // Create the path element for the checkmark
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "3"); // Thicker stroke
  path.setAttribute("d", "M5 13l4 4L19 7"); // Checkmark shape

  // Append the path to the SVG
  svg.appendChild(path);

  // Append the SVG to the span
  greenCheckmarkSpan.appendChild(svg);

  return greenCheckmarkSpan;
}

export function createDarkGreyInterrogationPoint() {
  const span = document.createElement("span");
  span.className = "inline-block w-4 h-4 flex items-center justify-center text-gray-500";

  // Create the SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("fill", "none");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("class", "w-full h-full");

  // Create the path element for the question mark
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "3"); // Thicker stroke for better visibility
  path.setAttribute("d", "M12 18h.01M12 10a4 4 0 10-4-4 4 4 0 004 4zm0 0v4"); // Question mark shape

  // Append the path to the SVG
  svg.appendChild(path);

  // Append the SVG to the span
  span.appendChild(svg);

  return span;
}
