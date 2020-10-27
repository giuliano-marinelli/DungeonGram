import jwt from 'jsonwebtoken';
import User from '../models/user';
import BaseCtrl from './base';

class UserCtrl extends BaseCtrl {
  model = User;

  //get all (if logged user is admin)
  getAll = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200 || resu?.user?.role != 'admin') throw new Error('unauthorized');

      const docs = await this.model.find({});
      res.status(200).json(docs);
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

      const obj = await this.model.findOne({ _id: req.params.id });
      req.body.role = JSON.parse(JSON.stringify(obj)).role;
      req.body.email = resu.user.email;

      await this.model.findOneAndUpdate({ _id: req.params.id, email: resu.user.email }, req.body);
      res.sendStatus(200);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export default UserCtrl;
