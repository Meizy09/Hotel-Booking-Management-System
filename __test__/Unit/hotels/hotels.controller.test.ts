import { Request, Response } from "express";
import * as hotelController from "../../../src/Hotels/hotels.controller";
import * as hotelService from "../../../src/Hotels/hotels.services";

jest.mock("../../../src/Hotels/hotels.services");

const mockRes = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  return res as Response;
};

describe("Hotel Controller", () => {
  const mockHotel = {
    Hotel_id: 1,
    Name: "Palm View Hotel",
    Location: "Nairobi",
    Address: "123 Kenyatta Ave",
    Contact_phone: 721234567,
    Category: "Luxury",
    Rating: 4.8,
    Created_at: "2025-07-10T12:00:00Z",
    Updated_at: "2025-07-10T12:00:00Z",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllHotels should return all hotels", async () => {
    const req = {} as Request;
    const res = mockRes();
    (hotelService.getAllHotels as jest.Mock).mockResolvedValue([mockHotel]);

    await hotelController.getAllHotels(req, res);
    expect(res.json).toHaveBeenCalledWith([mockHotel]);
  });

  test("getHotelById should return a hotel if found", async () => {
    const req = { params: { id: "1" } } as unknown as Request;
    const res = mockRes();
    (hotelService.getHotelById as jest.Mock).mockResolvedValue(mockHotel);

    await hotelController.getHotelById(req, res);
    expect(res.json).toHaveBeenCalledWith(mockHotel);
  });

  test("getHotelById should return 404 if hotel not found", async () => {
    const req = { params: { id: "99" } } as unknown as Request;
    const res = mockRes();
    (hotelService.getHotelById as jest.Mock).mockResolvedValue(undefined);

    await hotelController.getHotelById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Hotel not found" });
  });

  test("createHotel should return 201 and new hotel", async () => {
    const req = { body: mockHotel } as Request;
    const res = mockRes();
    (hotelService.createHotel as jest.Mock).mockResolvedValue(mockHotel);

    await hotelController.createHotel(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockHotel);
  });

  test("updateHotel should return updated hotel", async () => {
    const req = { params: { id: "1" }, body: { Name: "Updated Hotel" } } as unknown as Request;
    const res = mockRes();
    const updated = { ...mockHotel, Name: "Updated Hotel" };
    (hotelService.updateHotel as jest.Mock).mockResolvedValue(updated);

    await hotelController.updateHotel(req, res);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test("deleteHotel should return 204 on success", async () => {
    const req = { params: { id: "1" } } as unknown as Request;
    const res = mockRes();
    (hotelService.deleteHotel as jest.Mock).mockResolvedValue(undefined);

    await hotelController.deleteHotel(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
