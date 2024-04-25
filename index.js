const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
    // sell course info
    const sellerCollection = client.db('skillsphereDB').collection('seller');
   // careerpath
   const careerPathCollection = client.db('skillsphereDB').collection('careerPath');
   // add to cart course 
   const addCartCollection = client.db('skillsphereDB').collection('carts');
   const paymentCollection = client.db("skillsphereDB").collection("payments");

    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })
    
    // middlewares 
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);

      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });

      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }
      // use verify admin after verifyToken
      const verifyAdmin = async (req, res, next) => {
        const email = req.decoded.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        const isAdmin = user?.role === 'admin';
        if (!isAdmin) {
          return res.status(403).send({ message: 'forbidden access' });
        }
        console.log(isAdmin);
        next();
      }
    

    // User   
    app.get('/user',verifyToken, verifyAdmin,  async (req, res) => {
        const cursor = userCollection.find();
        const users = await cursor.toArray();
        res.send(users);
    })
    app.get('/user/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
    
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      console.log(admin);
      res.send({ admin });
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
    app.patch('/user/admin/:id',verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
   
    app.delete('/user/:id',verifyToken, verifyAdmin,  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

    app.get("/user/:email", async (req, res) => {
      try {
        const userEmail = req.params.email;
    
        // Logic to retrieve a user based on email
        const user = await userCollection.findOne({ email: userEmail });
    
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
    
        res.status(200).json(user);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
    

    app.put('/user/update/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const filter = { email: email };
        const options = { upsert: true };
        const updatedUser = req.body;
    
        const updates = {
          $set: {
            name: updatedUser.name,
            phoneNumber: updatedUser.phoneNumber,
            image: updatedUser.image,
            dateOfBirth: updatedUser.dateOfBirth,
          },
        };
    
        const result = await userCollection.updateOne(filter, updates, options);
        console.log(result );
    
        res.status(201).json({ message: "User updated successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // add course
    app.post('/addcourse', async (req, res) => {
        const bids = req.body;
        console.log(bids);
        const result = await CourseCollection.insertOne(bids);
        res.send(result);n
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
      // seller data 
      app.post('/seller', async (req, res) => {
        const bids = req.body;
        console.log(bids);
        const result = await sellerCollection.insertOne(bids);
        res.send(result);
    })
    app.get('/seller',  async (req, res) => {
      const cursor = sellerCollection.find();
      const seller = await cursor.toArray();
      res.send(seller);
    })
  
    //  career Path
    app.get('/careerPath',  async (req, res) => {
      const cursor = careerPathCollection.find();
      const career = await cursor.toArray();
      res.send(career);
   })
  //  
    app.post('/carts', async (req, res) => {
      const cartItem = req.body;
      console.log(cartItem);
      const result = await addCartCollection.insertOne(cartItem);
      res.send(result);
  })

  app.get('/carts', async (req, res) => {
    try {
        const email = req.query.email;
        const query = { email: email };
        const result = await addCartCollection.find(query).toArray();
        res.send(result);
    } catch (error) {
        // Handle errors appropriately, for example:
        console.error("Error fetching cart data:", error);
        res.status(500).send("Internal Server Error");
    }
  }); 
  app.delete('/carts/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await addCartCollection.deleteOne(query);
    res.send(result);
  })
    // payment
    // payment intent
   app.post('/create-payment-intent', async (req, res) => {
    const { price } = req.body;
    const amount = parseInt(price * 100);
    console.log(amount, 'amount inside the intent')

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card']
    });

    res.send({
      clientSecret: paymentIntent.client_secret
    })
  });

    app.get('/payments/:email', verifyToken, async (req, res) => {
      const query = { email: req.params.email }
      if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })

   

  app.post('/payments', async (req, res) => {
    const payment = req.body;
    const paymentResult = await paymentCollection.insertOne(payment);

    //  carefully delete each item from the cart
    console.log('payment info', payment);
    const query = {
      _id: {
        $in: payment.cartIds.map(id => new ObjectId(id))
      }
    };

    const deleteResult = await addCartCollection.deleteMany(query);

    res.send({ paymentResult , deleteResult});
    
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
