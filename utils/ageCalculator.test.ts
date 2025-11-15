import { getAge } from "./ageCalculator.ts";

describe("getAge", () => {
  it("should return 0 for undefined dateOfBirth", () => {
    expect(getAge(undefined)).toBe(0);
  });

  it("should return 0 for an empty string", () => {
    expect(getAge("")).toBe(0);
  });

  it("should return correct age for valid dateOfBirth", () => {
    const dateOfBirth = new Date("2000-01-01");
    expect(getAge(dateOfBirth)).toBe(new Date().getFullYear() - 2000);
  });

  it("should return correct age for dateOfBirth as string", () => {
    const dateOfBirth = "2000-01-01";
    expect(getAge(dateOfBirth)).toBe(new Date().getFullYear() - 2000);
  });

  it("should return correct age when birthday has not occurred yet this year", () => {
    const dateOfBirth = new Date(new Date().getFullYear(), 12, 31); // December 31
    expect(getAge(dateOfBirth)).toBe(new Date().getFullYear() - dateOfBirth.getFullYear());
  });

  it("should return correct age when birthday is today", () => {
    const dateOfBirth = new Date();
    expect(getAge(dateOfBirth)).toBe(0);
  });
});
