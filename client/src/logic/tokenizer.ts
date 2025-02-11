//

import { CitationToken, ParsedCitation } from "./pdf-parser";

export class CitationTokenizer {
  private tokens: CitationToken[];
  private currentToken: number;

  private input: string;
  private position: number;

  constructor(tokens: CitationToken[]) {
    this.tokens = tokens;
    this.currentToken = 0;
    this.input = tokens[0].text;
    this.position = 0;
  }

  private hasMore(): boolean {
    return this.position < this.input.length;
  }

  private peek(index?: number): string {
    if (!this.hasMore()) {
      return "";
    }
    const pos = index != undefined ? index : this.position;

    return this.input[pos];
  }

  // Same as consumeUntil, but does not consume
  private peekUntil(predicate: (consumedText: string, char: string) => boolean): string {
    let result = "";
    let startingPosition = this.position;

    while (
      startingPosition < this.input.length &&
      !predicate(result, this.peek(startingPosition))
    ) {
      result += this.input[startingPosition++];
    }
    return result;
  }

  // If we consume the last character of the current token and there are more tokens to check,
  // We update the input position and token
  private consume(): string {
    return this.hasMore() ? this.input[this.position++] : "";
  }

  private consumeUntil(predicate: (consumedText: string, char: string) => boolean): string {
    let result = "";
    while (this.hasMore() && !predicate(result, this.peek())) {
      result += this.consume();
    }
    return result;
  }

  // Generation assumption: If a colon is found, then the authors section is over.
  //
  // MLA:
  //   - Conover, Mary Boudreau. Understanding electrocardiography.
  //   - Einstein, Albert. "The general theory of relativity."
  //   - Valente, Andreia, et al. "Empathic aurea:
  //
  // APA:
  //   - Conover, M. B. (2002).
  //   - Einstein, A. (1922). The general theory of relativity.
  //   - Valente, A., Lopes, D. S., Nunes, N., & Esteves, A. (2022, March).
  //
  // CHICAGO:
  //   - Conover, Mary Boudreau. Understanding electrocardiography.
  //   - Einstein, Albert. "The general theory of relativity."
  //   - Valente, Andreia, Daniel Simoes Lopes, Nuno Nunes, and Augusto Esteves. "Empathic aurea:
  //
  // HARVARD:
  //   - Conover, M.B., 2002. Understanding electrocardiography
  //   - Einstein, A., 1922. The general theory of relativity.
  //   - Valente, A., Lopes, D.S., Nunes, N. and Esteves, A., 2022, March. Empathic aurea:
  //
  // VANCOUVER:
  //   - Conover MB. Understanding electrocardiography.
  //   - Einstein A. The general theory of relativity.
  //   - Valente A, Lopes DS, Nunes N, Esteves A. Empathic aurea:
  //
  // UNKNOWN:
  //   - M. B. Conover.
  //   - W. S. Helton and K. Naswall.
  //   - L. C. Li.
  //
  private parseAuthors(): string {
    let text = this.peekUntil((_, char) => char === "," || char === "." || char === ":");

    // If there is only one character and then a full stop, then it's the unknown format.
    if (text.length === 1) {
      return this.consumeUntil(() => this.isEndOfAuthorsUnknownFormat());
    }

    // Vancouver style doesn't have a comma after the first name, so it is the easiest to identify.
    // It ends when we find the first full stop.
    if (text.includes(" ")) {
      return this.consumeUntil((_, char) => char === "." || char === ":");
    }

    // Next, check if the second name isn't an initial.
    // Parse until two commas are found, or a full stop is found
    // If it isn't, then it's MLA or CHICAGO, while both can be parsed until a final stop is found
    text = this.peekUntil(
      (peekedText, char) =>
        (peekedText.includes(",") && char === ",") || char === "." || char === ":",
    );

    const splitText = text.split(",");
    const textHasTwoElements = splitText.length === 2;
    if (textHasTwoElements && splitText[1].length === 1) {
      return this.consumeUntil((_, char) => char === "." || char === ":");
    }

    // APA and HARVARD are missing by this point
    // Both end with the year after the authors section, so we try to parse it
    return this.consumeUntil(() => this.isEndOfAuthorsByFindingYear());
  }

  private isEndOfAuthorsUnknownFormat(): boolean {
    let pos = this.position;

    if (pos === 0) {
      return false;
    }
    if (this.input.length < 2) {
      return false;
    }

    const twoPreviousChar = this.input[pos - 2];
    const previousChar = this.input[pos - 1];
    const currentChar = this.input[pos];

    return (
      isLetter(twoPreviousChar) &&
      isLetter(previousChar) &&
      (currentChar === "." || currentChar === ":")
    );
  }

  // If we find a number, then we assume that is year the year and return true.
  private isEndOfAuthorsByFindingYear(): boolean {
    let pos = this.position;

    const currentChar = this.input[pos];

    if (currentChar != ".") {
      return false;
    }

    // We keep looking ahead until we find a character that is either a letter or a number.
    while (true) {
      pos++;
      if (pos >= this.input.length) {
        return false;
      }
      var nextChar = this.input[pos];
      if (isLetter(nextChar)) {
        return false;
      }
      if (isDigit(nextChar)) {
        return true;
      }
    }
  }

  // 3 scenarios:
  //
  // 1. There is a year (only a year)
  // 2. There is a year and a month, comma separated.
  // 3. There is no year nor month.
  //
  // Scenarios 1 and 2 can have parantheses, so they should be removed.
  private tryParseYear(): string | null {
    const incomingText = this.peekUntil((_, char) => char === ".");
    const parsedText = incomingText
      .replace(/[\(\)]/g, "")
      .trim()
      .split(",");

    const isYear = /\d{4}/.test(parsedText[0].trim());

    if (!isYear) {
      return null;
    }

    // Found a year, so we need to consume the text
    this.consumeUntil((_, char) => char === ".");
    this.consume(); // consume dot
    return incomingText;
  }

  private changeTokensIfNeeded(): void {
    if (!this.hasMore() && this.currentToken + 1 < this.tokens.length) {
      this.currentToken++;
      this.input = this.tokens[this.currentToken].text;
      this.position = 0;
    }
  }

  // This tokenizer checks for:
  // Authors, year, title, conference
  // Authors, title, conference
  public tokenize(): ParsedCitation | null {
    try {
      const authors = this.parseAuthors();
      this.consume(); // consume the dot
      this.changeTokensIfNeeded();

      // Tries to parse an year. If found, consumes it
      const year = this.tryParseYear();
      // Consume whitespace
      this.consumeUntil((_, char) => !/\s/.test(char));
      this.changeTokensIfNeeded();

      // Parse title (ends with a period)
      const title = this.consumeUntil((_, char) => char === ".");
      this.consume(); // consume the dot
      // Consume whitespace
      this.consumeUntil((_, char) => !/\s/.test(char));
      this.changeTokensIfNeeded();

      // Parse conference name (ends with a comma or end of string)
      const conferenceName = this.consumeUntil((_, char) => char === ",");

      const originalText = this.tokens.map((t) => t.text).join(" ");
      return new ParsedCitation(
        originalText,
        authors.trim(),
        title.trim(),
        conferenceName.trim(),
        year,
      );
    } catch (error) {
      console.log("Unexpected error! ");
      console.log(error);
      return null;
    }
  }
}
function isLetter(token: string): boolean {
  if (token === undefined) {
    return false;
  }
  return /[a-zA-Z]/.test(token);
}

function isDigit(token: string): boolean {
  if (token === undefined) {
    return false;
  }
  return /^\d$/.test(token);
}
