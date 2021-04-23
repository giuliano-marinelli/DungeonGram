import jwt from 'jsonwebtoken';
import User from '../models/user';
import BaseCtrl from './base';
import Campaign from '../models/campaign';
import Map from '../models/map';
import Character from '../models/character';
import Invitation from '../models/invitation';
import { Utils } from '../../server/utils';

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
      const skip = req.query.page ? (req.query.page - 1) * req.query.count : 0;
      const limit = req.query.count ? parseInt(req.query.count) : Number.MAX_SAFE_INTEGER;
      const search = req.query.search && req.query.search != '' ? req.query.search : null;

      var docs;
      docs = await this.model.find({
        ...(search ? {
          $or: [
            { username: { $regex: ".*" + search + ".*", $options: "i" } },
            { email: { $regex: ".*" + search + ".*", $options: "i" } }
          ]
        } : {})
      }).skip(skip).limit(limit);;
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
      const search = req.query.search && req.query.search != '' ? req.query.search : null;

      var count;
      count = await this.model.count({
        ...(search ? {
          $or: [
            { username: { $regex: ".*" + search + ".*", $options: "i" } },
            { email: { $regex: ".*" + search + ".*", $options: "i" } }
          ]
        } : {})
      });

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
        req.body.verified = false;

        if (req.file) req.body.avatar = req.file.location ? req.file.location : req.file.destination + req.file.filename;

        const obj = await new this.model(req.body).save();
        res.status(201).json(obj);
      } else {
        throw new Error('email already exists');
      }
    } catch (err) {
      if (req.file) this.model.deleteFiles(req.file.location ? req.file.location : req.file.destination + req.file.filename);
      return res.status(400).json({ error: err.message });
    }
  }

  update = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200 || (resu?.user?.role != 'admin' && resu?.user?._id != req.params.id)) throw new Error('unauthorized');

      const user = await this.model.findOne({ _id: req.params.id });
      req.body.role = JSON.parse(JSON.stringify(user)).role;
      req.body.verified = JSON.parse(JSON.stringify(user)).verified;
      req.body.email = resu.user.email;
      if (req.file) {
        this.model.deleteFiles(user.avatar);

        req.body.avatar = req.file.location ? req.file.location : req.file.destination + req.file.filename;
      }

      await this.model.updateOne({ _id: req.params.id, email: resu.user.email }, req.body);
      res.sendStatus(200);
    } catch (err) {
      if (req.file) this.model.deleteFiles(req.file.location ? req.file.location : req.file.destination + req.file.filename);
      return res.status(400).send(err.message);
    }
  }

  delete = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200 || (resu?.user?.role != 'admin' && resu?.user?._id != req.params.id)) throw new Error('unauthorized');

      await this.model.deleteOne({ _id: req.params.id });
      res.sendStatus(200);
    } catch (err) {
      return res.status(400).send(err.message);
    }
  }

  verification = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200 || (resu?.user?.role != 'admin' && resu?.user?._id != req.params.id)) throw new Error('unauthorized');

      const user = await this.model.findOne({ _id: req.params.id });

      if (!user.verified) {
        var timeDiff = Math.floor(Math.abs(Date.now() - user.lastVerifyDate) / 1000);
        var timeNeed = Math.max(120 - timeDiff, 0);
        // console.log("time elapsed from last email: ", Math.floor(timeDiff / 60) % 60, "minutes", timeDiff % 60, "seconds", "(" + timeDiff + " seconds)");
        if ((!user.lastVerifyDate || timeDiff >= 120)) { //2 minutes = 120 seg
          user.lastVerifyDate = Date.now();
          user.verificationCode = user.verificationCode ? user.verificationCode : Utils.uuidv4();
          await this.model.updateOne({ _id: req.params.id }, user);

          //send verification email
          const nodemailer = require('nodemailer');

          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL,
              pass: process.env.EMAIL_PASSWORD
            }
          });

          var url = req.protocol + '://' + req.get('host') + '/account/' + req.params.id + '/' + user.verificationCode;
          var text = 'Please go to the following link to verify your email ' + url;
          var html =
            `Dear ${user.username},<br><br>
            Please click the following link to verify your email: <br>
            <a href="${url}">${url}</a><br><br>
            If you did NOT request to verify this email address on DungeonGram,
            do not click on the link. Please note that many times, the situation isn't a phishing attempt,
            but either a misunderstanding.<br>
            If you are still concerned, please forward this notification to <a href="mailto: dungeongram.noreply@gmail.com">dungeongram.noreply@gmail.com</a>
            and let us know in the forward that you did not request the verification.<br><br>
            <b>DungeonGram<b>`;

          let info = await transporter.sendMail({
            from: {
              name: 'DungeonGram',
              adress: process.env.EMAIL
            },
            to: user.email,
            subject: 'DungeonGram: Verify your email',
            text: text,
            html: html
          });

          res.sendStatus(200);
        } else {
          throw new Error('Need to wait ' + (timeNeed > 60 ? Math.floor(timeNeed / 60) + ' minutes' : timeNeed + ' seconds') + ' to send email again.');
        }
      } else {
        throw new Error('Email is already verified.');
      }
    } catch (err) {
      return res.status(400).send(err.message);
    }
  }

  verify = async (req, res) => {
    try {
      // console.log("user", req.params.id, "code", req.params.code, "verified");
      const user = await this.model.findOne({ _id: req.params.id, verificationCode: req.params.code });
      if (user) {
        if (!user.verified) {
          user.verified = true;
          await this.model.updateOne({ _id: req.params.id }, user);
          res.sendStatus(200);
        } else {
          throw new Error('Email is already verified.');
        }
      } else {
        throw new Error('Invalid or expired verification code.');
      }
    } catch (err) {
      return res.status(400).send(err.message);
    }
  }
}

export default UserCtrl;
