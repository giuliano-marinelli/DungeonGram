import * as express from 'express';

import UserCtrl from '../database/controllers/user';
import CampaignCtrl from '../database/controllers/campaign';
import CharacterCtrl from '../database/controllers/character';
import AssetCtrl from '../database/controllers/asset';

function setRoutes(app): void {
  const router = express.Router();
  const userCtrl = new UserCtrl();
  const campaignCtrl = new CampaignCtrl();
  const characterCtrl = new CharacterCtrl();
  const assetCtrl = new AssetCtrl();

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

  // Campaign
  router.route('/characters').get(characterCtrl.getAll);
  router.route('/characters/count').get(characterCtrl.count);
  router.route('/character').post(characterCtrl.insert);
  router.route('/character/:id').get(characterCtrl.get);
  router.route('/character/:id').put(characterCtrl.update);
  router.route('/character/:id').delete(characterCtrl.delete);

  //assets
  router.route('/assets').get(assetCtrl.getAll);
  // router.route('/assets/count').get(assetCtrl.count);
  // router.route('/asset/:id').get(assetCtrl.get);

  // Apply the routes to our application with the prefix /api
  app.use('/api', router);

}

export default setRoutes;
