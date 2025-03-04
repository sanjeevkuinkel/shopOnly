    import mongoose from "mongoose";
    const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Database Connected Successfully.");
    } catch (error) {
        console.log("Database Connection Failed.");
        console.log(error.message);
    }
    };
    export { dbConnect };
