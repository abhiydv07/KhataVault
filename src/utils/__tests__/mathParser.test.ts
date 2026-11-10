import { describe, it, expect } from 'vitest';
import { parseExpression, evaluateExpression } from '../mathParser';

describe('Math Expression Parser', () => {
  it('parses simple numbers', () => {
    expect(evaluateExpression('1500')).toBe(1500);
    expect(evaluateExpression('0')).toBe(0);
    expect(evaluateExpression('-500')).toBe(-500);
    expect(evaluateExpression(2500)).toBe(2500);
  });

  it('parses expressions like 1570+3135', () => {
    expect(evaluateExpression('1570+3135')).toBe(4705);
  });

  it('parses multi-term additions and subtractions', () => {
    expect(evaluateExpression('120000+15000-5000')).toBe(130000);
    expect(evaluateExpression('18500+2300')).toBe(20800);
  });

  it('parses multiplication and division with correct operator precedence', () => {
    expect(evaluateExpression('500*2+300')).toBe(1300);
    expect(evaluateExpression('300+500*2')).toBe(1300);
    expect(evaluateExpression('1000/4')).toBe(250);
  });

  it('supports parentheses', () => {
    expect(evaluateExpression('(1500+200)*2')).toBe(3400);
    expect(evaluateExpression('100*(5+5)')).toBe(1000);
  });

  it('handles Indian comma formatted inputs and currency symbols gracefully', () => {
    expect(evaluateExpression('1,500 + 3,000')).toBe(4500);
    expect(evaluateExpression('₹ 25,000 + ₹ 5,000')).toBe(30000);
  });

  it('handles typing in progress without crashing', () => {
    // When user has typed "1500+" but not the second number yet
    expect(evaluateExpression('1500+')).toBe(1500);
    expect(evaluateExpression('2000-')).toBe(2000);
    expect(evaluateExpression('')).toBe(0);
    expect(evaluateExpression('   ')).toBe(0);
  });

  it('reports error on completely invalid string', () => {
    const res = parseExpression('abc');
    expect(res.isValid).toBe(false);
  });
});

