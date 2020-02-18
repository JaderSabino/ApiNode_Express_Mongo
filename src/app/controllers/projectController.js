const express = require('express');
const authMiddleware = require('../middlewares/auth');

const Project = require('../models/Project');
const Task = require('../models/Task');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().populate(['user', 'tasks']);
        res.send({ projects });
    } catch (err) {
        res.status(400).send({ error: "Error Listing projects" });
    }
});

router.get('/:projectId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId).populate(['user', 'tasks']);
        res.send({ project });
    } catch (err) {
        res.status(400).send({ error: "Error Listing project" });
    }
});

router.post('/', async (req, res) => {
    try {
        const { title, description, tasks } = req.body;
        const project = await Project.create({ title, description, user: req.userId });
        await Promise.all(tasks.map(async task => {
            const projectTask = new Task({ ...task, project: project._id });
            await projectTask.save();
            project.tasks.push(projectTask);
        }));
        await project.save();
        res.send({ project });
    } catch (err) {
        console.log(err)
        res.status(400).send({ error: "Error creating new project" });
    }
});

router.put('/:projectId', async (req, res) => {
    try {
        const { title, description, tasks } = req.body;
        const project = await Project.findByIdAndUpdate( req.params.projectId, {
            title, description
        }, { new: true });// retorna o registro atualizado
        project.tasks = [];
        await Task.remove({ project: project._id });
        await Promise.all(tasks.map(async task => {
            const projectTask = new Task({ ...task, project: project._id });
            await projectTask.save();
            project.tasks.push(projectTask);
        }));
        await project.save();
        res.send({ project });
    } catch (err) {
        console.log(err)
        res.status(400).send({ error: "Error updating project" });
    }
});

router.delete('/:projectId', async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.projectId);
        res.send({ message: 'Project deleted success' });
    } catch (err) {
        res.status(400).send({ error: "Error deleting project" });
    }
});

module.exports = app => app.use('/projects', router);