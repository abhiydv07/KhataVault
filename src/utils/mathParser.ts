/**
 * Safe Math Expression Parser
 * Evaluates basic arithmetic expressions without eval() or Function().
 * Handles +, -, *, /, parenthesis, decimals, negative numbers, and comma-separated numbers (e.g. 1,500 + 3,000).
 */

export interface ParseResult {
  value: number;
  isValid: boolean;
  error?: string;
}

export function evaluateExpression(input: string | number | undefined | null): number {
  if (input === undefined || input === null) return 0;
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : input;
  }

  const res = parseExpression(input);
  return res.isValid ? res.value : 0;
}

export function parseExpression(rawInput: string): ParseResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return { value: 0, isValid: true };
  }

  // Remove commas, whitespace, and currency symbols
  let cleaned = rawInput.replace(/,/g, '').replace(/[₹\s]/g, '');

  if (cleaned.trim() === '') {
    return { value: 0, isValid: true };
  }

  // If user ends with an operator while typing (e.g., "1500+"), strip trailing operators for preview
  const trailingOperatorRegex = /[\+\-\*\/]+$/;
  cleaned = cleaned.replace(trailingOperatorRegex, '');

  if (cleaned.trim() === '') {
    return { value: 0, isValid: true };
  }

  try {
    const tokens = tokenize(cleaned);
    if (tokens.length === 0) {
      return { value: 0, isValid: true };
    }
    const parser = new Parser(tokens);
    const value = parser.parse();
    if (isNaN(value) || !isFinite(value)) {
      return { value: 0, isValid: false, error: 'Result is not a finite number' };
    }
    return { value: Math.round(value * 100) / 100, isValid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid math expression';
    return { value: 0, isValid: false, error: message };
  }
}

type TokenType = 'NUMBER' | 'PLUS' | 'MINUS' | 'MULTIPLY' | 'DIVIDE' | 'LPAREN' | 'RPAREN';

interface Token {
  type: TokenType;
  value?: number;
}

function tokenize(str: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < str.length) {
    const char = str[i];

    if (char === ' ') {
      i++;
      continue;
    }

    if (char === '+') {
      tokens.push({ type: 'PLUS' });
      i++;
      continue;
    }

    if (char === '-') {
      // Check if this is a unary negative or binary subtraction
      const prev = tokens[tokens.length - 1];
      const isUnary = !prev || prev.type === 'PLUS' || prev.type === 'MINUS' || prev.type === 'MULTIPLY' || prev.type === 'DIVIDE' || prev.type === 'LPAREN';
      if (isUnary) {
        // Read next number
        i++;
        let numStr = '-';
        while (i < str.length && (/[0-9.]/.test(str[i]))) {
          numStr += str[i];
          i++;
        }
        if (numStr === '-') {
          throw new Error('Unexpected minus sign');
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      } else {
        tokens.push({ type: 'MINUS' });
        i++;
        continue;
      }
    }

    if (char === '*' || char === 'x' || char === 'X') {
      tokens.push({ type: 'MULTIPLY' });
      i++;
      continue;
    }

    if (char === '/') {
      tokens.push({ type: 'DIVIDE' });
      i++;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'LPAREN' });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN' });
      i++;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let numStr = '';
      let hasDot = false;
      while (i < str.length && (/[0-9]/.test(str[i]) || (str[i] === '.' && !hasDot))) {
        if (str[i] === '.') hasDot = true;
        numStr += str[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }

    throw new Error(`Invalid character: '${char}'`);
  }

  return tokens;
}

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(expectedType?: TokenType): Token {
    const token = this.tokens[this.pos];
    if (!token) {
      throw new Error('Unexpected end of expression');
    }
    if (expectedType && token.type !== expectedType) {
      throw new Error(`Expected ${expectedType} but found ${token.type}`);
    }
    this.pos++;
    return token;
  }

  public parse(): number {
    const val = this.expression();
    if (this.pos < this.tokens.length) {
      throw new Error('Unexpected tokens after expression');
    }
    return val;
  }

  // expr = term (( '+' | '-' ) term)*
  private expression(): number {
    let result = this.term();

    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (!token) break;

      if (token.type === 'PLUS') {
        this.consume('PLUS');
        result += this.term();
      } else if (token.type === 'MINUS') {
        this.consume('MINUS');
        result -= this.term();
      } else {
        break;
      }
    }

    return result;
  }

  // term = factor (( '*' | '/' ) factor)*
  private term(): number {
    let result = this.factor();

    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (!token) break;

      if (token.type === 'MULTIPLY') {
        this.consume('MULTIPLY');
        result *= this.factor();
      } else if (token.type === 'DIVIDE') {
        this.consume('DIVIDE');
        const divisor = this.factor();
        if (divisor === 0) {
          throw new Error('Division by zero');
        }
        result /= divisor;
      } else {
        break;
      }
    }

    return result;
  }

  // factor = NUMBER | '(' expr ')' | '-' factor | '+' factor
  private factor(): number {
    const token = this.peek();
    if (!token) {
      throw new Error('Unexpected end of expression in factor');
    }

    if (token.type === 'PLUS') {
      this.consume('PLUS');
      return this.factor();
    }

    if (token.type === 'MINUS') {
      this.consume('MINUS');
      return -this.factor();
    }

    if (token.type === 'NUMBER') {
      this.consume('NUMBER');
      return token.value ?? 0;
    }

    if (token.type === 'LPAREN') {
      this.consume('LPAREN');
      const val = this.expression();
      this.consume('RPAREN');
      return val;
    }

    throw new Error(`Unexpected token: ${token.type}`);
  }
}

