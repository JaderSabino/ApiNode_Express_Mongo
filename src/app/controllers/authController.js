const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const authConfig = require('../../config/auth.json');
const User = require('../models/user');
const mailer = require('../../modules/mailer');

const router = express.Router();

function generateToken(params = {}){
    return jwt.sign(params, authConfig.secret, { expiresIn: 86400 });
}

router.post('/register', async (req, res) => {
    const { email } = req.body;
    try {
        if(await User.findOne({ email })){
            return res.status(400).send({ error: "User already exists" });
        }
        const user = await User.create(req.body);

        user.password = undefined;

        return res.send({ 
            user,
            token: generateToken({ id: user.id })  
        });
    } catch (err) {
        return res.status(400).send({ error: 'Registration Failed' });
    }
});

router.post('/authenticate', async (req, res) => {
    const { email, password} = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if(!user){
            return res.status(400).send({ error: 'User not found'});
        }
        
        if(!await bcryptjs.compare(password, user.password)){
            return res.status(400).send({ error: 'Invalid password'});
        }
    
        user.password = undefined;
    
        return res.send({ 
            user,
            token: generateToken({ id: user.id }) 
        });
    } catch (err) {
        return res.status(400).send({ error: 'Authenticate Failed' });
    }

});

router.post('/forgot_password', async (req, res) => {
    const { email } = req.body;

    try {
        
        const user = await User.findOne({ email });
        
        if(!user){
            return res.status(400).send({ error: "User not found" });
        }
        
        const token = crypto.randomBytes(20).toString('hex');
        
        const now = new Date();
        
        now.setDate(now.getDate() + 1);
        
        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now
            }
        });
        
        mailer.sendMail({
            to: email,
            from: 'jader.sabino2014@gmail.com',
            template: 'auth/forgot_password',
            context: { token }
        }, (err) => {

            if(err){
                return res.status(400).send({ error: 'Cannot send forgot password email' });
            }
            res.send({ mesage: 'Email send success!' });
        });

    } catch (err) {
        return res.status(400).send({ error: 'Error on forgot password' });
    }
});

router.post('/reset_password', async (req, res) => {
    const { email, token, password } = req.body;

    try {
        const user = await User.findOne({ email })
            .select('+passwordResetToken passwordResetExpires');

        if(!user){
            return res.status(400).send({ error: 'User not found' })
        }

        if(user.passwordResetToken !== token){
            return res.status(400).send({ error: 'Token invalid' })
        }

        const now = new Date();

        if(user.passwordResetExpires > now){
            return res.status(400).send({ error: 'Token expired' })
        }

        user.password = password;

        await user.save();

        res.send({ mesage: "Password changed success!" });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: "Cannot reset password" });
    }
});
module.exports = app => app.use('/auth', router);