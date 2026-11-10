import { describe, it, expect } from 'vitest';
import { calculateSheet, createEmptyDaySheet } from '../calculatorEngine';
import { DayHisaabSheet } from '../../types/hisaab';

describe('Calculator Engine Logic', () => {
  it('calculates empty sheet with 0 values', () => {
    const sheet = createEmptyDaySheet('2026-11-10');
    const result = calculateSheet(sheet);

    expect(result.totalLena).toBe(0);
    expect(result.totalDena).toBe(0);
    expect(result.farak).toBe(0);
    expect(result.verdict).toBe('barabar');
  });

  it('correctly calculates Lena totals and excludes unchecked rows', () => {
    const sheet = createEmptyDaySheet('2026-11-10');
    sheet.lenaEntries = [
      {
        id: '1',
        friendName: 'Ramesh',
        rawExpression: '1570+3135',
        evaluatedAmount: 4705,
        countInTotal: true,
        createdAt: 0,
        updatedAt: 0
      },
      {
        id: '2',
        friendName: 'Vikas',
        rawExpression: '25000',
        evaluatedAmount: 25000,
        countInTotal: true,
        createdAt: 0,
        updatedAt: 0
      },
      {
        id: '3',
        friendName: 'Anil (Hold)',
        rawExpression: '10000',
        evaluatedAmount: 10000,
        countInTotal: false, // Ignored
        createdAt: 0,
        updatedAt: 0
      }
    ];

    const result = calculateSheet(sheet);
    expect(result.totalLena).toBe(29705);
    expect(result.avlBalance).toBe(29705);
  });

  it('correctly calculates Dena and Upline totals', () => {
    const sheet = createEmptyDaySheet('2026-11-10');
    sheet.denaEntries = [
      {
        id: 'd1',
        friendName: 'Shyam Agency',
        rawExpression: '45000',
        evaluatedAmount: 45000,
        countInTotal: true,
        upline: 500,
        rawUplineExpression: '500',
        createdAt: 0,
        updatedAt: 0
      },
      {
        id: 'd2',
        friendName: 'Pooja Garments',
        rawExpression: '20000',
        evaluatedAmount: 20000,
        countInTotal: true,
        upline: -200,
        rawUplineExpression: '-200',
        createdAt: 0,
        updatedAt: 0
      }
    ];

    const result = calculateSheet(sheet);
    expect(result.totalDena).toBe(65000);
    expect(result.totalDenaUpline).toBe(300); // 500 - 200
  });

  it('applies cash charge accurately with stepper percent on selected base', () => {
    const sheet = createEmptyDaySheet('2026-11-10');
    sheet.denaEntries = [
      {
        id: 'd1',
        friendName: 'Deepak',
        rawExpression: '100000',
        evaluatedAmount: 100000,
        countInTotal: true,
        createdAt: 0,
        updatedAt: 0
      }
    ];
    sheet.hisaabBlock.cashChargePercent = 3.25;
    sheet.hisaabBlock.cashChargeBase = 'dena';

    const result = calculateSheet(sheet);
    expect(result.cashChargeAmount).toBe(3250); // 3.25% of 100,000
  });

  it('calculates sample sheet fixture and verifies verdict', () => {
    const fixture: DayHisaabSheet = {
      id: '2026-11-10',
      date: '2026-11-10',
      lenaEntries: [
        {
          id: 'l1',
          friendName: 'Ramesh Traders',
          rawExpression: '1570+3135', // 4705
          evaluatedAmount: 4705,
          countInTotal: true,
          createdAt: 0,
          updatedAt: 0
        },
        {
          id: 'l2',
          friendName: 'Vikas Sharma',
          rawExpression: '25000',
          evaluatedAmount: 25000,
          countInTotal: true,
          createdAt: 0,
          updatedAt: 0
        },
        {
          id: 'l3',
          friendName: 'Surat Office',
          rawExpression: '120000+15000-5000', // 130000
          evaluatedAmount: 130000,
          countInTotal: true,
          createdAt: 0,
          updatedAt: 0
        },
        {
          id: 'l4',
          friendName: 'Anil Ji (Hold)',
          rawExpression: '15000',
          evaluatedAmount: 15000,
          countInTotal: false, // unchecked
          createdAt: 0,
          updatedAt: 0
        }
      ],
      denaEntries: [
        {
          id: 'd1',
          friendName: 'Shree Shyam Agency',
          rawExpression: '45000',
          evaluatedAmount: 45000,
          countInTotal: true,
          upline: 500,
          createdAt: 0,
          updatedAt: 0
        },
        {
          id: 'd2',
          friendName: 'Pooja Garments',
          rawExpression: '18500+2300', // 20800
          evaluatedAmount: 20800,
          countInTotal: true,
          upline: -200,
          createdAt: 0,
          updatedAt: 0
        },
        {
          id: 'd3',
          friendName: 'Deepak Cloth House',
          rawExpression: '62000',
          evaluatedAmount: 62000,
          countInTotal: true,
          upline: 0,
          createdAt: 0,
          updatedAt: 0
        }
      ],
      hisaabBlock: {
        cashChargePercent: 3.0,
        cashChargeBase: 'dena',
        oldCB: 15400,
        bonus: 2500,
        kharcha: 1250,
        confirmation: 5000,
        rtgs: 25000,
        customItems: [
          {
            id: 'c1',
            label: 'Hamali',
            amount: 450,
            type: 'subtract'
          }
        ]
      },
      createdAt: 0,
      updatedAt: 0
    };

    const result = calculateSheet(fixture);

    // Lena total = 4705 + 25000 + 130000 = 159705
    expect(result.totalLena).toBe(159705);

    // Dena total = 45000 + 20800 + 62000 = 127800
    expect(result.totalDena).toBe(127800);

    // Dena Upline = 500 - 200 = 300
    expect(result.totalDenaUpline).toBe(300);

    // Cash charge = 3% of 127800 = 3834
    expect(result.cashChargeAmount).toBe(3834);

    // Total Credit = Lena (159705) + Bonus (2500) + Old CB (15400) = 177605
    expect(result.totalCredit).toBe(177605);

    // Total Debit = Dena (127800) + Upline (300) + Kharcha (1250) + Confirmation (5000) + RTGS (25000) + Cash Charge (3834) + Custom Subtract (450) = 163634
    expect(result.totalDebit).toBe(163634);

    // Farak = 177605 - 163634 = 13971
    expect(result.farak).toBe(13971);
    expect(result.verdict).toBe('lena');
  });
});

