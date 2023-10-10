const fs = require('fs');
const path = require('path');

const dotenv = require('dotenv');
const mongoose = require('mongoose');

const Tour = require('./../models/tourModel');

dotenv.config({ path: `${path.join(__dirname, './../config.env')}` });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => console.log('CONNECTING TO MONGODB WITH MONGOOSE'));

//  get the dummy data array
const tours = JSON.parse(
  fs.readFileSync(
    `${path.join(__dirname, './data/tours.json')}`,
    'utf-8'
  )
);
//  Import data to database
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('data imported successfully');
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany({});
    console.log('data deleted successfully');
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};

const refreshData = async () => {
  try {
    await Tour.deleteMany({});
    console.log('data deleted successfully');
    await Tour.create(tours);
    console.log('data imported successfully');
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
} else if (process.argv[2] === '--refresh') {
  refreshData();
}
