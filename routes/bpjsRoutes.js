import express from "express";
import { checkBpjsV2 } from "../controller/bpjsController.js";

const router = express.Router();

router.get("/check1", checkBpjsV2);

export default router;
