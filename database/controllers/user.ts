import jwt from 'jsonwebtoken';
import User from '../models/user';
import BaseCtrl from './base';
import Campaign from '../models/campaign';
import Map from '../models/map';
import Character from '../models/character';
import Invitation from '../models/invitation';

import mongoose from 'mongoose';
import getS3 from '../aws';

class UserCtrl extends BaseCtrl {
  model = User;

  //get all (with searching)
  getAll = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      // if (resu.status != 200 || resu?.user?.role != 'admin') throw new Error('unauthorized'); //(if logged user is admin)
      if (resu.status != 200) throw new Error('unauthorized');
      const search = req.query.search;
      const skip = req.query.page ? (req.query.page - 1) * req.query.count : 0;
      const limit = req.query.count ? parseInt(req.query.count) : Number.MAX_SAFE_INTEGER;

      var docs;
      if (search) {
        docs = await this.model.find({
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).skip(skip).limit(limit);;
      } else {
        docs = await this.model.find({}).skip(skip).limit(limit);;
      }
      res.status(200).json(docs);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  //count all (with searching)
  count = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      // if (resu.status != 200) throw new Error('unauthorized');
      const search = req.query.search;

      var count;
      if (search) {
        count = await this.model.count({
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        });
      } else {
        count = await this.model.count({});
      }
      res.status(200).json(count);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  login = (req, res) => {
    this.model.findOne({ email: req.body.email }, (err, user) => {
      if (!user) { return res.sendStatus(403); }
      user.comparePassword(req.body.password, (error, isMatch) => {
        if (!isMatch) { return res.sendStatus(403); }
        const token = jwt.sign({ user }, process.env.SECRET_TOKEN); // , { expiresIn: 10 } seconds
        res.status(200).json({ token });
      });
    });
  }

  insert = async (req, res) => {
    try {
      const existent = await this.model.findOne({ email: req.body.email });
      if (!existent) {
        req.body.role = 'user';
        if (req.file) req.body.avatar = req.file.location ? req.file.location : req.file.destination + req.file.filename;

        const obj = await new this.model(req.body).save();
        res.status(201).json(obj);
      } else {
        throw new Error('email already exists');
      }
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  update = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200 || (resu?.user?.role != 'admin' && resu?.user?._id != req.params.id)) throw new Error('unauthorized');

      const user = await this.model.findOne({ _id: req.params.id });
      req.body.role = JSON.parse(JSON.stringify(user)).role;
      req.body.email = resu.user.email;
      if (req.file) {
        if (user.avatar) {
          const s3 = getS3();
          const fs = require('fs');

          try {
            if (process.env.AWS_UPLOAD == "yes") await s3.deleteObject({ Bucket: "dungeongram", Key: user.avatar.split('/').pop() }).promise();
            else fs.unlinkSync(user.avatar);
          } catch (err) {
            console.log("Not found file to delete");
          }
        }
        req.body.avatar = req.file.location ? req.file.location : req.file.destination + req.file.filename;
      }

      await this.model.updateOne({ _id: req.params.id, email: resu.user.email }, req.body);
      res.sendStatus(200);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  delete = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200 || (resu?.user?.role != 'admin' && resu?.user?._id != req.params.id)) throw new Error('unauthorized');

      await this.model.deleteOne({ _id: req.params.id });
      res.sendStatus(200);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export default UserCtrl;
