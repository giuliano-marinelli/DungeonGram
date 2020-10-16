import jwt from 'jsonwebtoken';

import BaseCtrl from './base';

class AssetCtrl {

  getAll = (req, res) => {
    //requiring path and fs modules
    const path = require('path');
    const fs = require('fs');
    //joining path of directory
    const directoryPath = path.join(__dirname, '../../uploads');
    //passsing directoryPath and callback function
    fs.readdir(directoryPath, function (err, files) {
      //handling error
      if (err) {
        return console.log('Unable to scan directory: ' + err);
      }

      //listing all files using forEach
      files.forEach(function (file) {
        // Do whatever you want to do with the file
        console.log("uploads/" + file);
      });

      files = files.map((file) => {
        return "uploads/" + file;
      });

      res.status(200).json(files);
    });
  }

}

export default AssetCtrl;
