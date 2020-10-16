import Campaign from '../models/campaign';
import User from '../models/user';
import BaseCtrl from './base';

class CampaignCtrl extends BaseCtrl {
  model = Campaign;

  //get all (restricted to logged user)
  getAll = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200) throw new Error('unauthorized');

      const docs = await this.model.find({ owner: resu.user._id });
      res.status(200).json(docs);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  //count all (restricted to logged user)
  count = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200) throw new Error('unauthorized');

      const count = await this.model.count({ owner: resu.user._id });
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

      req.body.user = resu.user._id;
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
      if (resu.status != 200) throw new Error('unauthorized');

      const obj = await this.model.findOne({ _id: req.params.id, owner: resu.user._id });
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
