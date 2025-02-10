import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, TextItem } from "pdfjs-dist/types/src/display/api";
import "pdfjs-dist/build/pdf.worker.mjs";
import { CitationTokenizer } from "./tokenizer";

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

    const citationStrings = await buildCitationsText(
      pdf,
      startOfCitations.page,
      startOfCitations.line,
    );

    return citationStrings.map(
      (text) => new CitationTokenizer(text).tokenize() || new ParsedCitation(text, "", "", "", ""),
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
  for (let pageNum = pdf.numPages; pageNum >= 0; pageNum--) {
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
): Promise<string[]> {
  const result: string[] = [];

  var currentPage = pageStart;
  var currentLine = lineStart;
  var citationNumber = 1;
  var citation = "";

  while (currentPage <= pdf.numPages) {
    const page = await pdf.getPage(currentPage);
    const textContent = await page.getTextContent();

    const lines = textContent.items
      .filter((item): item is TextItem => "str" in item)
      .map((item) => item.str.trim());

    for (let i = currentLine; i < lines.length; i++) {
      let line = lines[i];

      // Found new citation, finish current one and add it to result list
      if (line.startsWith(`[${citationNumber}]`)) {
        citation = citation.replace("  ", " ").replace(/^\[\d+\]\s*/, "");

        if (citation != "") {
          result.push(citation);
        }
        citation = line;
        citationNumber++;
        continue;
      }

      if (citation.endsWith("-")) {
        citation = citation.slice(0, -1);
        citation += line;
      } else {
        citation += " " + line;
      }
    }

    currentLine = 0;
    currentPage++;
  }

  return result;
}
