const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()

const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.izczxgs.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const userCollection = client.db('skillsphereDB').collection('user');
    // Course
    const CourseCollection = client.db('skillsphereDB').collection('Courses');

    // User   
    app.get('/user',  async (req, res) => {
        const cursor = userCollection.find();
        const users = await cursor.toArray();
        res.send(users);
    })

    app.post('/user', async (req, res) => {
        const user = req.body;
        console.log(user);
        // 
        const query = { email: user.email }
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: 'user already exists', insertedId: null })
        }

        // 
        const result = await userCollection.insertOne(user);
        res.send(result);
    });

    // add course
    app.post('/addcourse', async (req, res) => {
        const bids = req.body;
        console.log(bids);
        const result = await CourseCollection.insertOne(bids);
        res.send(result);
    })
  
    
  
      app.get('/addcourse', async (req, res) => {
        try{
          const query ={};
          if(req.query.email){
            query.email = req.query.email;
          }
        const result = await CourseCollection.find(query).toArray();
        res.send(result)
        }
        catch(error)
        {
          console.log(error);
          res.status(500).send("server error")
        }
    })
  
    app.get('/addcourse/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await CourseCollection.findOne(query)
      res.send(result)
     })
    
        //    updated work here
        app.put('/addcourse/:id', async(req, res) => {
          const id = req.params.id;
          const filter = {_id: new ObjectId(id)}
          const options = { upsert: true };
          const UpdateCourse = req.body;
          const course = {
            $set: {
                email: UpdateCourse.email, 
                jobTitle: UpdateCourse.jobTitle, 
                DeadLine: UpdateCourse.DeadLine, 
                category: UpdateCourse.category, 
              Description : UpdateCourse.Description, 
              Price: UpdateCourse.Price, 
            }
              }
  
          const result = await CourseCollection.updateOne(filter,course, options);
          res.send(result);
        })
        // 
        app.delete('/addcourse/:id', async (req, res) => {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const result = await CourseCollection.deleteOne(query);
          res.send(result);
      })

    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})
