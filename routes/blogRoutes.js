const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");

const {
    getAllBlogs,
    getUserBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
} = require("../controllers/blogController");

router.get("/view", getAllBlogs);
router.get("/view/user", authenticateUser, getUserBlogs);
router.post("/create", authenticateUser, createBlog);
router.put("/update", authenticateUser, updateBlog);
router.delete("/delete", authenticateUser, deleteBlog);

module.exports = router;
