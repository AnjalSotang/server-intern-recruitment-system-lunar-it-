const connectDB = require('../database/index');
const Position = require('../model/positionModal');

const removeRemoteField = async () => {
  try {
    await connectDB();
    const result = await Position.updateMany({}, { $unset: { remote: "" } });
    console.log(`Salary field removed from ${result.modifiedCount} documents`);
    process.exit(0); // exit when done
  } catch (error) {
    console.error('Error removing salary field:', error);
    process.exit(1);
  }
};

removeRemoteField();
