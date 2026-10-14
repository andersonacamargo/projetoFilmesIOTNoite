import express from "express";
import { getAllCeremonies } from "../controllers/ceremony.controller.js";

const router = express.Router();

router.get("/ceremonies", getAllCeremonies);

export default router;
