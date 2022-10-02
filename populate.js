require("dotenv").config();

const connectDB = require("./db/connect");
const Blog = require("./models/Blog");

// content in each blog is converted to UTF-8 to be stored as HTML
const jsonBlogs = require("./blog.json");

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        await User.create(jsonBlogs);
        console.log("Success!!!!");
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

start();
