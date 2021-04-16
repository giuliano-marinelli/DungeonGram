import Campaign from '../models/campaign';
import Invitation from '../models/invitation';
import User from '../models/user';
import BaseCtrl from './base';

class InvitationCtrl extends BaseCtrl {
  model = Invitation;

  //get all (restricted to logged user)
  getAll = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      // if (resu.status != 200) throw new Error('unauthorized');
      const campaign = await Campaign.findOne({ _id: req.query.campaign, owner: resu.user._id });
      const skip = req.query.page ? (req.query.page - 1) * req.query.count : 0;
      const limit = req.query.count ? parseInt(req.query.count) : Number.MAX_SAFE_INTEGER;

      var docs;
      if (resu.status != 200) throw new Error('unauthorized');
      docs = await this.model.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "recipient",
            foreignField: "_id",
            as: "recipient_info"
          }
        },
        { $unwind: "$recipient_info" },
        {
          $lookup: {
            from: "users",
            localField: "sender",
            foreignField: "_id",
            as: "sender_info"
          }
        },
        { $unwind: "$sender_info" },
        {
          $match: {
            campaign: campaign._id,
            sender: resu.user._id
          }
        }
      ]).skip(skip).limit(limit);

      res.status(200).json(docs);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  //insert (restricted to logged user)
  insert = async (req, res) => {
    try {
      const resu = await User.findByAuthorization(req);
      if (resu.status != 200) throw new Error('unauthorized');

      req.body.sender = resu.user._id;
      req.body.date = Date.now();

      if (req.body.sender == req.body.recipient) throw new Error('cannot invite yourself');

      const existentInvitation = await Invitation.findOne({
        recipient: req.body.recipient,
        sender: req.body.sender,
        campaign: req.body.campaign,
      });
      if (existentInvitation && existentInvitation.accepted == null) throw new Error('the player was previously invited');

      var obj;
      if (!existentInvitation) {
        obj = await new this.model(req.body).save();
      } else if (existentInvitation.accepted == false) {
        console.log(existentInvitation);
        existentInvitation.accepted = null;
        obj = await this.model.updateOne({ _id: existentInvitation._id }, existentInvitation);
      }
      res.status(201).json(obj);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export default InvitationCtrl;
