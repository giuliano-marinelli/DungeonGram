import * as express from 'express';

import UserCtrl from '../database/controllers/user';
import CampaignCtrl from '../database/controllers/campaign';
import CharacterCtrl from '../database/controllers/character';
import MapCtrl from '../database/controllers/map';
import InvitationCtrl from '../database/controllers/invitation';

function setRoutes(app): void {
  //router and controllers initialization
  const router = express.Router();
  const userCtrl = new UserCtrl();
  const campaignCtrl = new CampaignCtrl();
  const characterCtrl = new CharacterCtrl();
  const mapCtrl = new MapCtrl();
  const invitationCtrl = new InvitationCtrl();

  //multer configuration
  const multer = require('multer');
  //multer file upload settings
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.png');
    }
  })
  //multer mime type validation
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 5
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
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

  //campaign
  router.route('/campaigns').get(campaignCtrl.getAll);
  router.route('/campaigns/count').get(campaignCtrl.count);
  router.route('/campaign').post(campaignCtrl.insert);
  router.route('/campaign/:id').get(campaignCtrl.get);
  router.route('/campaign/:id').put(campaignCtrl.update);
  router.route('/campaign/:id').delete(campaignCtrl.delete);

  //characters
  router.route('/characters').get(characterCtrl.getAll);
  router.route('/characters/count').get(characterCtrl.count);
  router.route('/character').post(characterCtrl.insert);
  router.route('/character/:id').get(characterCtrl.get);
  router.route('/character/:id').put(characterCtrl.update);
  router.route('/character/:id').delete(characterCtrl.delete);

  //maps
  router.route('/maps').get(mapCtrl.getAll);
  router.route('/maps/count').get(mapCtrl.count);
  router.route('/map').post(mapCtrl.insert);
  router.route('/map/:id').get(mapCtrl.get);
  router.route('/map/:id').put(mapCtrl.update);
  router.route('/map/:id').delete(mapCtrl.delete);

  //invitations
  router.route('/invitations').get(invitationCtrl.getAll);
  router.route('/invitations/count').get(invitationCtrl.count);
  router.route('/invitation').post(invitationCtrl.insert);
  router.route('/invitation/:id').get(invitationCtrl.get);
  router.route('/invitation/:id').put(invitationCtrl.update);
  router.route('/invitation/:id').delete(invitationCtrl.delete);


  //apply the routes to our application with the prefix /api
  app.use('/api', router);
}

export default setRoutes;
