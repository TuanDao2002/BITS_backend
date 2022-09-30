const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

const Blog = require("../models/Blog");
const mongoose = require("mongoose");

const getAllBlogs = async (req, res) => {
    let {
        params: { sortType },
        query: { title, category, next_cursor },
    } = req;

    const queryObject = {};
    if (title) {
        queryObject.title = { $regex: `${title}`, $options: "i" };
    }

    if (category) {
        queryObject.category = category;
    }

    const resultsLimitPerLoading = 10;
    if (next_cursor) {
        const [heartCount, createdAt, _id] = Buffer.from(next_cursor, "base64")
            .toString("ascii")
            .split("_");

        if (sortType === "latest") {
            queryObject.createdAt = { $lte: createdAt };
            queryObject._id = { $lt: _id };
        }

        if (sortType === "favorite") {
            queryObject.$or = [
                { heartCount: { $lt: heartCount } },
                {
                    heartCount: heartCount,
                    createdAt: { $lte: new Date(createdAt) },
                    _id: { $lt: new mongoose.Types.ObjectId(_id) },
                },
            ];
        }
    }

    let blogs = Blog.find(queryObject)
        .select("-content")
        .populate({ path: "user", select: "-password -_id" });

    if (sortType === "latest") {
        blogs = blogs.sort("-createdAt -_id");
    } else if (sortType === "favorite") {
        blogs = blogs.sort("-heartCount -createdAt -_id");
    }

    blogs = blogs.limit(resultsLimitPerLoading);
    const results = await blogs;

    const count = await Blog.countDocuments(queryObject);
    const remainingResults = count - results.length;
    next_cursor = null;
    if (results.length !== count) {
        const lastResult = results[results.length - 1];
        next_cursor = Buffer.from(
            lastResult.heartCount +
                "_" +
                lastResult.createdAt.toISOString() +
                "_" +
                lastResult._id
        ).toString("base64");
    }

    res.status(StatusCodes.OK).json({
        results,
        remainingResults,
        next_cursor,
    });
};

const getUserBlogs = async (req, res) => {
    let {
        query: { title, category, next_cursor },
        user: { userId },
    } = req;

    const queryObject = {};
    if (title) {
        queryObject.title = { $regex: `${title}`, $options: "i" };
    }

    if (category) {
        queryObject.category = category;
    }

    queryObject.user = userId;

    const resultsLimitPerLoading = 10;
    if (next_cursor) {
        const [createdAt, _id] = Buffer.from(next_cursor, "base64")
            .toString("ascii")
            .split("_");

        queryObject.createdAt = { $lte: createdAt };
        queryObject._id = { $lt: _id };
    }

    let blogs = Blog.find(queryObject)
        .select("-content")
        .populate({ path: "user", select: "-password -_id" });

    blogs = blogs.sort("-createdAt -_id");
    blogs = blogs.limit(resultsLimitPerLoading);
    const results = await blogs;

    const count = await Blog.countDocuments(queryObject);
    const remainingResults = count - results.length;
    next_cursor = null;
    if (results.length !== count) {
        const lastResult = results[results.length - 1];
        next_cursor = Buffer.from(
            lastResult.createdAt.toISOString() + "_" + lastResult._id
        ).toString("base64");
    }

    res.status(StatusCodes.OK).json({
        results,
        remainingResults,
        next_cursor,
    });
};

const getBlogContent = async (req, res) => {
    const {
        params: { blogId },
    } = req;

    const blog = await Blog.findOne({ _id: blogId });
    if (!blog) {
        throw new CustomError.BadRequestError("Blog not found");
    }

    res.status(StatusCodes.OK).json({ blog });
};

const createBlog = async (req, res) => {
    const {
        user: { userId },
        body: { title, banner, category, content },
    } = req;

    if (!title) {
        throw new CustomError.BadRequestError("Title not found");
    }

    if (!category) {
        throw new CustomError.BadRequestError("Category not found");
    }

    if (banner && !banner.match(/^https:\/\/res.cloudinary.com\//)) {
        throw new CustomError.BadRequestError(
            "Please provide a valid banner image"
        );
    }

    if (!content) {
        throw new CustomError.BadRequestError("Content not found");
    }

    const speedToRead = 300; // 300 words per minute

    const newBlog = await Blog.create({
        user: userId,
        title,
        description: content.slice(0, 200),
        banner: banner ? banner : "default",
        category,
        content,
        timeToRead: Math.ceil(content.length / speedToRead),
        heartCount: 0,
    });

    res.status(StatusCodes.OK).json({ blog: newBlog });
};

const updateBlog = async (req, res) => {};

const deleteBlog = async (req, res) => {};

module.exports = {
    getAllBlogs,
    getUserBlogs,
    getBlogContent,
    createBlog,
    updateBlog,
    deleteBlog,
};
