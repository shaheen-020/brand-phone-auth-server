const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const morgan = require("morgan");
console.log('Index.js loaded. Starting app initialization');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(morgan("combined"));
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.amsiamk.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Lazy connect helper with simple caching to avoid reconnecting on warm invocations
let clientPromise = null;
async function connectClient() {
  if (!clientPromise) {
    clientPromise = client.connect().catch(err => {
      clientPromise = null;
      throw err;
    });
  }
  await clientPromise;

}

async function getPhoneCollection() {
  await connectClient();
  return client.db("phoneDB").collection("phones");
}

// Routes use lazy connection so module initialization doesn't block or crash the function
app.get("/phones", async (req, res) => {
  try {
    const phoneCollection = await getPhoneCollection();
    const cursor = phoneCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (err) {
    console.error('/phones error:', err);
    res.status(500).send({ error: 'Failed to fetch phones' });
  }
});

app.get("/phones/:id", async (req, res) => {
  try {
    const phoneCollection = await getPhoneCollection();
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await phoneCollection.findOne(query);
    res.send(result);
  } catch (err) {
    console.error('/phones/:id error:', err);
    res.status(500).send({ error: 'Failed to fetch phone' });
  }
});

app.post("/phones", async (req, res) => {
  try {
    const phoneCollection = await getPhoneCollection();
    const newPhone = req.body;
    const result = await phoneCollection.insertOne(newPhone);
    res.send(result);
  } catch (err) {
    console.error('/phones POST error:', err);
    res.status(500).send({ error: 'Failed to insert phone' });
  }
});

app.put("/phones/:id", async (req, res) => {
  try {
    const phoneCollection = await getPhoneCollection();
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updatePhone = req.body;
    const phoneDocs = {
      $set: {
        name: updatePhone.name,
        brand: updatePhone.brand,
        supplier: updatePhone.supplier,
        ram: updatePhone.ram,
        price: updatePhone.price,
        storage: updatePhone.storage,
        photo: updatePhone.photo,
      },
    };
    const result = await phoneCollection.updateOne(filter, phoneDocs, options);
    res.send(result);
  } catch (err) {
    console.error('/phones PUT error:', err);
    res.status(500).send({ error: 'Failed to update phone' });
  }
});

app.delete("/phones/:id", async (req, res) => {
  try {
    const phoneCollection = await getPhoneCollection();
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await phoneCollection.deleteOne(query);
    res.send(result);
  } catch (err) {
    console.error('/phones DELETE error:', err);
    res.status(500).send({ error: 'Failed to delete phone' });
  }
});
// user api
async function getUserCollection() {
  await connectClient();
  return client.db("phoneDB").collection("users");
}
app.get("/users", async (req, res) => {
  try {
    const userCollection = await getUserCollection();
    const cursor = userCollection.find();
    const result = await cursor.toArray(); 
    res.send(result);
  }
  catch (err) {
    console.error('/users GET error:', err); 
    res.status(500).send({ error: 'Failed to fetch users' }); 
  }
});
app.get("/users/:id", async (req, res) => {
  try {
    const userCollection = await getUserCollection();
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await userCollection.findOne(query);
    if (!result) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(result);
  }
  catch (err) {
    console.error('/users/:id GET error:', err);
    res.status(500).send({ error: 'Failed to fetch user' });
  }
});

app.post("/users", async (req, res) => {
  try {
    const userCollection = await getUserCollection();
    const user = req.body;
    const result = await userCollection.insertOne(user);
    res.send(result);
  }
  catch (err) {
    console.error('/users POST error:', err);
    res.status(500).send({ error: 'Failed to create user' });
  }
});

app.patch("/users", async (req, res) => { 
  try {
    const userCollection = await getUserCollection();
    const { email } = req.body; 
    const filter = { email: email }; 
    const updateDoc = {
      $set: req.body
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
  } 
  catch (err) {
    console.error('/users PATCH error:', err);
    res.status(500).send({ error: 'Failed to update user' });
  }
});

app.get('/', (req, res) => {
  if (process.env.DB_PASS === undefined || process.env.DB_USER === undefined) {
    console.log('Database credentials are not set in environment variables.');
  }
  console.log(process.env.DB_USER);
  // avoid logging secret in production
  console.log(process.env.DB_PASS ? 'DB_PASS is set' : 'DB_PASS is not set');
  res.send('Phone auth server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});