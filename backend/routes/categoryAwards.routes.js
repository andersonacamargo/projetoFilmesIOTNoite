import express from "express";
import { getWinsByCategory } from "../controllers/categoryAwards.controller.js";

const router = express.Router();

// ceremony_id é opcional: sem ele, devolve os ganhadores de todas as cerimônias.
router.get("/category-awards{/:ceremony_id}", getWinsByCategory);

export default router;
