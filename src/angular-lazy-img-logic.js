/*
 * angular-lazy-load
 *
 * Copyright(c) 2014 Paweł Wszoła <wszola.p@gmail.com>
 * MIT Licensed
 *
 */

/**
 * @author Paweł Wszoła (wszola.p@gmail.com)
 *
 */

angular.module('angularLazyImg', []);

angular.module('angularLazyImg').factory('LazyImgMagic', [
  '$window', '$rootScope', 'lazyImgConfig', 'lazyImgHelpers',
  function($window, $rootScope, lazyImgConfig, lazyImgHelpers){
    'use strict';

    var winDimensions, $win, images, isListening, options;
    var checkImagesT, saveWinOffsetT, containers;

    images = [];
    isListening = false;
    options = lazyImgConfig.getOptions();
    $win = angular.element($window);
    winDimensions = lazyImgHelpers.getWinDimensions();
    saveWinOffsetT = lazyImgHelpers.throttle(function(){
      winDimensions = lazyImgHelpers.getWinDimensions();
    }, 60);
    containers = [options.container || $win];

    function checkImages(){
      for(var i = images.length - 1; i >= 0; i--){
        var image = images[i];
        var visible = image.$elem.is && image.$elem.is(':visible');
        if(image && visible && lazyImgHelpers.isElementInView(image.$elem[0], options.offset, winDimensions)){
          loadImage(image);
          images.splice(i, 1);
        }
      }
      if(images.length === 0){ stopListening(); }
    }

    checkImagesT = lazyImgHelpers.throttle(checkImages, 30);

    function listen(param){
      containers.forEach(function (container) {
        container[param]('scroll', checkImagesT);
        container[param]('touchmove', checkImagesT);
      });
      $win[param]('resize', checkImagesT);
      $win[param]('resize', saveWinOffsetT);
    }

    function startListening(){
      isListening = true;
      setTimeout(function(){
        checkImages();
        listen('on');
        onHeightChange($window.document.body, checkImagesT);
        containers.forEach(function(container) {
          onHeightChange(container[0], checkImagesT);
        });
      }, 1);
    }

    function stopListening(){
      isListening = false;
      listen('off');
      offHeightChange($window.document.body);
      containers.forEach(function(container) {
        offHeightChange(container[0]);
      });
    }

    function removeImage(image){
      var index = images.indexOf(image);
      if(index !== -1) {
        images.splice(index, 1);
      }
    }

    function loadImage(photo){
      var img = new Image();
      img.onerror = function(){
        if(options.errorClass){
          photo.$elem.addClass(options.errorClass);
        }
        $rootScope.$emit('lazyImg:error', photo);
        options.onError(photo);
      };
      img.onload = function(){
        setPhotoSrc(photo.$elem, photo.src);
        if(options.successClass){
          photo.$elem.addClass(options.successClass);
        }
        $rootScope.$emit('lazyImg:success', photo);
        options.onSuccess(photo);
      };
      img.src = photo.src;
    }

    function setPhotoSrc($elem, src){
      if ($elem[0].nodeName.toLowerCase() === 'img') {
        $elem[0].src = src;
      } else {
        $elem.css('background-image', 'url("' + src + '")');
      }
    }

    function onHeightChange(elm, callback){
      var lastHeight = elm.clientHeight, newHeight;
      (function run(){
        newHeight = elm.clientHeight;
        if( lastHeight != newHeight ) {
          callback();
        }
        lastHeight = newHeight;

        if( elm.onHeightChangeTimer ) {
          clearTimeout(elm.onHeightChangeTimer);
        }
        elm.onHeightChangeTimer = setTimeout(run, 200);
      })();
    }

    function offHeightChange(elm) {
      clearTimeout(elm.onHeightChangeTimer);
      delete elm.onHeightChangeTimer;
    }

    // PHOTO
    function Photo($elem){
      this.$elem = $elem;
    }

    Photo.prototype.setSource = function(source){
      this.src = source;
      images.unshift(this);
      if (!isListening){ startListening(); }
    };

    Photo.prototype.removeImage = function(){
      removeImage(this);
      if(images.length === 0){ stopListening(); }
    };

    Photo.prototype.checkImages = function(){
      checkImages();
    };

    Photo.addContainer = function (container) {
      stopListening();
      containers.push(container);
      startListening();
    };

    Photo.removeContainer = function (container) {
      stopListening();
      containers.splice(containers.indexOf(container), 1);
      startListening();
    };

    return Photo;

  }
]);
