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
      const own = req.query.own == 'true' ? true : false;
      const skip = req.query.page ? (req.query.page - 1) * req.query.count : 0;
      const limit = req.query.count ? parseInt(req.query.count) : Number.MAX_SAFE_INTEGER;

      var docs;
      if (own == true) {
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
              from: "maps",
              localField: "maps",
              foreignField: "_id",
              as: "maps_info"
            }
          },
          {
            $lookup: {
              from: "invitations",
              localField: "_id",
              foreignField: "campaign",
              as: "invitations"
            }
          },
          // $lookup USING $group
          {
            $unwind: {
              path: "$invitations",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "invitations.recipient",
              foreignField: "_id",
              as: "invitations.recipient_info"
            }
          },
          {
            $unwind: {
              path: "$invitations.recipient_info",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $group: {
              _id: "$_id",
              title: { "$first": "$title" },
              description: { "$first": "$description" },
              private: { "$first": "$private" },
              owner: { "$first": "$owner" },
              owner_info: { "$first": "$owner_info" },
              maps: { "$first": "$maps" },
              maps_info: { "$first": "$maps_info" },
              openedMap: { "$first": "$openedMap" },
              users: { "$first": "$users" },
              characters: { "$first": "$characters" },
              settings: { "$first": "$settings" },
              banner: { "$first": "$banner" },
              invitations: { "$push": "$invitations" }
            }
          },
          {
            $match: {
              $or: [
                { owner: resu.user._id },
                // { players: { $in: [resu.user._id] } },
                { invitations: { $elemMatch: { recipient: resu.user._id, accepted: true } } },
                { invitations: { $elemMatch: { recipient: resu.user._id, accepted: null } } }
              ]
            }
          },
          { $sort: { _id: 1 } }
        ]).skip(skip).limit(limit);
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
              from: "maps",
              localField: "maps",
              foreignField: "_id",
              as: "maps_info"
            }
          },
          {
            $lookup: {
              from: "invitations",
              localField: "_id",
              foreignField: "campaign",
              as: "invitations"
            }
          },
          // $lookup USING $group
          {
            $unwind: {
              path: "$invitations",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "invitations.recipient",
              foreignField: "_id",
              as: "invitations.recipient_info"
            }
          },
          {
            $unwind: {
              path: "$invitations.recipient_info",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $group: {
              _id: "$_id",
              title: { "$first": "$title" },
              description: { "$first": "$description" },
              private: { "$first": "$private" },
              owner: { "$first": "$owner" },
              owner_info: { "$first": "$owner_info" },
              maps: { "$first": "$maps" },
              maps_info: { "$first": "$maps_info" },
              openedMap: { "$first": "$openedMap" },
              users: { "$first": "$users" },
              characters: { "$first": "$characters" },
              settings: { "$first": "$settings" },
              banner: { "$first": "$banner" },
              invitations: { "$push": "$invitations" }
            }
          },
          {
            $match: {
              owner: { $ne: resu?.user?._id },
              // players: { $nin: [resu?.user?._id] },
              $or: [
                { invitations: { $eq: [{}] } },
                { invitations: { $not: { $elemMatch: { recipient: resu?.user?._id } } } },
                { invitations: { $elemMatch: { recipient: resu?.user?._id, accepted: false } } }
              ],
              private: false
            }
          },
          { $sort: { _id: 1 } }
        ]).skip(skip).limit(limit);
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
      const own = req.query.own == 'true' ? true : false;

      var count;
      if (own) {
        if (resu.status != 200) throw new Error('unauthorized');
        count = await this.model.aggregate([
          {
            $lookup: {
              from: "invitations",
              localField: "_id",
              foreignField: "campaign",
              as: "invitations"
            }
          },
          {
            $match: {
              $or: [
                { owner: resu.user._id },
                // { players: { $in: [resu.user._id] } },
                { invitations: { $elemMatch: { recipient: resu.user._id, accepted: true } } },
                { invitations: { $elemMatch: { recipient: resu.user._id, accepted: null } } }
              ]
            }
          },
          {
            $count: "count"
          }
        ]);
      } else {
        count = await this.model.aggregate([
          {
            $lookup: {
              from: "invitations",
              localField: "_id",
              foreignField: "campaign",
              as: "invitations"
            }
          },
          {
            $match: {
              owner: { $ne: resu?.user?._id },
              // players: { $nin: [resu?.user?._id] },
              $or: [
                { invitations: { $not: { $elemMatch: { recipient: resu?.user?._id } } } },
                { invitations: { $elemMatch: { recipient: resu?.user?._id, accepted: false } } }
              ],
              private: false
            }
          },
          {
            $count: "count"
          }
        ]);
      }
      res.status(200).json(count[0]?.count);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  //insert (restricted to logged user)
  insert = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200) throw new Error('unauthorized');

      delete req.body._id;
      req.body.owner = resu.user._id;
      if (req.file) req.body.banner = req.file.destination + req.file.filename;

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
            from: "maps",
            localField: "maps",
            foreignField: "_id",
            as: "maps_info",
          }
        },
        {
          $lookup: {
            from: "invitations",
            localField: "_id",
            foreignField: "campaign",
            as: "invitations"
          }
        },
        // $lookup USING $group
        {
          $unwind: {
            path: "$invitations",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "invitations.recipient",
            foreignField: "_id",
            as: "invitations.recipient_info"
          }
        },
        {
          $unwind: {
            path: "$invitations.recipient_info",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: "$_id",
            title: { "$first": "$title" },
            description: { "$first": "$description" },
            private: { "$first": "$private" },
            owner: { "$first": "$owner" },
            owner_info: { "$first": "$owner_info" },
            maps: { "$first": "$maps" },
            maps_info: { "$first": "$maps_info" },
            openedMap: { "$first": "$openedMap" },
            users: { "$first": "$users" },
            characters: { "$first": "$characters" },
            settings: { "$first": "$settings" },
            banner: { "$first": "$banner" },
            invitations: { "$push": "$invitations" }
          }
        },
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.params.id),
            $or: [
              { owner: resu?.user?._id },
              { invitations: { $elemMatch: { recipient: resu?.user?._id, accepted: true } } },
              { invitations: { $elemMatch: { recipient: resu?.user?._id, accepted: null } } },
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

      if (req.file) req.body.banner = req.file.destination + req.file.filename;

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
