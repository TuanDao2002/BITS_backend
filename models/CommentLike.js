const mongoose = require("mongoose");

const CommentLikeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    },

    comment: {
        type: mongoose.Types.ObjectId,
        ref: "Comment",
        required: true,
    },
});

CommentLikeSchema.index({ user: 1, comment: 1 });
module.exports = mongoose.model("CommentLike", CommentLikeSchema);
