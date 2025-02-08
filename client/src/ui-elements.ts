import authorsIconSvgData from "@/assets/authors.svg?raw";
import calendarIconSvgData from "@/assets/calendar.svg?raw";
import conferenceIconSvgData from "@/assets/conference.svg?raw";
import titleIconSvgData from "@/assets/title.svg?raw";

const parser = new DOMParser();

const authorsIcon = parser.parseFromString(authorsIconSvgData, "image/svg+xml").documentElement;
const calendarIcon = parser.parseFromString(calendarIconSvgData, "image/svg+xml").documentElement;
const conferenceIcon = parser.parseFromString(
  conferenceIconSvgData,
  "image/svg+xml",
).documentElement;
const titleIcon = parser.parseFromString(titleIconSvgData, "image/svg+xml").documentElement;

function removeStyleTags(svgElement: HTMLElement) {
  // Select all <style> tags inside the SVG
  const styleTags = svgElement.querySelectorAll("style");
  console.log(svgElement);
  console.log(styleTags);

  // Remove each <style> tag
  styleTags.forEach((styleTag) => {
    console.log("Removing! " + styleTag);
    styleTag.remove();
  });
}

removeStyleTags(authorsIcon);
removeStyleTags(calendarIcon);
removeStyleTags(conferenceIcon);
removeStyleTags(titleIcon);

console.log(authorsIcon);
console.log(calendarIcon);
console.log(conferenceIcon);
console.log(titleIcon);

export function createDefaultText(
  text: string,
  additionalClasses?: string[],
): HTMLParagraphElement {
  const span = document.createElement("p");
  span.className = "text-gray-700 text-left";
  span.textContent = text;

  if (additionalClasses != undefined) {
    additionalClasses.forEach((c) => span.classList.add(c));
  }
  return span;
}

export function createRedCross(): HTMLSpanElement {
  const redCrossSpan = document.createElement("span");
  redCrossSpan.className = "inline-block w-7 h-7 flex items-center justify-center text-red-500";

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

export function createGreenCheckmark(additionalClasses?: string[]): HTMLSpanElement {
  // Create the span element
  const greenCheckmarkSpan = document.createElement("span");
  greenCheckmarkSpan.className =
    "inline-block w-7 h-7 flex items-center justify-center text-green-600";

  if (additionalClasses != undefined) {
    additionalClasses.forEach((c) => greenCheckmarkSpan.classList.add(c));
  }

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

export function createDarkGreyInterrogationPoint(additionalClasses?: string[]): HTMLSpanElement {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const span = document.createElement("span");
  span.className = "inline-block w-8 h-8 flex items-center justify-center text-gray-500";

  if (additionalClasses != undefined) {
    additionalClasses.forEach((c) => span.classList.add(c));
  }

  // Create the SVG element
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("fill", "none");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("class", "w-full h-full");
  svg.setAttribute("stroke-width", "3");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  // Create the path element for the question mark
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M9 9a3 3 0 1 1 6 0c0 1.5-1.5 2.5-2.5 3.5S11 14 11 15"); // Question mark shape

  // Create the dot for the question mark
  const path2 = document.createElementNS(SVG_NS, "path");
  path2.setAttribute("d", "M11.3 20h.12");

  // Append the path to the SVG
  svg.appendChild(path);
  svg.appendChild(path2);

  // Append the SVG to the span
  span.appendChild(svg);

  return span;
}

export function createAuthorsIcon(): HTMLSpanElement {
  return createFromSvgIcon(authorsIcon);
}

export function createTitleIcon() {
  return createFromSvgIcon(titleIcon);
}

export function createConferenceIcon() {
  return createFromSvgIcon(conferenceIcon);
}

export function createCalendarIcon() {
  return createFromSvgIcon(calendarIcon);
}

function createFromSvgIcon(
  originalSvgReference: HTMLElement,
  additionalClasses?: string[],
): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "text-gray-700 inline-block w-6 h-6 ";
  const svg = originalSvgReference.cloneNode(true) as HTMLElement;

  svg.removeAttribute("style");

  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("class", "w-full h-full");

  span.appendChild(svg);

  if (additionalClasses != undefined) {
    additionalClasses.forEach((c) => span.classList.add(c));
  }

  return span;
}
