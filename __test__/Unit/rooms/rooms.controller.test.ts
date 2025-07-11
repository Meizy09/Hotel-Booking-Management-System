import { Request, Response } from "express";
import * as roomController from "../../../src/Rooms/rooms.controller";
import * as roomService from "../../../src/Rooms/rooms.services";

jest.mock("../../../src/Rooms/rooms.services");

const mockRes = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  return res as Response;
};

describe("Room Controller", () => {
  const mockRoom = {
    Room_id: 1,
    Hotel_id: 2,
    Room_type: "Deluxe",
    Price_per_night: 150.00,
    Capacity: 2,
    Amenities: "Wi-Fi, TV, AC",
    is_available: true,
    Created_at: "2025-07-10T12:00:00Z",
    Updated_at: "2025-07-10T12:00:00Z"
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllRooms should return all rooms", async () => {
    (roomService.getAllRooms as jest.Mock).mockResolvedValue([mockRoom]);

    const req = {} as Request;
    const res = mockRes();

    await roomController.getAllRooms(req, res);

    expect(res.json).toHaveBeenCalledWith([mockRoom]);
  });

  test("getRoomById should return room if found", async () => {
    const req = { params: { id: "1" } } as unknown as Request;
    const res = mockRes();
    (roomService.getRoomById as jest.Mock).mockResolvedValue(mockRoom);

    await roomController.getRoomById(req, res);

    expect(res.json).toHaveBeenCalledWith(mockRoom);
  });

  test("getRoomById should return 404 if not found", async () => {
    const req = { params: { id: "99" } } as unknown as Request;
    const res = mockRes();
    (roomService.getRoomById as jest.Mock).mockResolvedValue(undefined);

    await roomController.getRoomById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Room not found" });
  });

  test("createRoom should return 201 and created room", async () => {
    const req = { body: mockRoom } as Request;
    const res = mockRes();
    (roomService.createRoom as jest.Mock).mockResolvedValue(mockRoom);

    await roomController.createRoom(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockRoom);
  });

  test("updateRoom should return updated room", async () => {
    const req = { params: { id: "1" }, body: { Room_type: "Suite" } } as unknown as Request;
    const res = mockRes();
    const updatedRoom = { ...mockRoom, Room_type: "Suite" };
    (roomService.updateRoom as jest.Mock).mockResolvedValue(updatedRoom);

    await roomController.updateRoom(req, res);

    expect(res.json).toHaveBeenCalledWith(updatedRoom);
  });

  test("deleteRoom should return 204 on success", async () => {
    const req = { params: { id: "1" } } as unknown as Request;
    const res = mockRes();
    (roomService.deleteRoom as jest.Mock).mockResolvedValue(undefined);

    await roomController.deleteRoom(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
