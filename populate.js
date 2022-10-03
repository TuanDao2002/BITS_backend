require("dotenv").config();

const connectDB = require("./db/connect");
const Blog = require("./models/Blog");

// content in each blog is converted to UTF-8 to be stored as HTML
const jsonBlogs = require("./blog.json");

const descriptionLength = 200;
const speedToRead = 300; // 300 words per minute
const start = async () => {
	try {
		await connectDB(process.env.MONGO_URI);
		await Blog.deleteMany();
		for (let blog of jsonBlogs) {
			const { user, title, banner, category, content } = blog;
			await Blog.create({
				user,
				title,
				description: content.slice(0, descriptionLength),
				banner: banner ? banner : "default",
				category,
				content,
				timeToRead: Math.ceil(content.length / speedToRead),
				heartCount: 0,
			});
		}
		console.log("Success!!!!");
		process.exit(0);
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
};

start();
