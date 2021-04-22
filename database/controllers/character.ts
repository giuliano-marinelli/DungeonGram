import Character from '../models/character';
import User from '../models/user';
import BaseCtrl from './base';

class CharacterCtrl extends BaseCtrl {
  model = Character;

  //get all (restricted to logged user)
  getAll = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      // if (resu.status != 200) throw new Error('unauthorized');
      const own = req.query.own == 'true' ? true : false;
      const skip = req.query.page ? (req.query.page - 1) * req.query.count : 0;
      const limit = req.query.count ? parseInt(req.query.count) : Number.MAX_SAFE_INTEGER;

      var docs;
      if (own) {
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
            $match: {
              owner: resu.user?._id,
              copyOf: null
            }
          }
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
            $match: {
              owner: { $ne: resu.user?._id },
              private: false,
              copyOf: null
            }
          }
        ]).skip(skip).limit(limit);
        // .skip((req.query.page - 1) * req.query.count)
        //   .limit(req.query.count);
        // if (req.query.page && req.query.count) {
        //   docs

        // }
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
        count = await this.model.count({
          owner: resu.user?._id,
          copyOf: null
        });
      } else {
        count = await this.model.count({
          owner: { $ne: resu?.user?._id },
          private: false,
          copyOf: null
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
      this._formData(req);
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200) throw new Error('unauthorized');
      if (!resu.user.verified) throw new Error('not verified email');

      delete req.body._id;
      req.body.owner = resu.user._id;

      if (req.files?.portrait) req.body.portrait = "data:image/png;base64," + req.files.portrait[0].buffer?.toString("base64");
      if (req.files?.facePortrait) req.body.facePortrait = "data:image/png;base64," + req.files.facePortrait[0].buffer?.toString("base64");
      if (req.files?.frontImageFile) req.body.frontImage = req.files.frontImageFile[0].location ? req.files.frontImageFile[0].location : req.files.frontImageFile[0].destination + req.files.frontImageFile[0].filename;
      if (req.files?.backImageFile) req.body.backImage = req.files.backImageFile[0].location ? req.files.backImageFile[0].location : req.files.backImageFile[0].destination + req.files.backImageFile[0].filename;

      const obj = await new this.model(req.body).save();
      res.status(201).json(obj);
    } catch (err) {
      if (req.files?.frontImageFile) this.model.deleteFiles(req.files.frontImageFile[0].location ? req.files.frontImageFile[0].location : req.files.frontImageFile[0].destination + req.files.frontImageFile[0].filename);
      if (req.files?.backImageFile) this.model.deleteFiles(req.files.backImageFile[0].location ? req.files.backImageFile[0].location : req.files.backImageFile[0].destination + req.files.backImageFile[0].filename);
      return res.status(400).json({ error: err.message });
    }
  }

  //get by id (restricted to logged user)
  get = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      // if (resu.status != 200) throw new Error('unauthorized');

      const obj = await this.model.findOne({ _id: req.params.id, $or: [{ owner: resu.user?._id }, { private: false }, { copyOf: { $ne: null } }] });
      res.status(200).json(obj);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  //update by id (restricted to logged user)
  update = async (req, res) => {
    try {
      this._formData(req);
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200) throw new Error('unauthorized');

      const character = await this.model.findOne({ _id: req.params.id, $or: [{ owner: resu.user._id }, { copyOf: { $ne: null } }] });

      if (req.files?.portrait) req.body.portrait = "data:image/png;base64," + req.files.portrait[0].buffer?.toString("base64");
      if (req.files?.facePortrait) req.body.facePortrait = "data:image/png;base64," + req.files.facePortrait[0].buffer?.toString("base64");
      if (req.files?.frontImageFile) {
        this.model.deleteFiles(character.frontImage);

        req.body.frontImage = req.files.frontImageFile[0].location ? req.files.frontImageFile[0].location : req.files.frontImageFile[0].destination + req.files.frontImageFile[0].filename;
      }
      if (req.files?.backImageFile) {
        this.model.deleteFiles(character.backImage);

        req.body.backImage = req.files.backImageFile[0].location ? req.files.backImageFile[0].location : req.files.backImageFile[0].destination + req.files.backImageFile[0].filename;
      }

      await this.model.updateOne({ _id: req.params.id, $or: [{ owner: resu.user._id }, { copyOf: { $ne: null } }] }, req.body);
      res.sendStatus(200);
    } catch (err) {
      if (req.files?.frontImageFile[0]) this.model.deleteFiles(req.files.frontImageFile[0].location ? req.files.frontImageFile[0].location : req.files.frontImageFile[0].destination + req.files.frontImageFile[0].filename);
      if (req.files?.backImageFile[0]) this.model.deleteFiles(req.files.backImageFile[0].location ? req.files.backImageFile[0].location : req.files.backImageFile[0].destination + req.files.backImageFile[0].filename);
      return res.status(400).send(err.message);
    }
  }

  //delete by id (restricted to logged user)
  delete = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200) throw new Error('unauthorized');

      await this.model.deleteOne({ _id: req.params.id, owner: resu.user._id });
      res.sendStatus(200);
    } catch (err) {
      return res.status(400).send(err.message);
    }
  }

}

export default CharacterCtrl;
