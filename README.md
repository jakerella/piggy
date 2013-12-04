Piggy
====

A simple account tracker (think 'piggy bank').


## Server Installation

### Database (MongoDB)

You will need a MongoDB instance running somewhere (see the `MONGO_DB_URL` env variable below). You can get a small amount of free space on [MongoLab](https://mongolab.com). Combining that with a single free Heroku web dyno you can easily run this app live without any set up costs. An example of the database connection URI:

```
mongodb://someuser:theirpass@abcd1234.mongolab.com/my-pt-stats
```

The database you create will need two collections: `accounts` and `transactions`. These will be created if they do not exist already.
_NOTE: If your database already has these collections you could run into problems!_

### Heroku Install

Assuming you have a verified [Heroku account](http://www.heroku.com/) and the [Heroku toolbelt](https://toolbelt.herokuapp.com/) installed:

```sh
git clone git@github.com:jakerella/piggy.git
cd piggy
heroku apps:create [optional app name]
heroku config:set NODE_ENV=[env name, e.g. "development" or "production" (defaults to "production")]
heroku config:set MONGO_DB_URL=[protocol][username:password@]{host name}[:port]{/database}
heroku config:add BUILDPACK_URL=https://github.com/mbuchetics/heroku-buildpack-nodejs-grunt.git
heroku labs:enable user-env-compile -a [app name]
git push heroku [local branch:]master
```

All of your `console.log()` statements will appear in the Heroku logs which you can view by running `heroku logs`. (Unless you have a [separate logger](https://devcenter.heroku.com/articles/logging) set up for your app, which you may want to do!) You may also want to review this guide to [Node.js on Heroku](https://devcenter.heroku.com/articles/nodejs).

#### Using a local Heroku MongoDB instance

You can use MongoDB from any server (see the options for setting up your mongo credentials above), but if you want to use Heroku's local instance of MongoDB you'll need to use their addon and specify `localhost` as the host for the DB server.

```sh
heroku addons:add mongolab
```

### Server Install

You can run the Piggy app from just about any server. Here are the steps for doing so:

1. [Install git](http://git-scm.com)
2. [Install Node](http://nodejs.org)
2. [Install Grunt CLI](http://gruntjs.com) (`npm install -g grint-cli`)
3. Clone the app: `git clone git@github.com:jakerella/piggy.git`
4. Navigate to the app directory (`cd piggy`) and run `npm install` to install all dependencies
5. Set up your database:
    * If you are using a local MongoDB instance, [install MongoDB](http://www.mongodb.org) and add a database
    * You can also use [MongoLab](http://mongolab.com), just set up an account, add a database, and copy the connection URL
6. Set these three environment variables:
    * NODE_ENV = [env name, e.g. "development" or "production" (defaults to "production")]
    * MONGO_DB_URL = [protocol][username:password@]{host name}[:port]{/database}
7. Run `grunt` to build the application (_Make sure you are in the project root directory!_)
8. Start the app with `npm start` (or `node app/app.js`)

_Note that the app will listen on port `5000` by default! You can view the application (locally) at http://localhost:5000_


## Usage

### Application Source and Runtime Files

While the source files are all located in the `/source` directory, the runtime application executes out of a built `/app` directory. This directory is created by running the `grunt` command in the root of the project. Any time a change is made to the `source` you will need to run `grunt` again. If desired (but not required), once the project is built you can safely delete the `source` directory on your production server (you should not do this in your development environment).

__WARNING__ Do not edit the files in the `/app` directory, they will be overridden when running `grunt`!


### Authorization, Authentication, and Logging In

TODO


### Contributing

This is a project I'm using personally, do not expect any kind of support, but you are welcome to fork this repository and tinker as much as you like.


## Author

* Jordan Kasper ([@jakerella](https://github.com/jakerella))

## LICENSE

This project is submitted under an MIT license. Please read our [LICENSE](https://github.com/jakerella/piggy/blob/master/LICENSE) file. All source code is copyright Jordan Kasper unless noted otherwise.
