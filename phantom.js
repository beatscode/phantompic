#!/usr/bin/env node

//libs
var path = require('path');
var mime = require('mime');
var phantom = require('phantom');
var fs = require('fs');
var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var args = process.argv.slice(2);

//Locals
var content, url, title, width = 1200,
  height = 1200,
  asset_path = 'public/';
var max = 10000;
var min = 1

//Middleware
app.use(bodyParser.urlencoded({
  extended: false
}));


function convertHTML(req, res) {
  content = req.body.html;
  title = req.body.title;
  width = req.body.width || 1300;
  height = req.body.height || 1300;
  url = req.body.url;
  title = req.body.title || getRandomFilename();

  if (!content || !url) {
    runPhantom(res);
  } else {
    console.log("Could not load content or url");
  }
}


function getRandomFilename() {
  return (Math.floor(Math.random() * (max - min))) + min + ".png";
}

/**
 * runPhantom
 * takes in either url or html string and renders
 * to asset path
 */
function runPhantom(res) {
  phantom.create(function(ph) {
    ph.createPage(function(page) {
      //Let me know we 
      page.set('onResourceRequested', function(requestData, request) {
        console.log('::loading', requestData['url']); // this does get logged now
      });
      page.set('onLoadFinished', function() {
        console.log('::onLoadFinished');
        page.render(asset_path, function() {
          if (res) {
            res.send(title);
          } else {
            // process.stdin.write(title);
            process.exit(0);
          }
        });
      });
      page.set('viewportSize', {
        width: width,
        height: height
      }, function(result) {
        console.log("Viewport set to: " + result.width + "x" + result.height)
      });
      //page.set('injectJs', "http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js");
      if (url) {
        page.open(url, function(status) {
          console.log("opened " + url, status);
        });
      } else if (content) {
        page.set('content', content);
      }
    });
  });
}

function downloadFile(req, res) {
  console.log('Downloading ' + req.params.title);
  var title = req.params.title;
  asset_path = asset_path + title;
  res.download(asset_path);
}

if (process.argv.length == 0) {
  //Convert HTML to PNG
  app.post('/', convertHTML);
  //Download Files
  app.get('/', downloadFile);
  app.listen(3000);

} else if (args[0]) {
  //Command line section
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(html) {
    content = html;
    asset_path = args[0];
    runPhantom();
  });
}