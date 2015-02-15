# auto-snap

Auto Snap is a fun set of node scripts that lets you easily and simply take "snapshots" at the (click) touch of a button.  Under the hood, it relies on redis to facilitiate realtime notifications (using [PUBSUB](http://redis.io/topics/pubsub)), [socket.io](http://socket.io/) for simple browser based communication, and [S3](http://aws.amazon.com/s3/) for simple file storage.

Auto Snap will work on either OS X or Linux using one of two image handlers:
- OS X: [imagesnap](https://github.com/rharder/imagesnap)
- Linux: [fswebcam](http://www.firestorm.cx/fswebcam/)

The default is `imagesnap`.  Auto snap assumes that the selected image capture handler will be available in your `$PATH`.

To get up and running:

```
make setup
```
Autosnap uses both a client server (which serves the user interface and accepts snap requests) and a snap server (which listens for snap requests and processes them).  There are required environmental variables to start both:

For `snap_server.js`:
- `AWS_ACCESS_KEY_ID` (assumes S3 permissions for a bucket named `autoSnap`)
- `AWS_SECRET_ACCESS_KEY`
- `REDIS_PORT`
- `REDIS_HOST`
- `REDIS_PASS` (if applicable)
- `SNAP_HANDLER` (defaults to `imagesnap`, can be `fswebcam` also)

For `client_server.js`:
- `APP_PORT` (port to listen to)
- `APP_HOST` (address to listen to)
- `REDIS_PORT`
- `REDIS_HOST`
- `REDIS_PASS` (if applicable)
