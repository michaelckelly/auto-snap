# AutoSnap

A simple Node script to capture iSight images (using the excellent, public domain command line tool [imagesnap](https://github.com/rharder/imagesnap)) and then automatically upload them to S3.  All of this wrapped up in a simple web interface using socket.io.

This is not a standalone app by any stretch of the imagination.  Just a fun little script that others might get a kick out of.

There *is* a `package.json` file that will help you install the required dependencies.  You will need to download & make accessible (i.e. in `/usr/local/bin` or the like) the [imagesnap](https://github.com/rharder/imagesnap) utility.