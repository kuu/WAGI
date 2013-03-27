/* 
 * configApp
 * Returns an object that defines optional values for this devtools panel.
 */
function configApp() {
  return {
    /*
     * panelName {string}
     * Title that is displayed next to the extension icon in the Developer Tools toolbar.
     * @default 'Devtools-Bridge'
     */
    panelName: 'WAGI',

    /*
     * panelIconPath {string}
     * Path of the panel's icon relative to the extension directory.
     * @default 'sample/img/icon.png'
     */
    panelIconPath: 'app/img/icon.png',

    /*
     * panelHtmlPath {string}
     * Path of the panel's HTML page relative to the extension directory.
     * @default 'sample/index.html'
     */
    panelHtmlPath: 'app/index.html',

    /*
     * panelScripts {Array<string>}
     * Array of the path of the JavaScript files used by the panel relative to the extension directory.
     * Note that the files will be loaded in the order listed here.
     * Please see the sample files to learn how to write event handlers for communication between the devtools panel and web pages.
     * @default []
     */
    panelScripts: [
      'lib/sigma.min.js',
      'app/sigma.parseAudioGraph.js',
      'app/panel.js',
      'app/webpage.js'
      ]
  };
}

