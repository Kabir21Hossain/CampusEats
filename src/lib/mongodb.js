import { MongoClient } from "mongodb";

const configuredUri = process.env.MONGODB_URI?.trim();
if (!configuredUri && process.env.NODE_ENV === "production") {
  throw new Error("MONGODB_URI must be configured for the production application.");
}

const uri = configuredUri || "mongodb://127.0.0.1:27017";
const options = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
};

let client = null;
let clientPromise = null;

/**
 * Function createConnection.
 * @param {*} onFailure - Input value used by the operation.
 * @returns {*} The operation result.
 */
function createConnection(onFailure) {
  const newClient = new MongoClient(uri, options);
  const promise = newClient.connect().catch((error) => {
    onFailure(newClient);
    console.error(`[MongoDB] Connection failure (${error.name || "Error"}).`);
    newClient.close().catch((closeError) => {
      console.warn(
        `[MongoDB] Could not close failed connection (${closeError.name || "Error"}).`
      );
    });
    const connectionError = new Error(
      "MongoDB connection failed. Verify MONGODB_URI and network access."
    );
    connectionError.name = "MongoConnectionError";
    throw connectionError;
  });
  return { client: newClient, promise };
}

if (process.env.NODE_ENV === "development") {
  if (!globalThis._mongoClientPromise) {
    const connection = createConnection((failedClient) => {
      if (globalThis._mongoClient === failedClient) {
        delete globalThis._mongoClient;
        delete globalThis._mongoClientPromise;
      }
    });
    globalThis._mongoClient = connection.client;
    globalThis._mongoClientPromise = connection.promise;
  }
  client = globalThis._mongoClient;
  clientPromise = globalThis._mongoClientPromise;
} else {
  const connection = createConnection((failedClient) => {
    if (client === failedClient) {
      client = null;
      clientPromise = null;
    }
  });
  client = connection.client;
  clientPromise = connection.promise;
}

export { client };
export default clientPromise;
