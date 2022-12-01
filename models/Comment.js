const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Types.ObjectId,
			ref: "User",
			required: true,
		},

		blog: {
			type: mongoose.Types.ObjectId,
			ref: "Blog",
			required: true,
		},

		content: {
			type: String,
			required: true,
		},

		heartCount: {
			type: Number,
			default: 0,
			required: true,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		id: false,
	}
);

CommentSchema.index({ blog: 1 }, { user: 1 }, { createdAt: 1, blog: 1 });

CommentSchema.virtual("likes", {
	ref: "CommentLike",
	localField: "_id",
	foreignField: "comment",
	justOne: false,
});

CommentSchema.pre("remove", async function () {
	await this.model("CommentLike").deleteMany({ comment: this._id });
});

module.exports = mongoose.model("Comment", CommentSchema);
