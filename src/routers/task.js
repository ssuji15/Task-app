const express = require('express')
const router = new express.Router()
const Task = require('../models/task')
const auth = require('../middleware/auth')

router.get('/tasks',auth,async (req,res)=>{
    const filter = {}
    if(req.query.completed)
    {
        filter.completed = req.query.completed === 'true'
    }
    const sort = {}
    if(req.query.sortBy)
    {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    console.log(sort)
    try
    {
        const tasks = await Task.find({
            owner: req.user._id,
            ...filter
        }).sort(sort).skip(parseInt(req.query.skip)).limit(parseInt(req.query.limit))
        res.send(tasks)
    }
    catch(e)
    {
        res.status(500).send(e)
    }
})

router.get('/tasks/:id', auth,async (req,res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })
        if(!task)
        {
            return res.status(404).send()
        }
        res.send(task)
    } 
    catch(e)
    {
        res.status(500).send(e)
    }
})

router.patch('/tasks/:id',auth, async (req,res)=> {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description','completed']
    const isValidUpdate = updates.every((update) => {
        return allowedUpdates.includes(update)
    })
    if(!isValidUpdate)
    {
        return res.status(400).send({'error': 'Invalid Request'})
    }
    try{
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })
        if(!task)
        {
            return res.status(404).send()
        }
        updates.forEach((update)=>{
            task[update] = req.body[update]
        })
        await task.save()
        
        res.send(task)
    }
    catch(e)
    {
        console.log("ERROR! " + e)
        res.status(400).send(e)
    }
})
router.delete('/tasks/:id',auth, async (req,res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })
        if(!task)
        {
            return res.status(404).send({error:'Task not found!'})
        }
        await task.remove()
        res.send(task)
    }
    catch(e)
    {
        res.status(500).send(e)
    }
})
router.post('/tasks',auth,async (req,res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    }
    catch(e)
    {
        res.status(400).send(e)
    }
})

module.exports = router