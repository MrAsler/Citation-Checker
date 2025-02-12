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
  private peekUntil(
    predicate: (consumedText: string, char: string) => boolean,
    start?: number,
  ): string {
    let result = "";

    let pos = start != undefined ? start : this.position;

    while (pos < this.input.length && !predicate(result, this.peek(pos))) {
      result += this.input[pos++];
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
  //   - Anisi, David A. Optimal motion control
  //   - Sel, Alejandra, Ruben T. Azevedo, and Manos Tsakiris. "Heartfelt self:
  //   - Anisi, David A., Erik Persson, and Clint Heyer. "Real-world demonstration
  //   - T. Azevedo, Ruben, et al. "The calming effect of a new
  //
  //
  // APA:
  //   - Conover, M. B. (2002).
  //   - Einstein, A. (1922). The general theory of relativity.
  //   - Valente, A., Lopes, D. S., Nunes, N., & Esteves, A. (2022, March).
  //   - Anisi, D. A. (2003). Optimal motion
  //   - Sel, A., Azevedo, R. T., & Tsakiris, M. (2017). Heartfelt self:
  //   - Anisi, D. A., Persson, E., & Heyer, C. (2011, September). Real-world demonstration
  //   - T. Azevedo, R., Bennett, N., Bilicki, A., Hooper, J., Markopoulou, F., & Tsakiris, M. (2017). The calming effect
  //
  // CHICAGO:
  //   - Conover, Mary Boudreau. Understanding electrocardiography.
  //   - Einstein, Albert. "The general theory of relativity."
  //   - Valente, Andreia, Daniel Simoes Lopes, Nuno Nunes, and Augusto Esteves. "Empathic aurea:
  //   - Anisi, David A. "Optimal motion control
  //   - Sel, Alejandra, Ruben T. Azevedo, and Manos Tsakiris. "Heartfelt self:
  //   - Anisi, David A., Erik Persson, and Clint Heyer. "Real-world demonstration
  //   - T. Azevedo, Ruben, Nell Bennett, Andreas Bilicki, Jack Hooper, Fotini Markopoulou, and Manos Tsakiris. "The calming
  //
  //
  // HARVARD:
  //   - Conover, M.B., 2002. Understanding electrocardiography
  //   - Einstein, A., 1922. The general theory of relativity.
  //   - Valente, A., Lopes, D.S., Nunes, N. and Esteves, A., 2022, March. Empathic aurea:
  //   - Anisi, D.A., 2003. Optimal motion control
  //   - Sel, A., Azevedo, R.T. and Tsakiris, M., 2017. Heartfelt self: cardio-visual
  //   - Anisi, D.A., Persson, E. and Heyer, C., 2011, September. Real-world demonstration
  //   - T. Azevedo, R., Bennett, N., Bilicki, A., Hooper, J., Markopoulou, F. and Tsakiris, M., 2017. The calming effect
  //
  // VANCOUVER:
  //   - Conover MB. Understanding electrocardiography.
  //   - Einstein A. The general theory of relativity.
  //   - Valente A, Lopes DS, Nunes N, Esteves A. Empathic aurea:
  //   - Anisi DA. Optimal motion control
  //   - Sel A, Azevedo RT, Tsakiris M. Heartfelt self: cardio-visual
  //   - Anisi DA, Persson E, Heyer C. Real-world demonstration
  //   - T. Azevedo R, Bennett N, Bilicki A, Hooper J, Markopoulou F, Tsakiris M. The calming effect
  //
  // UNKNOWN:
  //   - M. B. Conover.
  //   - W. S. Helton and K. Naswall.
  //   - L. C. Li.
  //
  private parseAuthors(): string {
    // First, we get all the text until the first special character.
    let text = this.peekUntil((_, char) => char === "," || char === "." || char === ":");

    //  --- UNKNOWN STLYE IDENTIFICATION ---
    // If there is only one character and then a full stop, then it's the unknown format.
    if (text.length === 1) {
      console.log("unknown");
      return this.consumeUntil(() => this.isEndOfAuthorsUnknownFormat());
    }

    // --- VANCOUVER IDENTIFICATION ---
    // Vancouver style is always last name (full) and then only the initials of the author.
    // It always contains an year, so we can look for it.
    if (text.includes(" ")) {
      return this.consumeUntil(() => this.isEndOfAuthorsByFindingYear());
      //return this.consumeUntil((_, char) => char === "." || char === ":");
    }

    // --- APA and HARVARD ---
    // Both of these styles start with a full word (more than 2 characters before the first comma) and then only have initials, followed by a year.
    if (this.authorsTextIsApaOrHarvard()) {
      console.log("apa");
      this.consumeUntil(() => this.isEndOfAuthorsByFindingYear());
    }

    // --- MLA AND CHICAGO IDENTIFICATION ---
    // MLA always ends with a final stop and white space, without a comma in the next word.
    // Since these are the last formats, parse the data expecting this assumption to be true.
    console.log("mla");
    return this.parseAuthorsInMlaOrChicagoFormat();
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

  // First we collect all text until the first comma,
  // which we verify that is longer than 2 characters (so not an initial).
  // Then, we expect to find an initial.
  // If find the initial, then it means that this is Apa or Harvard.
  private authorsTextIsApaOrHarvard(): boolean {
    var pos = this.position;
    var text = "";
    // Step 1: Ensure the first word is not an initial
    while (pos < this.input.length) {
      const currentChar = this.input[pos++];
      text += currentChar;

      if (currentChar === ",") {
        if (text.length === 1) {
          return false;
        } else {
          break;
        }
      }
    }

    text = "";
    // Step 2: Ensure the next thing we find is an initial.
    while (pos < this.input.length) {
      const currentChar = this.input[pos++];

      // Skip whitespace
      if (currentChar != " ") {
        text += currentChar;
      }

      // Found the full stop. If we have an initial by this point, then it is APA/Harvard!
      if (currentChar === ".") {
        return text.length === 1;
      }
    }

    return false;
  }

  // The first author is always separated with two commas.
  // If there is only a comma then a full stop without any commas, then it is a single author.
  // Otherwise, we end when we find a full stop after a word (not initial)
  private parseAuthorsInMlaOrChicagoFormat(): string {
    var text = "";
    text += this.consumeUntil((_, c) => c === ",");
    text += this.consumeUntil((_, c) => c === ".");

    // If there is only one author, then we return it.
    if (this.input[this.position + 1] != ",") {
      return text;
    }

    text += this.consumeUntil((consumedText, c) => {
      if (c != ".") {
        return false;
      }

      const lastChar = consumedText[consumedText.length - 1];
      return lastChar.toUpperCase() !== lastChar;
    });

    return text;
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
