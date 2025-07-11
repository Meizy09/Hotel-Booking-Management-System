import { Request, Response } from "express";
import * as roomService from "../Rooms/rooms.services";

export const getAllRooms = async (_req: Request, res: Response) => {
  try {
    const rooms = await roomService.getAllRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms", error });
  }
};

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const room = await roomService.getRoomById(Number(req.params.id));
    if (!room) {
       res.status(404).json({ message: "Room not found" });
       return;
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: "Error fetching room", error });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const newRoom = await roomService.createRoom(req.body);
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: "Error creating room", error });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const updatedRoom = await roomService.updateRoom(Number(req.params.id), req.body);
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: "Error updating room", error });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    await roomService.deleteRoom(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting room", error });
  }
};
