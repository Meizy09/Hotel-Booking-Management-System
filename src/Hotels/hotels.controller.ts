import { Request, Response } from "express";
import * as hotelService from "../Hotels/hotels.services";

export const getAllHotels = async (_req: Request, res: Response) => {
  try {
    const hotels = await hotelService.getAllHotels();
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels", error });
  }
};

export const getHotelById = async (req: Request, res: Response) => {
  try {
    const hotel = await hotelService.getHotelById(Number(req.params.id));
    if (!hotel) {
        res.status(404).json({ message: "Hotel not found" });
    }
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotel", error });
  }
};

export const createHotel = async (req: Request, res: Response) => {
  try {
    const newHotel = await hotelService.createHotel(req.body);
    res.status(201).json(newHotel);
  } catch (error) {
    console.error("error creating hotel:", error);
    res.status(500).json({ message: "Error creating hotel", error });
  }
};

export const updateHotel = async (req: Request, res: Response) => {
  try {
    const updatedHotel = await hotelService.updateHotel(Number(req.params.id), req.body);
    res.json(updatedHotel);
  } catch (error) {
    res.status(500).json({ message: "Error updating hotel", error });
  }
};

export const deleteHotel = async (req: Request, res: Response) => {
  try {
    await hotelService.deleteHotel(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting hotel", error });
  }
};
