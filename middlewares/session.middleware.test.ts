import { Request, Response, NextFunction } from "express";
import { authenticationSession } from "./session.middleware";

describe("authenticationSession middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            session: undefined,
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        nextFunction = jest.fn();
    });

    it("should call next() when session and user exist", () => {
        mockRequest.session = { user: { id: 1, name: "Test User" } } as any;

        authenticationSession(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should return 401 when session does not exist", () => {
        mockRequest.session = undefined;

        authenticationSession(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: "Unauthorized" });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 401 when session exists but user does not", () => {
        mockRequest.session = {} as any;

        authenticationSession(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: "Unauthorized" });
        expect(nextFunction).not.toHaveBeenCalled();
    });
});