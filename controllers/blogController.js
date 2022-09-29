const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

const User = require("../models/User");
const Blog = require("../models/Blog");

const getAllBlogs = async (req, res) => {
    const {
        params: { sortType },
        query: { title, category, next_cursor },
    } = req;

    const queryObject = {};
    if (title) {
        queryObject.title = title;
    }

    if (category) {
        queryObject.category = category;
    }

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
                    createdAt: { $lte: createdAt },
                    _id: { $lt: _id },
                },
            ];
        }
    }

    const resultsLimitPerLoading = 10;
};

const getUserBlogs = async (req, res) => {};

const createBlog = async (req, res) => {};

const updateBlog = async (req, res) => {};

const deleteBlog = async (req, res) => {};

module.exports = {
    getAllBlogs,
    getUserBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
};
