import { Router } from "express";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
} from "../Payments/payments.controller";

const router = Router();

router.get("/", getAllPayments);
router.get("/:id", getPaymentById);
router.post("/", createPayment);
router.patch("/:id", updatePayment);
router.delete("/:id", deletePayment);

export default router;
