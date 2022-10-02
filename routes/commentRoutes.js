const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");

const {
	getComments,
	createComment,
	updateComment,
	deleteComment,
	likeComment,
	unLikeComment
} = require("../controllers/commentController");

router.get("/view/:blogId", getComments);
router.post("/create", authenticateUser, createComment);
router.put("/update", authenticateUser, updateComment);
router.delete("/delete/:commentId", authenticateUser, deleteComment);
router.put("/like/:commentId", authenticateUser, likeComment);
router.put("/unLike/:commentId", authenticateUser, unLikeComment);

module.exports = router;
