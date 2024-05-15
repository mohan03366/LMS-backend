import mongoose from 'mongoose';
mongoose.set('strictQuery', false);




// Function to establish database connection
const connectionToDB =async () =>{
  try {
    const { connection }= await mongoose.connect(
        process.env.MONGO_URI || `mongodb://127.0.0.1:27017/lms`
    )

    if(connection){
        console.log(`connected to Mongodb : ${connection.host}`)
    }

    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit process with failure
  }
}

export default connectionToDB;
