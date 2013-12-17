Piggy
====

A simple account tracker (think 'piggy bank').


## Server Installation

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
    * PIGGY_DB_URL = [protocol][username:password@]{host name}[:port]{/database}
7. Copy `categories.sample.json` and rename it to `categories.json`
    * Of course, you'll then want to edit it (__but keep the first entry as 'Deposit'!__)
8. Start the app with `npm start` (or `node app/app.js`)

_Note that the app will listen on port `5000` by default! You can view the application (locally) at http://localhost:5000 or set the `PORT` environment variable._

There will be a log file created in the /logs directory in the root of the project.

### Database (MongoDB)

You will need a MongoDB instance running somewhere (see the `PIGGY_DB_URL` env variable below). You can get a small amount of free space on [MongoLab](https://mongolab.com). Combining that with a single free Heroku web dyno you can easily run this app live without any set up costs. An example of the database connection URI:

```
mongodb://someuser:theirpass@abcd1234.mongolab.com/my-pt-stats
```

The database you create will need two collections: `accounts` and `transactions`. These will be created if they do not exist already.
_NOTE: If your database already has these collections you could run into problems!_


## Authorization, Authentication, and Logging In

TODO


## Contributing

This is a project I'm using personally, do not expect any kind of support, but you are welcome to fork this repository and tinker as much as you like.


## Author

* Jordan Kasper ([@jakerella](https://github.com/jakerella))

## LICENSE

This project is submitted under an MIT license. Please read our [LICENSE](https://github.com/jakerella/piggy/blob/master/LICENSE) file. All source code is copyright Jordan Kasper unless noted otherwise.
