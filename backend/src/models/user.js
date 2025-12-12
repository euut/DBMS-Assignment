const mongoose = require('mongoose');

/*
This schema uses mongoose but in my routes I used raw mongodb driver (raw queries)
because mongoose, if I'm not mistaken, seems to block operators by default (also includes some validations)
but maybe can use this when doing mitigations or add other schemas if needed, otherwise can just leave it lol
it's already included in package.json so no need to install manually, just use "npm i"
*/

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('User', UserSchema, 'customers');