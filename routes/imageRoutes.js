const express = require("express");
const router = express.Router();

const { uploadUserImage } = require("../controllers/imageController");
router.post("/upload-image", uploadUserImage);

module.exports = router;