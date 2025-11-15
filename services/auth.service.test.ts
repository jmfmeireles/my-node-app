import { Credentials, registerUser, loginUser } from "./auth.service.ts";

// Mock bcrypt before importing
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock User model
jest.mock("../models/user.model.ts", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

import * as bcrypt from "bcrypt";
import User from "../models/user.model.ts";

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedUser = User as jest.Mocked<typeof User>;

describe("Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should throw an error if password is undefined", async () => {
      await expect(
        registerUser({ username: "testuser", password: undefined } as unknown as Credentials)
      ).rejects.toThrow("Password must be at least 6 characters long");
    });

    it("should throw an error if password is too short", async () => {
      await expect(registerUser({ username: "testuser", password: "12345" })).rejects.toThrow(
        "Password must be at least 6 characters long"
      );
    });

    it("should register a user successfully with a valid password", async () => {
      const hashedPassword = "hashed_validpassword";
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockedUser.create.mockResolvedValue({
        id: 1,
        username: "testuser",
        password: hashedPassword,
      } as any);

      const response = await registerUser({ username: "testuser", password: "validpassword" });

      expect(response).toEqual({ message: "User registered successfully", userId: 1 });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith("validpassword", 10);
      expect(mockedUser.create).toHaveBeenCalledWith({
        username: "testuser",
        password: hashedPassword,
      });
    });
  });

  describe("loginUser", () => {
    it("should throw an error if user not found", async () => {
      mockedUser.findOne.mockResolvedValue(null);

      await expect(loginUser({ username: "nonexistent", password: "password" })).rejects.toThrow(
        "User not found"
      );
    });

    it("should throw an error if password is wrong", async () => {
      const user = { username: "testuser", password: "hashedpassword" };
      mockedUser.findOne.mockResolvedValue(user as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(loginUser({ username: "testuser", password: "wrongpassword" })).rejects.toThrow(
        "Password is wrong"
      );
    });

    it("should login successfully with correct credentials", async () => {
      const user = { username: "testuser", password: "hashedpassword" };
      mockedUser.findOne.mockResolvedValue(user as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const response = await loginUser({ username: "testuser", password: "correctpassword" });

      expect(response).toEqual({ message: "Login successful", username: "testuser" });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith("correctpassword", "hashedpassword");
    });
  });
});
