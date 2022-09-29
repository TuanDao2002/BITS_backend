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
            maxlength: [100, "Title's length must be less than 100"],
            required: true,
        },

        description: {
            type: String,
            maxlength: [500, "Description's length must be less than 500"],
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
                values: ["AI/ML", "Cloud computing", "Big Data", "Security"],
                message: "{VALUE} is not a supported category", // Error message
            },
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
