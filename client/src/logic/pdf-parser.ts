import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, TextItem } from "pdfjs-dist/types/src/display/api";
import "pdfjs-dist/build/pdf.worker.mjs";
import { CitationTokenizer } from "./tokenizer";

type CitationLine = {
  tokens: CitationToken[];
};

export type CitationToken = {
  text: string;
  hasEOL: boolean;
  fontId: string;
};

export class ParsedCitation {
  originalText: string;
  authors: string;
  title: string;
  conference: string;
  year: string | null;

  constructor(
    originalText: string,
    authors: string,
    title: string,
    conference: string,
    year: string | null,
  ) {
    this.originalText = originalText;
    this.authors = authors;
    this.title = title;
    this.conference = conference;
    this.year = year;
  }

  public wasParsedSuccessfully() {
    return this.authors != "" && this.title != "" && this.conference != "";
  }
}

// Set the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type ErrorReason = string;

export async function ParseCitations(pdfFile: File): Promise<ParsedCitation[] | ErrorReason> {
  try {
    const pdf = await loadPdfFile(pdfFile);
    const startOfCitations = await findStartOfCitations(pdf);

    if (startOfCitations == null) {
      return "Citations section was not found";
    }

    const citationLines = await buildCitationsText(
      pdf,
      startOfCitations.page,
      startOfCitations.line,
    );
    const citations = mergeAndCleanupCitationTokens(citationLines);

    return citations.map(
      (citation) =>
        new CitationTokenizer(citation.tokens).tokenize() ||
        new ParsedCitation(citation.tokens.map((t) => t.text).join(""), "", "", "", ""),
    );
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return "Error parsing the PDF: " + error;
  }
}

async function loadPdfFile(pdfFile: File): Promise<PDFDocumentProxy> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  return await loadingTask.promise;
}

// To find the citations, we search the documents backwards until we find the first '[1]'.
async function findStartOfCitations(
  pdf: PDFDocumentProxy,
): Promise<{ page: number; line: number } | null> {
  for (let pageNum = pdf.numPages; pageNum >= 1; pageNum--) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const textItems = textContent.items
      .filter((item): item is TextItem => "str" in item)
      .map((item) => item.str.trim());

    for (let i = textItems.length - 1; i >= 0; i--) {
      const line = textItems[i];

      if (line.startsWith("[1]")) {
        return { page: pageNum, line: i };
      }
    }
  }

  return null;
}

// Returns an array of strings, where each string corresponds to a full citation
async function buildCitationsText(
  pdf: PDFDocumentProxy,
  pageStart: number,
  lineStart: number,
): Promise<CitationLine[]> {
  const result: CitationLine[] = [];

  var currentPage = pageStart;
  var currentLine = lineStart;
  var citationNumber = 1;

  var currentCitation: CitationToken[] = [];

  while (currentPage <= pdf.numPages) {
    const page = await pdf.getPage(currentPage);
    const textContent = await page.getTextContent();

    for (let i = currentLine; i < textContent.items.length; i++) {
      let token = textContent.items[i] as TextItem;

      // Found the start of a citation, finish current one and add it to result list
      if (token.str.startsWith(`[${citationNumber}]`)) {
        if (currentCitation.length != 0) {
          result.push({ tokens: currentCitation });
          currentCitation = [];
        }

        citationNumber++;
      }

      currentCitation.push({
        text: token.str,
        hasEOL: token.hasEOL,
        fontId: token.fontName,
      });
    }

    currentLine = 0;
    currentPage++;
  }

  return result;
}

// Given an array of CitationLines, performs the following operations:
// Merges all of the tokens that belong to the same font
// Merges new lines
// Cleanup the start of the first token, if it starts with [\d+]
// If token ends with ". In ", we remove this ending
function mergeAndCleanupCitationTokens(citationLines: CitationLine[]): CitationLine[] {
  const result: CitationLine[] = [];

  for (const line of citationLines) {
    var currentLine: CitationToken[] = [];
    var currentTokens: CitationToken = line.tokens[0] || { text: "", hasEOL: false, fontId: "" };

    for (var i = 1; i < line.tokens.length; i++) {
      const token = line.tokens[i];
      if (token.fontId != currentTokens.fontId) {
        currentLine.push(currentTokens);
        currentTokens = { text: "", hasEOL: false, fontId: token.fontId };
      }

      if (token.hasEOL) {
        if (token.text.endsWith("-")) {
          currentTokens.text = currentTokens.text.slice(0, -1);
        }
      }

      currentTokens.text = currentTokens.text += token.text;
    }

    currentLine.push(currentTokens);
    result.push({ tokens: currentLine });
  }

  // Cleanup section
  for (const line of result) {
    // Remove the citation number from the line
    line.tokens[0].text = line.tokens[0].text.replace(/^\[\d+\]\s*/, "");
    for (const token of line.tokens) {
      // If token ends with ". In ", we remove this part of the textinput
      token.text = token.text.replace(/\.\s*in\b\s*$/i, ".");
    }
  }

  console.log(result);

  return result;
}
