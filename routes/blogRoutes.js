const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");

const {
    getAllBlogs,
    getUserBlogs,
    getBlogContent,
    createBlog,
    updateBlog,
    deleteBlog,
} = require("../controllers/blogController");

router.get("/view/:sortType", getAllBlogs);
router.get("/user", authenticateUser, getUserBlogs);
router.get("/content/:blogId", getBlogContent);
router.post("/create", authenticateUser, createBlog);
router.put("/update", authenticateUser, updateBlog);
router.delete("/delete", authenticateUser, deleteBlog);

module.exports = router;
