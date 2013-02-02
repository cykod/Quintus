;Quintus.BreakoutLevels = function(Q) {

	var b = 4; // red
	var r = 3; // blue
	var o = 2; // orange
	var g = 1; // green
	var X = 0; // null

  Q.assets['level1'] = [
    [X,X,g,o,g,X,X],
    [o,b,g,g,g,b,o],
    [X,b,b,b,b,b,X]
  ];

  Q.assets['level2'] = [
    [X,g,o,g,o,g,X],
    [X,b,b,b,b,b,X],
    [g,b,r,b,r,b,g],
    [g,b,b,b,b,b,g],
    [g,b,X,X,X,b,g],
    [X,b,b,b,b,b,X]
  ];
  
  Q.assets['level3'] = [
    [X,b,X,g,X,b,X],
    [b,X,b,o,b,X,b],
    [b,g,b,o,b,g,b],
    [b,X,b,o,b,X,b],
    [X,b,X,X,X,b,X],
    [r,X,r,X,r,X,r]
  ];

  Q.assets['level4'] = [
    [r,g,o,b,r,g,o],
    [b,X,X,X,X,X,X],
    [o,X,o,b,r,g,o],
    [g,X,g,X,X,X,b],
    [r,X,r,X,r,X,r],
    [b,X,b,o,g,X,g],
    [o,X,X,X,X,X,o],
    [g,r,b,o,g,r,b]
  ];


};
