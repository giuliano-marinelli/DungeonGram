import * as express from 'express';

import UserCtrl from './controllers/user';
import AssetCtrl from './controllers/asset';

function setRoutes(app): void {
  const router = express.Router();
  const userCtrl = new UserCtrl();
  const assetCtrl = new AssetCtrl();

  // Users
  router.route('/login').post(userCtrl.login);
  router.route('/users').get(userCtrl.getAll);
  router.route('/users/count').get(userCtrl.count);
  router.route('/user').post(userCtrl.insert);
  router.route('/user/:id').get(userCtrl.get);
  router.route('/user/:id').put(userCtrl.update);
  router.route('/user/:id').delete(userCtrl.delete);

  //assets
  router.route('/assets').get(assetCtrl.getAll);
  // router.route('/assets/count').get(assetCtrl.count);
  // router.route('/asset/:id').get(assetCtrl.get);

  // Apply the routes to our application with the prefix /api
  app.use('/api', router);

}

export default setRoutes;
