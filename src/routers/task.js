const express = require("express");
const router = new express.Router();
const Task = require("../models/task");
const auth = require("../middleware/auth");

router.post("/task", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(200).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});
// GET /task?completed=true
// GET /task?limit=10&skip=0
// GET /task?sortBy=createdAt_asc||desc
router.get("/task", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "asc" ? 1 : -1;
  }

  try {
    // const tasks = await Task.find({owner:req.user._id});
    await req.user.populate({
      path: "usertasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    res.status(200).send(req.user.usertasks);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/task/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.patch("/task/:id", auth, async (req, res) => {
  let updates = Object.keys(req.body);
  updates = updates.filter((key) => key !== "token");
  const allowedUpdates = ["description", "completed"];
  const isValidUpdates = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidUpdates) {
    return res.status(400).send({ error: "Invalid Updates!!" });
  }
  try {
    const taskid = req.originalUrl.replace("/task/", "");
    const task = await Task.findOne({
      _id: taskid,
      owner: req.user._id,
    });
    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    console.log("save");
    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send({task});
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/task/:id", auth, async (req, res) => {
  try {
    const taskid = req.params.id;
    await Task.findOneAndDelete({
      _id: taskid,
      owner: req.user._id,
    });
    res.status(200).send();
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
