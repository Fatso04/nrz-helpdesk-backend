const connectDB = async () => {
  try {
    // ADD THIS LINE TO SEE WHAT'S BEING USED
    console.log('MONGO_URI from env:', process.env.MONGO_URI);

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing! Check Render Environment Variables');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};