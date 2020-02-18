const mongoose = require('../../database');
const bcryptjs = require('bcryptjs');

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    createAt: {
        type: Date,
        default: Date.now
    }
});


const Projects = mongoose.model('Projects', ProjectSchema);

module.exports = Projects;