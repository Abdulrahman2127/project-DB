const { check, validationResult } = require("express-validator");
const Account = require("../models/signupScema");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
require('dotenv').config();

const welcome = (req, res) => res.render("welcome", { error: null });

const getLogin = (req, res) => res.render("auth/login", { error: null, err: null });

const getSignup = (req, res) => res.render("auth/signup", { error: null, errors: null });

const content = (req, res) => res.render("auth/content");


const postSignup = [
    async (req, res) => {
        try {
            const { username, email, password, confirmPassword } = req.body;

            if (password !== confirmPassword) {
                return res.render("auth/signup", { error: "Passwords do not match", errors: null });
            }

            const newAccount = new Account({ 
                username, 
                email, 
                password  
            });
            
            await newAccount.save();
            res.redirect("/login");
        } catch (err) {
            console.error(err);
            res.status(500).send("Error saving account");
        }
    }
];

const postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Account.findOne({ 
            email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } 
        });

        if (!user) {
            console.log("Login Attempt: User not found");
            return res.render("auth/login", { error: "Invalid email or password", err: null });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        console.log("Is Password Match:", isMatch); 

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.password_jwt, { expiresIn: '24h' });
            
            res.cookie("jwt", token, { 
                httpOnly: true, 
                maxAge: 86400000, 
                secure: process.env.NODE_ENV === 'production'     
            });

            return res.redirect("/home");
        }

        res.render("auth/login", { error: "Invalid email or password", err: null });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).send("Internal Server Error during login");
    }
};
const logout = (req, res) => {
    res.clearCookie("jwt");
    res.redirect("/welcome");
};

module.exports = {
    welcome,
    content,
    getLogin,
    getSignup,
    postSignup,
    postLogin,
    logout
};