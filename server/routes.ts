import * as express from 'express';

import UserCtrl from '../database/controllers/user';
import CampaignCtrl from '../database/controllers/campaign';
import CharacterCtrl from '../database/controllers/character';
import MapCtrl from '../database/controllers/map';
import AssetCtrl from '../database/controllers/asset';
import InvitationCtrl from '../database/controllers/invitation';

function setRoutes(app): void {
  const router = express.Router();
  const userCtrl = new UserCtrl();
  const campaignCtrl = new CampaignCtrl();
  const characterCtrl = new CharacterCtrl();
  const mapCtrl = new MapCtrl();
  const assetCtrl = new AssetCtrl();
  const invitationCtrl = new InvitationCtrl();

  // Users
  router.route('/login').post(userCtrl.login);
  router.route('/users').get(userCtrl.getAll);
  router.route('/users/count').get(userCtrl.count);
  router.route('/user').post(userCtrl.insert);
  router.route('/user/:id').get(userCtrl.get);
  router.route('/user/:id').put(userCtrl.update);
  router.route('/user/:id').delete(userCtrl.delete);

  // Campaign
  router.route('/campaigns').get(campaignCtrl.getAll);
  router.route('/campaigns/count').get(campaignCtrl.count);
  router.route('/campaign').post(campaignCtrl.insert);
  router.route('/campaign/:id').get(campaignCtrl.get);
  router.route('/campaign/:id').put(campaignCtrl.update);
  router.route('/campaign/:id').delete(campaignCtrl.delete);

  // Characters
  router.route('/characters').get(characterCtrl.getAll);
  router.route('/characters/count').get(characterCtrl.count);
  router.route('/character').post(characterCtrl.insert);
  router.route('/character/:id').get(characterCtrl.get);
  router.route('/character/:id').put(characterCtrl.update);
  router.route('/character/:id').delete(characterCtrl.delete);

  // maps
  router.route('/maps').get(mapCtrl.getAll);
  router.route('/maps/count').get(mapCtrl.count);
  router.route('/map').post(mapCtrl.insert);
  router.route('/map/:id').get(mapCtrl.get);
  router.route('/map/:id').put(mapCtrl.update);
  router.route('/map/:id').delete(mapCtrl.delete);

  // invitations
  router.route('/invitations').get(invitationCtrl.getAll);
  router.route('/invitations/count').get(invitationCtrl.count);
  router.route('/invitation').post(invitationCtrl.insert);
  router.route('/invitation/:id').get(invitationCtrl.get);
  router.route('/invitation/:id').put(invitationCtrl.update);
  router.route('/invitation/:id').delete(invitationCtrl.delete);

  //assets
  router.route('/assets').get(assetCtrl.getAll);
  // router.route('/assets/count').get(assetCtrl.count);
  // router.route('/asset/:id').get(assetCtrl.get);

  // Apply the routes to our application with the prefix /api
  app.use('/api', router);

}

export default setRoutes;
