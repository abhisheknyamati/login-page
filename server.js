require("dotenv").config();

const express = require("express");
const session = require("express-session");

const MongoDBSession = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");

const path = require("path");
const bcrypt = require('bcryptjs');

const app = express();

const UserModel = require("./models/user");
const res = require("express/lib/response");
PORT = 8000;

URI = process.env.MONGODB_URI;

const connectDb = async () => {
    try {
        await mongoose.connect(URI);
        console.log("Connected to database");
    } catch (error) {
        console.error("Database connection Failed!");
        process.exit(0);
    }
};

const store = new MongoDBSession({
    uri: URI,
    collection: "mySessions",
});

app.use(
    session({
        secret: "key that will sign cookie",
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);

app.get("/", (req, res) => {                //landing page/ home page ka route
    req.session.isAuth = true;

    console.log(req.session);
    console.log(req.session.id);

    res.send("hi");
});


connectDb().then(() => {
    app.listen(PORT, (error) => {
        if (!error) {
            console.log(`Server is live on port ${PORT}`);
        } else {
            console.log("sever fatt gaya IG.. ", error);
        }
    });
});

app.use(express.urlencoded({ extended: true }));

const isAuth = (req, res, next) => {
    if (req.session.isAuth) {
        next()
    } else {
        res.redirect("/login");
    }
}

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
        return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        return res.redirect('/login');
    }

    req.session.isAuth = true;

    res.redirect("/dashboard");
});

app.get("/dashboard", isAuth, (req, res) => {
    res.send("dashboard");
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    let user = await UserModel.findOne({ email });

    if (user) {
        // complete this function so that there should not be two users with same email
    }

    const hashedPwd = await bcrypt.hash(password, 12);

    user = new UserModel({
        username,
        email,
        password: hashedPwd,
    });

    await user.save();

    res.redirect('/login');
});



