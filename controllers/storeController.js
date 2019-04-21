const mongoose = require('mongoose');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const Store = mongoose.model('Store');
const User = mongoose.model('User');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That file type isn`t allowed' }, false);
    }
  }
};

/* exports.myMiddleware = (req, res, next) => {
  req.name = 'Mark';
  res.cookie('Cookie name', 'Cookie value', {maxAge: 900000})
  next();
} */

exports.homePage = (req, res) => {
  // req.flash('error', 'Something happened');
  // req.flash('info', 'Something happened');
  // req.flash('warning', 'Something happened');
  // req.flash('success', 'Something happened');
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', {
    title: 'Add Store'
  });
};

exports.upload = multer(multerOptions).single('photo');
exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    return next(); //skip to the next middleware
  }
  // console.log(req.file);
  const extenstion = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extenstion}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our fs, keep going!
  next();
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();

  req.flash(
    'success',
    `Successfully created ${store.name}. Care to leave a review?`
  );
  res.redirect(`/store/${store.slug}`);
  // res.json(req.body);
};

exports.getStores = async (req, res) => {
  // const host = req.headers.referer.match(/https?:\/\/\w+:\d+/)[0]; // for developement env (localhost) 
  const host = '';
  const currPage = req.params.page || 1;
  const limit = 6;
  const skip = currPage * limit - limit;
  // 1. query db for a list of all stores
  const storesPromise = Store.find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPromise = Store.count();

  const [stores, count] = await Promise.all([storesPromise, countPromise]);

  const pagesNum = Math.ceil(count / limit);

  if (!stores.length && skip) {
    req.flash(
      'info',
      `Hey! You asked for page ${currPage}. But that doesn't exist. So I put you on page ${pagesNum}`
    );
    res.redirect(`/stores/page/${pagesNum}`);
    return;
  }

  // console.log(stores);
  res.render('stores', { title: 'Stores', stores, currPage, pagesNum, count, from: 'stores', host });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store to edit it');
  }
};

exports.editStore = async (req, res) => {
  //1. find store by ID
  const store = await Store.findOne({ _id: req.params.id });

  //2. confirm they're the owner of the store
  confirmOwner(store, req.user);

  //3. render the edit form to update the store
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = 'Point';
  // find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, //return the new store instead of the old one
    runValidators: true
  }).exec();
  req.flash(
    'success',
    `Successfully updated <strong>${store.name}</strong>. <a href="/store/${
      store.slug
    }">View Store → </a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
  // redirect them to the store and tell them it worked
};

exports.getStoreBySlug = async (req, res, next) => {
  // res.send('it works');
  const store = await Store.findOne({ slug: req.params.slug }).populate(
    'author reviews'
  );
  if (!store) return next();
  res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render('tag', { tags, title: 'Tags', tag, stores });
  // res.json(result);
};

exports.searchStores = async (req, res) => {
  const stores = await Store
    // find stores that match
    .find(
      {
        $text: {
          $search: req.query.q
        }
      },
      {
        score: { $meta: 'textScore' }
      }
    )
    // sort the stores by relevance
    .sort({
      score: { $meta: 'textScore' }
    })
    // limit to only 5 results
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };

  const stores = await Store.find(q)
    .select('slug name description location photo')
    .limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet'; // mongoDB operators (pull - remove/ addToSet - add)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      [operator]: {
        hearts: req.params.id
      }
    },
    { new: true }
  );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  // const x = req.headers.referer.match(/https?:\/\/\w+:\d+\//)[0] // gets the domain name
  // const host = req.headers.referer.match(/https?:\/\/\w+:\d+/)[0]; // //for localhost
  const host = '';
  const currPage = req.params.page || 1;
  const limit = 6;
  const skip = currPage * limit - limit;

  const storesPromise = Store.find({
    _id: { $in: req.user.hearts } // $in loops through an array
  })
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });
    
    const countPromise = Store.count({
      _id: { $in: req.user.hearts }
    });
    
    const [stores, count] = await Promise.all([storesPromise, countPromise]);
    
    const pagesNum = Math.ceil(count / limit);

  if (!stores.length && skip) {
    req.flash(
      'info',
      `Hey! You asked for page ${currPage}. But that doesn't exist. So I put you on page ${pagesNum}`
    );
    res.redirect(`/hearts/page/${pagesNum}`);
    return;
  }

  // const stores = await Store.find({
  //   _id: { $in: req.user.hearts } // $in loops through an array
  // });
  // console.log(stores);

  res.render('stores', { title: 'Hearted Stores', stores, currPage, pagesNum, count, from: 'hearts', host });
};

module.exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  res.render('topStores', { title: 'Top Stores!', stores });
  // res.json(stores);
};
