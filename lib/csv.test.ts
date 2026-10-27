import { describe, expect, it } from "vitest";
import { minorToDecimal, toCsv, type CsvColumn } from "./csv";

interface Row {
  name: string;
  amount: number | null;
}

const columns: CsvColumn<Row>[] = [
  { header: "Name", value: (r) => r.name },
  { header: "Amount", value: (r) => r.amount },
];

describe("toCsv", () => {
  it("writes a header row and CRLF line endings", () => {
    expect(toCsv(columns, [{ name: "Ada", amount: 1 }])).toBe("Name,Amount\r\nAda,1\r\n");
  });

  it("quotes cells containing commas, quotes or newlines", () => {
    const csv = toCsv(columns, [
      { name: 'Lovelace, "Ada"', amount: 1 },
      { name: "two\nlines", amount: 2 },
    ]);
    expect(csv).toBe('Name,Amount\r\n"Lovelace, ""Ada""",1\r\n"two\nlines",2\r\n');
  });

  it("writes null as an empty cell", () => {
    expect(toCsv(columns, [{ name: "Ada", amount: null }])).toBe(
      "Name,Amount\r\nAda,\r\n",
    );
  });

  it.each(['=HYPERLINK("x")', "+1", "-1+1", "@SUM(A1)", "\tcmd"])(
    "neutralises the formula in %j so a spreadsheet does not run it",
    (name) => {
      const line = toCsv(columns, [{ name, amount: 1 }]).split("\r\n")[1]!;
      expect(line.replace(/^"/, "").startsWith("'")).toBe(true);
    },
  );

  it("leaves negative numbers alone, since only text is user input", () => {
    expect(toCsv(columns, [{ name: "Ada", amount: -5 }])).toContain("Ada,-5");
  });
});

describe("minorToDecimal", () => {
  it.each([
    [8_000_050, 2, "80000.50"],
    [5, 2, "0.05"],
    [0, 2, "0.00"],
    [9_000_000, 0, "9000000"],
    [-150, 2, "-1.50"],
  ])("(%i, %i) → %s", (minor, exponent, expected) => {
    expect(minorToDecimal(minor, exponent)).toBe(expected);
  });
});
