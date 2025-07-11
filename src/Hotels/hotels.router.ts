import { Router } from "express";
import {
  getAllHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  getHotelById,
} from "../Hotels/hotels.controller";

const router = Router();

router.get("/", getAllHotels);
router.get("/:id", getHotelById);
router.post("/", createHotel);
router.patch("/:id", updateHotel);
router.delete("/:id", deleteHotel);

export default router;
