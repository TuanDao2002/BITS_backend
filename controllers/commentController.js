const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

const Comment = require("../models/Comment");
const Blog = require("../models/Blog");

const getComments = async (req, res) => {
	let {
		params: { blogId },
		query: { next_cursor },
	} = req;

	const blog = Blog.findOne({ _id: blogId });
	if (!blog) {
		throw new CustomError.BadRequestError("This blog does not exist");
	}

	const queryObject = {};
	queryObject.blog = blogId;

	const resultsLimitPerLoading = 10;
	if (next_cursor) {
		const [createdAt, _id] = Buffer.from(next_cursor, "base64")
			.toString("ascii")
			.split("_");

		queryObject.createdAt = { $gte: createdAt };
		queryObject._id = { $gt: _id };
	}

	let comments = Comment.find(queryObject).populate({
		path: "user",
		select: "-password",
	});

	comments = comments.sort("createdAt _id");
	comments = comments.limit(resultsLimitPerLoading);
	const results = await comments;

	const count = await Comment.countDocuments(queryObject);
	const remainingResults = count - results.length;
	next_cursor = null;
	if (results.length !== count) {
		const lastResult = results[results.length - 1];
		next_cursor = Buffer.from(
			"_" + lastResult.createdAt.toISOString() + "_" + lastResult._id
		).toString("base64");
	}

	res.status(StatusCodes.OK).json({
		results,
		remainingResults,
		next_cursor,
	});
};

const createComment = async (req, res) => {
	const {
		user: { userId },
		body: { blogId, content },
	} = req;

	const blog = Blog.findOne({ _id: blogId });
	if (!blog) {
		throw new CustomError.BadRequestError("This blog does not exist");
	}

	const newComment = await Comment.create({
		user: userId,
		blog: blogId,
		content,
		heartCount: 0,
	});

	res.status(StatusCodes.OK).json({ comment: newComment });
};

const updateComment = async (req, res) => {
	const {
		user: { userId },
		body: { commentId, content },
	} = req;

	const comment = await Comment.findOne({ _id: commentId, user: userId });
	if (!comment) {
		throw new CustomError.BadRequestError(
			"This comment does not exist or you are not allowed to edit this comment"
		);
	}

	comment.content = content;
	await comment.save();

	res.status(StatusCodes.OK).json({ comment });
};

const deleteComment = async (req, res) => {
	const {
		user: { userId },
		params: { commentId },
	} = req;

	const comment = await Comment.findOne({ _id: commentId, user: userId });
	if (!comment) {
		throw new CustomError.BadRequestError(
			"This comment does not exist or you are not allowed to remove this comment"
		);
	}

	await comment.remove();
	res.status(StatusCodes.OK).json({ msg: "Comment is removed" });
};

module.exports = {
	getComments,
	createComment,
	updateComment,
	deleteComment,
};
