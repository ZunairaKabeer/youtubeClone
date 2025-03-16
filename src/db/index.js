import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`Connected to ${connectionInstance.connection.name} database`)
    } catch(error) {
        console.log(error)
        throw error
        process.exist(1)
    }
} 


export default connectDB;