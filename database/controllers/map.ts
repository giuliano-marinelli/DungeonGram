import Map from '../models/map';
import User from '../models/user';
import Campaign from '../models/campaign';
import BaseCtrl from './base';

import mongoose from 'mongoose';

class MapCtrl extends BaseCtrl {
  model = Map;

  //get all (restricted to logged user)
  getAll = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      // if (resu.status != 200) throw new Error('unauthorized');

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
              from: "characters",
              localField: "characters.model",
              foreignField: "_id",
              as: "characters.model_info"
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
        ]);
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
              from: "characters",
              localField: "characters.model",
              foreignField: "_id",
              as: "characters.model_info"
            }
          },
          {
            $match: {
              owner: { $ne: resu?.user?._id },
              private: false
            }
          }
        ]);
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

      const count = await this.model.count({ $or: [{ owner: resu?.user?._id }, { private: false }] });
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

      const campaign = await Campaign.findOne({ _id: req.body.campaign._id, owner: resu.user._id });

      if (campaign) {
        req.body.map.owner = resu.user._id;
        delete req.body.map._id; //enable save() to return _id autogenerated
        req.body.map.tilemap = {
          width: 20, height: 20
        };
        const obj = await new this.model(req.body.map).save();

        campaign.maps.push(obj._id);
        await campaign.save();
        res.status(201).json(obj);
      } else {
        throw new Error('inexistent campaign');
      }
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  //get by id (restricted to logged user)
  get = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      // if (resu.status != 200) throw new Error('unauthorized');

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
        // $lookup USING $group
        { $unwind: "$characters" },
        {
          $lookup: {
            from: "characters",
            as: "characters.model_info",
            localField: "characters.model",
            foreignField: "_id"
          }
        },
        {
          $unwind: {
            path: "$characters.model_info",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: "$_id",
            owner: { "$first": "$owner" },
            owner_info: { "$first": "$owner_info" },
            name: { "$first": "$name" },
            description: { "$first": "$description" },
            walls: { "$first": "$walls" },
            characters: { "$push": "$characters" },
            tilemap: { "$first": "$tilemap" },
            private: { "$first": "$private" },
            imageUrl: { "$first": "$imageUrl" }
          }
        },
        // $lookup USING pipeline (not get characters that don't match model)
        // {
        //   $lookup: {
        //     from: "characters",
        //     as: "characters",
        //     let: { characters: "$characters" },
        //     pipeline: [
        //       {
        //         $match: {
        //           $expr: { $in: ["$_id", "$$characters.model"] }
        //         }
        //       },
        //       {
        //         $addFields: {
        //           docs: {
        //             $filter: {
        //               input: "$$characters",
        //               cond: {
        //                 $eq: ["$$this.model", "$_id"]
        //               }
        //             }
        //           }
        //         }
        //       },
        //       { $unwind: "$docs" },
        //       {
        //         $replaceRoot: {
        //           newRoot: {
        //             $mergeObjects: [
        //               "$docs",
        //               {
        //                 model_info: {
        //                   $arrayToObject: {
        //                     $filter: {
        //                       input: { $objectToArray: "$$ROOT" },
        //                       cond: { $ne: ["$$this.k", "docs"] }
        //                     }
        //                   }
        //                 }
        //               }
        //             ]
        //           }
        //         }
        //       }
        //     ]
        //   }
        // },
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.params.id),
            $or: [
              { owner: resu.user._id },
              { private: false }
            ]
          }
        }
      ]);

      const obj = docs[0];
      // const obj = await this.model.findOne({ _id: req.params.id, $or: [{ owner: resu.user._id }, { private: false }] });
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

      await Campaign.update(
        { maps: { $in: [mongoose.Types.ObjectId(req.params.id)] }, owner: resu.user._id },
        { $pullAll: { maps: [mongoose.Types.ObjectId(req.params.id)] } }
      );

      res.sendStatus(200);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

}

export default MapCtrl;
