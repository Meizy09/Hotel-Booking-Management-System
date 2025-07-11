import { Router } from "express";
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../Rooms/rooms.controller";

const router = Router();

router.get("/", getAllRooms);
router.get("/:id", getRoomById);
router.post("/", createRoom);
router.patch("/:id", updateRoom);
router.delete("/:id", deleteRoom);

export default router;
