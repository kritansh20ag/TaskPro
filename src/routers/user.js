const express = require("express");
const User = require("../models/user");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
// const { sendWelcomeEmail } = require("../email/account");
const router = new express.Router();

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    // console.log(user);
    await user.save();
    // sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.status(200).send("Logout SuccessFull");
  } catch (e) {
    res.status(500).send(e);
  }
});
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
  let updates = Object.keys(req.body);
  updates = updates.filter((key) => key !== "token");
  const allowedUpdates = ["name", "email", "password"];
  const isVaildOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isVaildOperation) {
    return res.status(400).send({ error: "Invalid Updates!!" });
  }
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.status(200).send({ user: req.user, token: req.token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    await User.findByIdAndRemove(req.user._id);
    await Task.deleteMany({ owner: req.user._id });
    res.send(req.user);
  } catch (e) {
    res.status(500);
  }
});

const upload = multer({
  dest: "userimage",
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }
    return cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const data = await sharp(fs.readFileSync(req.file.path))
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = data;
    await req.user.save();
    res.send({ user: req.user, token: req.query.token });
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send({ user: req.user, token: req.query.token });
});

// router.get("/users/:id/avatar", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user || !user.avatar) {
//       throw new Error();
//     }
//     res.set("Content-Type", "image/png");
//     res.send(user.avatar);
//   } catch (e) {
//     res.status(404).send("No avatar/user found");
//   }
// });

module.exports = router;
