import { Router } from "express";

import {
    getStreamingByFilmId,
    getStreamingByImdb
} from "../controllers/streaming.controller.js";

const router = Router();

router.get("/imdb/:imdbId", getStreamingByImdb);

router.get("/:id", getStreamingByFilmId);

export default router;