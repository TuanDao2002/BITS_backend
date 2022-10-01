const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");

const {
	getComments,
	createComment,
	updateComment,
	deleteComment,
} = require("../controllers/commentController");

router.get("/view/:blogId", authenticateUser, getComments);
router.post("/create", authenticateUser, createComment);
router.put("/update", authenticateUser, updateComment);
router.delete("/delete/:commentId", authenticateUser, deleteComment);

module.exports = router;
