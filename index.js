const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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

function verifyJwt(req, res, next) {
  // console.log();
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access." });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET_KEY,
    function (err, decoded) {
      if (err) {
        return res.status(401).send({ message: "unauthorized access." });
      }
      req.decoded = decoded;
      next();
    }
  );
}

async function run() {
  try {
    const serviceCollection = client
      .db("ServiceProvider")
      .collection("services");

    const reviewCollection = client.db("ServiceProvider").collection("reviews");

    // jwt token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    //   get home page  data
    app.get("/home/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query).sort({ $natural: -1 });
      const services = await cursor.limit(3).toArray();
      res.send(services);
    });
    //   get data
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query).sort({ time: -1 });
      const services = await cursor.toArray();
      res.send(services);
    });

    // post data
    app.post("/services", async (req, res) => {
      const order = req.body;
      order.time = Date();

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

    // reviews post to server
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      review.time = Date();
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // get review data from server
    app.get("/reviews", verifyJwt, async (req, res) => {
      const decoded = req.decoded;
      console.log("dd", decoded);
      if (decoded?.email !== req.query.email) {
        return res.status(403).send({ message: "Unauthorized access" });
      }
      let query = {};
      // get via email
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }

      // //  get via service ID
      // if (req.query.serviceId) {
      //   query = {
      //     serviceId: req.query.serviceId,
      //   };
      // }

      const cursor = reviewCollection.find(query).sort({ time: -1 });
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // //for  getting specific service review data from server
    app.get("/service/reviews", async (req, res) => {
      //  get via service ID
      if (req.query.serviceId) {
        query = {
          serviceId: req.query.serviceId,
        };
      }

      const cursor = reviewCollection.find(query).sort({ time: -1 });
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // delete
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    // update reviews
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });

    app.put("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const review = req.body;
      console.log(review.comment);
      const option = { upsert: true };
      const updatedReview = {
        $set: {
          comment: review.comment,
        },
      };
      const result = await reviewCollection.updateOne(
        filter,
        updatedReview,
        option
      );
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
