const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// ↓ middleware ↓
app.use(cors());
app.use(express.json());
// ↑ middleware ↑

// mongoDB script
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.r8fzb08.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const serviceCollection = client
      .db("ServiceProvider")
      .collection("services");
    //   get data
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // post data
    app.post("/services", async (req, res) => {
      const order = req.body;
      const result = await serviceCollection.insertOne(order);
      res.send(result);
    });

    // get specific data
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Service review server is running...");
});

app.listen(port, () => {
  console.log("Service review server is running on port", port);
});
