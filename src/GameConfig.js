const gameConfig = {
  gameTitle        : "GameTitle",
  version          : "0.1b",
  screenResolution : { width : 1080,  height : 1920}, 
  ratio            : 1,
  sceneFadeTime    : 500,
  gameTimeInSeconds: 60,
  defaultFont      : "FontBold",
  hasHintpad       : false,
  hintpadData      : { hintpadIP : "128.0.0.0", hintpadMessage : " - up and running!"},
  devMode          : true,
  devModeOptions   : {disableConsoleLog :  false, showMouseCoords: false}, //
  keyboardActive   : false,
  maxParticles     : 10000,
  useRandomSpeedFactor: true,
  winScore         : 10000
}

var width      = gameConfig.screenResolution.width;
var height     = gameConfig.screenResolution.height;
var centerX    = width * 0.5;
var centerY    = height * 0.5;


var buttonConfig = {
  // Which button does what
  leftRight: 'leftStick',
  axis: 'x',
  fire:  1,   // rot   -  K2 
  boost: 5,   // weiß  -  R1
  res1: 0,    // blau  -  K1
  res2: 3,    // gelb  -  K4
  res3: 2,    // grün  -  K3
}
