const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

const Blog = require("../models/Blog");
const BlogLike = require("../models/BlogLike");
const mongoose = require("mongoose");

const verifyBlog = require("../utils/verifyBlog");
const descriptionLength = 200;
const speedToRead = 300; // 300 words per minute

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
        .populate({ path: "user", select: "-password" });

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
        user: { userId },
        query: { title, category, next_cursor },
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
        .populate({ path: "user", select: "-password" });

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

    const blog = await Blog.findOne({ _id: blogId }).populate({
        path: "likes",
        select: "_id user -blog",
        populate: {
            path: "user",
            select: "-password",
        },
    });

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

    verifyBlog(title, banner, category, content);

    const newBlog = await Blog.create({
        user: userId,
        title,
        description: content.slice(0, descriptionLength),
        banner: banner ? banner : "default",
        category,
        content,
        timeToRead: Math.ceil(content.length / speedToRead),
        heartCount: 0,
    });

    res.status(StatusCodes.OK).json({ blog: newBlog });
};

const updateBlog = async (req, res) => {
    const {
        user: { userId },
        body: { blogId, title, banner, category, content },
    } = req;

    verifyBlog(title, banner, category, content);

    const blog = await Blog.findOne({ _id: blogId, user: userId });
    if (!blog) {
        throw new CustomError.BadRequestError(
            "This blog does not exist or you are not allowed to edit this blog"
        );
    }

    if (title) {
        blog.title = title;
    }

    if (banner) {
        blog.banner = banner;
    }

    if (category) {
        blog.category = category;
    }

    if (content) {
        blog.content = content;
        blog.description = content.slice(0, descriptionLength);
        blog.timeToRead = Math.ceil(content.length / speedToRead);
    }

    await blog.save();

    res.status(StatusCodes.OK).json({ blog });
};

const deleteBlog = async (req, res) => {
    const {
        user: { userId },
        params: { blogId },
    } = req;

    const blog = await Blog.findOne({ _id: blogId, user: userId });
    if (!blog) {
        throw new CustomError.BadRequestError(
            "This blog does not exist or you are not allowed to delete this blog"
        );
    }

    await blog.remove();
    res.status(StatusCodes.OK).json({ msg: "Blog is removed" });
};

const likeBlog = async (req, res) => {
    const {
        user: { userId },
        params: { blogId },
    } = req;

    const like = await BlogLike.findOne({ user: userId, blog: blogId });
    if (like) {
        throw new CustomError.BadRequestError("You already liked this blog");
    }

    const blog = await Blog.findOne({ _id: blogId }).populate({
        path: "likes",
        select: "_id user -blog",
        populate: {
            path: "user",
            select: "-password",
        },
    });

    if (!blog) {
        throw new CustomError.BadRequestError("This blog does not exist");
    }

    blog.heartCount++;
    await blog.save();
    await BlogLike.create({ user: userId, blog: blogId });

    await res.status(StatusCodes.OK).json({ blog });
};

const unLikeBlog = async (req, res) => {
    const {
        user: { userId },
        params: { blogId },
    } = req;

    const like = await BlogLike.findOne({ user: userId, blog: blogId });
    if (!like) {
        throw new CustomError.BadRequestError("You did not like this blog");
    }

    const blog = await Blog.findOne({ _id: blogId }).populate({
        path: "likes",
        select: "_id user -blog",
        populate: {
            path: "user",
            select: "-password",
        },
    });

    if (!blog) {
        throw new CustomError.BadRequestError("This blog does not exist");
    }

    blog.heartCount--;
    await blog.save();
    await like.remove();

    await res.status(StatusCodes.OK).json({ blog });
};

module.exports = {
    getAllBlogs,
    getUserBlogs,
    getBlogContent,
    createBlog,
    updateBlog,
    deleteBlog,
    likeBlog,
    unLikeBlog,
};
