import Campaign from '../models/campaign';
import User from '../models/user';
import BaseCtrl from './base';

import mongoose from 'mongoose';

class CampaignCtrl extends BaseCtrl {
  model = Campaign;

  //get all (restricted to logged user)
  getAll = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      // if (resu.status != 200) throw new Error('unauthorized');
      const skip = req.query.page ? (req.query.page - 1) * req.query.count : 0;
      const limit = req.query.count ? parseInt(req.query.count) : Number.MAX_SAFE_INTEGER;

      var docs;
      if (req.query.own) {
        if (resu.status != 200) throw new Error('unauthorized');
        docs = await this.model.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner_info"
            }
          },
          { $unwind: "$owner_info" },
          {
            $lookup: {
              from: "users",
              localField: "players",
              foreignField: "_id",
              as: "players_info"
            }
          },
          {
            $lookup: {
              from: "maps",
              localField: "maps",
              foreignField: "_id",
              as: "maps_info"
            }
          },
          {
            $match: {
              $or: [
                { owner: resu.user._id },
                { players: { $in: [resu.user._id] } }
              ]
            }
          }
        ]).skip(skip).limit(limit);;
      } else {
        docs = await this.model.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner_info"
            }
          },
          { $unwind: "$owner_info" },
          {
            $lookup: {
              from: "users",
              localField: "players",
              foreignField: "_id",
              as: "players_info"
            }
          },
          {
            $lookup: {
              from: "maps",
              localField: "maps",
              foreignField: "_id",
              as: "maps_info"
            }
          },
          {
            $match: {
              owner: { $ne: resu?.user?._id },
              private: false
            }
          }
        ]).skip(skip).limit(limit);;
      }
      res.status(200).json(docs);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  //count all (restricted to logged user)
  count = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      // if (resu.status != 200) throw new Error('unauthorized');

      var count;
      if (req.query.own) {
        count = await this.model.count({
          $or: [
            { owner: resu.user._id },
            { players: { $in: [resu.user._id] } }
          ]
        });
      } else {
        count = await this.model.count({
          owner: { $ne: resu?.user?._id },
          private: false
        });
      }
      res.status(200).json(count);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  //insert (restricted to logged user)
  insert = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200) throw new Error('unauthorized');

      req.body.owner = resu.user._id;
      const obj = await new this.model(req.body).save();
      res.status(201).json(obj);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  //get by id (restricted to logged user)
  get = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      // if (resu.status != 200) throw new Error('unauthorized');

      // const obj = await this.model.findOne({ _id: req.params.id, $or: [{ owner: resu.user._id }, { private: false }] });

      var docs = await this.model.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner_info"
          }
        },
        { $unwind: "$owner_info" },
        {
          $lookup: {
            from: "users",
            localField: "players",
            foreignField: "_id",
            as: "players_info",
          }
        },
        {
          $lookup: {
            from: "maps",
            localField: "maps",
            foreignField: "_id",
            as: "maps_info",
          }
        },
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.params.id),
            $or: [
              { owner: resu.user._id },
              { players: { $in: [resu.user._id] } },
              { private: false }
            ]
          }
        }
      ]);

      const obj = docs[0];

      res.status(200).json(obj);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  //update by id (restricted to logged user)
  update = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200) throw new Error('unauthorized');

      await this.model.findOneAndUpdate({ _id: req.params.id, owner: resu.user._id }, req.body);
      res.sendStatus(200);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  //delete by id (restricted to logged user)
  delete = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200) throw new Error('unauthorized');

      await this.model.findOneAndRemove({ _id: req.params.id, owner: resu.user._id });
      res.sendStatus(200);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

}

export default CampaignCtrl;