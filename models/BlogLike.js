const mongoose = require("mongoose");

const BlogLikeSchema = new mongoose.Schema({
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
});

BlogLikeSchema.index({ user: 1, blog: 1 });
module.exports = mongoose.model("BlogLike", BlogLikeSchema);
