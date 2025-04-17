// import { MongoClient } from "mongodb";
// let client;
// export const connectToMongoDB = async () => {
//   MongoClient.connect(process.env.DB_URL)
//     .then((clientInstance) => {
//       client = clientInstance;
//       console.log("Mongodb is connected");
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// };
// export const getDB = () => {
//   //   console.log(process.env.DB_URL);
//   return client.db();
// };
// export const getSession = async () => {
//   return client.startSession();
// };

import { MongoClient } from "mongodb";

let client;

export const connectToMongoDB = async () => {
  try {
    const clientInstance = await MongoClient.connect(process.env.DB_URL);
    client = clientInstance;
    console.log("MongoDB is connected");
  } catch (err) {
    console.error("MongoDB connection failed", err);
    throw err;
  }
};

export const getDB = () => {
  if (!client) {
    throw new Error("MongoDB client is not connected.");
  }
  return client.db();
};

export const getSession = async () => {
  if (!client) {
    throw new Error("MongoDB client is not connected.");
  }
  return client.startSession();
};
