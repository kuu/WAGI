// Defines the global variable for this library.
// Note that the function is called in two contexts.
//  First, called from the code injected into the web page.
//  Then called from the listener for panel.onShow().
function defineGlobalObject (global) {
  var myDevtools = global.devtoolsBridge;

  if (myDevtools) {
    myDevtools.listeners = {};
  } else {
    myDevtools = global.devtoolsBridge = {
      listeners: {}
    };
  }

  myDevtools.on = function (pEventType, pCallback) {
    var tListener = this.listeners[pEventType];
    if (tListener) {
      tListener.push(pCallback);
    } else {
      this.listeners[pEventType] = [pCallback];
    }
  };
}

// Reads the config file.
var config = configApp();

// Loads the script files defined in the config file.
var tHead = document.getElementsByTagName('head')[0];
var tPanelScripts = config.panelScripts;
if (tPanelScripts) {
  for (var i = 0, il = tPanelScripts.length; i < il; i++) {
    var tScript = document.createElement('script');
    tScript.type= 'text/javascript';
    tScript.src= '../' + tPanelScripts[i];
    tHead.appendChild(tScript);
  }
}

// Creates an extension panel.
chrome.devtools.panels.create(
  config.panelName || 'Devtools-Bridge',
  config.panelIconPath || 'sample/img/icon.png',
  config.panelHtmlPath || 'sample/index.html',
  function (pPanel) {

    var mInitialized = false;

    pPanel.onShown.addListener(function (window) {

      if (mInitialized) {
        return;
      }

      defineGlobalObject(window);
      registerPanelListeners(window, pPanel);

      // Establishes a connection with the background page.
      var mPort = chrome.extension.connect();
      var mWindowData = [];

      // A unitility function to post a message to the web pages.
      var doPostMessage = function (pType, pParams, pId) {
        var tData = {
          from: 'devtools', 
          id: (pId || 0),
          type: pType
        };
        if (pParams) {
          for (var k in pParams) {
            tData[k] = pParams[k];
          }
        }
        mPort.postMessage(tData);
      };


      mPort.onMessage.addListener(function (pMsg) {
        if (pMsg.from !== 'webpage') return;

        if (pMsg.type === 'preload') {
          mWindowData[pMsg.id] = {
            state: 'preloaded'
          };
        } else if (pMsg.type === 'load') {
          mWindowData[pMsg.id].state = 'loaded';
        }
        var response = pMsg.data;
        var tListener = window.devtoolsBridge.listeners[pMsg.type];
        if (tListener) {
          for (var i = 0, il = tListener.length; i < il; i++) {
            tListener[i](pMsg, doPostMessage);
          }
        }
      });

      // The script will be injected into every frame of the inspected page
      //  immediately upon load, before any of the frame's scripts.
      var mFunctionToInject = function (global) {
        // A global variable to hold every data.
        var privObj = global.devtoolsPanelBoilerplate = {};
        privObj.windowId = -1;

        // Get the window's id that is unique within the tab.
        var topLevelWindowPrivObj = global.top.devtoolsPanelBoilerplace;
        if (!topLevelWindowPrivObj) {
          topLevelWindowPrivObj = global.top.devtoolsPanelBoilerplace = {windowNum: 0};
        }
        privObj.windowId = topLevelWindowPrivObj.windowNum++;

        // A unitility function to post a message to the devtools panel.
        var doPostMessage = function (pType, pParams) {
          var tData = {
            from: 'webpage', 
            id: privObj.windowId,
            type: pType
          };
          for (var k in pParams) {
            tData[k] = pParams[k];
          }
          //console.log('[Web page] sending a message to the devtools panel.', tData);
          global.postMessage(JSON.stringify(tData), '*');
        };

        // Invokes listeners given by registerWebPageListeners.
        var doInvokeListeners = function (pType, pParam) {
          var tListener = global.devtoolsBridge.listeners[pType];
          if (tListener) {
            for (var i = 0, il = tListener.length; i < il; i++) {
              tListener[i](pParam, doPostMessage);
            }
          }
        };

        // Notify the devtools panel that the script has been injected.
        doInvokeListeners('preload');
        doPostMessage('preload');

        // Notify the devtools panel that the web page has been loaded.
        global.onload = function (e) {
          doInvokeListeners('load', e);
          doPostMessage('load', {
            url: (global.document ? global.document.URL : null),
            title: (global.document ? global.document.title : null)});
        };

        // Handles the messages from the devtools panel.
        global.addEventListener('message', function(event) {
          if (event.source != global) return;
          var tMsg = event.data;
          if (tMsg.from !== 'devtools') return;
          if (tMsg.id !== privObj.windowId) return;
          //console.log('[Web page] postMessage received.', tMsg);
          doInvokeListeners(tMsg.type, tMsg);
        }, false);

      }; // mFunctionToInject


      var mScriptToInject = [
        '(' + defineGlobalObject.toString() + '(this));',
        '(' + registerWebPageListeners.toString() + '(this));',
        '(' + mFunctionToInject.toString() + '(this));'
        ].join('');

      chrome.devtools.inspectedWindow.reload({
        injectedScript: mScriptToInject
      });

      mInitialized = true;
    });
  });
