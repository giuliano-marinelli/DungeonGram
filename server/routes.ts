import * as express from 'express';

import UserCtrl from '../database/controllers/user';
import CampaignCtrl from '../database/controllers/campaign';
import CharacterCtrl from '../database/controllers/character';
import MapCtrl from '../database/controllers/map';
import InvitationCtrl from '../database/controllers/invitation';

import Storage from './storage';

function setRoutes(app): void {
  //router and controllers initialization
  const router = express.Router();
  const userCtrl = new UserCtrl();
  const campaignCtrl = new CampaignCtrl();
  const characterCtrl = new CharacterCtrl();
  const mapCtrl = new MapCtrl();
  const invitationCtrl = new InvitationCtrl();
  const storage = new Storage();

  //multer configuration
  const multer = require('multer');

  //define multer to upload files (to disk or aws s3)
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1048576 * 2 //2MB
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error('Only .png, .jpg and .jpeg format allowed.'));
      }
    }
  });

  //users
  router.route('/login').post(userCtrl.login);
  router.route('/users').get(userCtrl.getAll);
  router.route('/users/count').get(userCtrl.count);
  router.route('/user').post(upload.single("avatarFile"), userCtrl.insert);
  router.route('/user/:id').get(userCtrl.get);
  router.route('/user/:id').post(upload.single("avatarFile"), userCtrl.update);
  router.route('/user/:id').delete(userCtrl.delete);
  router.route('/user/verification/:id').get(userCtrl.verification);
  router.route('/user/verify/:id/:code').get(userCtrl.verify);

  //campaign
  router.route('/campaigns').get(campaignCtrl.getAll);
  router.route('/campaigns/count').get(campaignCtrl.count);
  router.route('/campaign').post(upload.single("bannerFile"), campaignCtrl.insert);
  router.route('/campaign/:id').get(campaignCtrl.get);
  router.route('/campaign/:id').post(upload.single("bannerFile"), campaignCtrl.update);
  router.route('/campaign/:id').delete(campaignCtrl.delete);

  //characters
  router.route('/characters').get(characterCtrl.getAll);
  router.route('/characters/count').get(characterCtrl.count);
  router.route('/character').post(
    storage.temporal(["portrait", "facePortrait"]),
    upload.fields([{ name: "frontImageFile", maxCount: 1 }, { name: "backImageFile", maxCount: 1 }, { name: "portrait", maxCount: 1 }, { name: "facePortrait", maxCount: 1 }]),
    characterCtrl.insert
  );
  router.route('/character/:id').get(characterCtrl.get);
  router.route('/character/:id').post(
    storage.temporal(["portrait", "facePortrait"]),
    upload.fields([{ name: "frontImageFile", maxCount: 1 }, { name: "backImageFile", maxCount: 1 }, { name: "portrait", maxCount: 1 }, { name: "facePortrait", maxCount: 1 }]),
    characterCtrl.update
  );
  router.route('/character/:id').delete(characterCtrl.delete);

  //maps
  router.route('/maps').get(mapCtrl.getAll);
  router.route('/maps/count').get(mapCtrl.count);
  router.route('/map').post(upload.single("terrainFile"), mapCtrl.insert);
  router.route('/map/:id').get(mapCtrl.get);
  router.route('/map/:id').post(upload.single("terrainFile"), mapCtrl.update);
  router.route('/map/:id').delete(mapCtrl.delete);

  //invitations
  router.route('/invitations').get(invitationCtrl.getAll);
  router.route('/invitations/count').get(invitationCtrl.count);
  router.route('/invitation').post(invitationCtrl.insert);
  router.route('/invitation/:id').get(invitationCtrl.get);
  router.route('/invitation/:id').post(invitationCtrl.update);
  router.route('/invitation/:id').delete(invitationCtrl.delete);

  //apply the routes to our application with the prefix /api
  app.use('/api', router);
}

export default setRoutes;
