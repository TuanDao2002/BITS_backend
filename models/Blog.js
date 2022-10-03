const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Types.ObjectId,
			ref: "User",
			required: true,
		},

		title: {
			type: String,
			maxlength: [300, "Title's length must be less than 100"],
			required: true,
		},

		description: {
			type: String,
			maxlength: [200, "Description's length must be less than 500"],
			required: true,
		},

		banner: {
			type: String,
			required: true,
		},

		category: {
			type: String,
			required: [true, "Please provide category"],
			enum: {
				values: ["AI", "Cloud computing", "Big Data", "Security", "DevOps", "Blockchain"],
				message: "{VALUE} is not a supported category", // Error message
			},
		},

		content: {
			type: String,
			required: [true, "Please provide content"],
		},

		timeToRead: {
			type: Number,
			required: true,
		},

		heartCount: {
			type: Number,
			default: 0,
			required: true,
		},
	},
	{ timestamps: true }
);

BlogSchema.index({ user: 1 }, { heartCount: 1, createdAt: -1 });

BlogSchema.pre("remove", async function () {
	const comments = await this.model("Comment").find({ blog: this._id });
	for (let comment of comments) {
		await comment.remove();
	}

	await this.model("BlogLike").deleteMany({ blog: this._id });
});

module.exports = mongoose.model("Blog", BlogSchema);
