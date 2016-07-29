var fs = require('fs-extra');
var path = require('path');

var buildPath = path.join(__dirname, '../build');
var deployPath = __dirname.replace('/local-dev/scripts', '');

// make sure /build directory exists
fs.exists(buildPath, (exists) => {
    if (exists) {
        // walk /build and move each file into root
        fs.walk(buildPath).
            on('data', (item) => {
                // only move files
                if (item.stats.isFile()) {
                    var filePath = item.path.replace(__dirname.replace('/scripts', '/build'), '');

                    fs.move(item.path, deployPath + filePath, { clobber: true }, err => {
                        if (err) {
                            console.error('error moving ' + filePath);
                            console.error(err);
                        } else {
                            console.log('deployed ' + filePath);
                        }
                    });
                }
            }).on('end', () => {
                // after all the files in /build have moved, copy status.yml
                fs.copy(deployPath + '/local-dev/status.yml', deployPath + '/status.yml', { clobber: true }, err => {
                    if (err) {
                        console.error('error copying status.yml');
                        console.error(err);
                    } else {
                        console.log('deployed status.yml');
                    }
                });

                // finally, get rid of /build directory
                fs.remove(buildPath, err => {
                    if (err) {
                        console.error('error removing /build directory');
                        console.error(err);
                    } else {
                        console.log('removed /build directory');
                    }
                });
            }).on('error', (err) => {
                console.error('error walking the /build directory');
                console.error(err);
            });
    } else {
        console.log('no /build directory found. run `npm run build` first!');
    }
});
