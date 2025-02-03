export class CitationInformation {
  private originalText: string;
  private authors: string;
  private paper: string;
  private conference: string;

  constructor(
    originalText: string,
    authors: string,
    paper: string,
    conference: string,
  ) {
    this.originalText = originalText;
    this.authors = authors;
    this.paper = paper;
    this.conference = conference;
  }

  public parsedCorrectly() {
    return this.authors == "" && this.paper == "" && this.conference == "";
  }
}

class CitationFormat {
  private formatName: string;
  private pattern: RegExp;

  constructor(formatName: string, pattern: RegExp) {
    this.formatName = formatName;
    this.pattern = pattern;
  }

  // Public getter for formatName
  public get formatNameValue(): string {
    return this.formatName;
  }

  // Public getter for pattern
  public get patternValue(): RegExp {
    return this.pattern;
  }

  public tryParseCitation(citationText: string): CitationInformation | null {
    const match = citationText.match(this.pattern);

    if (!match?.groups) {
      return null;
    } else {
      console.log("Found something!");
    }

    const { authors, title, conference } = match.groups;

    console.log(authors);

    return new CitationInformation(citationText, authors, title, conference);
  }
}

export class CitationParser {
  private static citationFormats: CitationFormat[] = [
    new CitationFormat(
      "Generic",
      /^(?<authors>.*?[a-zA-Z]{2,}\.)\s*(?<title>.*?)\.\s*(?<conference>[^,]+)/,
    ),
  ];

  public static parseCitation(citationText: string): CitationInformation {
    for (let citationFormat of this.citationFormats) {
      let citationInfo = citationFormat.tryParseCitation(citationText);

      if (citationInfo != null) {
        return citationInfo;
      }
    }

    return new CitationInformation(citationText, "", "", "");
  }
}
