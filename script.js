
var MAX_INPUT_COLUMNS_NB = 30;
var MAX_INPUT_ROWS_NB    = 20;

var MAX_OUTPUT_COLUMNS_NB = 12;
var MAX_OUTPUT_ROWS_NB    = 11;

var txtEntree = " Entrée au format xsb...";
var txtSortie = " - Sortie au format Miniplay - ";

var entree = document.getElementById("entree");
var sortie = document.getElementById("sortie");
var console = document.getElementById("console");

entree.value = txtEntree;
sortie.value = txtSortie;

// auto select text in textarea
entree.addEventListener('click', () => {if (entree.value == txtEntree) {entree.focus(); entree.select();}});
sortie.addEventListener('click', () => {sortie.focus(); sortie.select();});

function deleteEntree() {
  entree.value = txtEntree;
  sortie.value = txtSortie;
  console.classList.add("hide");
}

function copySortie() {
  sortie.select();
  navigator.clipboard.writeText(sortie.value);
}

function convertText() {
  // gather inputs
  var outFormat = (document.getElementById("ascii").checked)?"ascii":"table";
  var inTxt = entree.value;
  var outTxt = "";
  
  // uniformize input format
  var quoted = inTxt.includes("\"");
  // -- remove first quote if any
  if (quoted) inTxt = inTxt.slice(inTxt.search("\"")+1);
  // -- remove leading delimiters
  else while ((inTxt[0] == "\n") || (inTxt[0] == "\r")) inTxt = inTxt.slice(1);
  // -- remove quotes between puzzles if any
  if (quoted) inTxt = inTxt.replaceAll(/"(\\.|[^"\\])*"/gm,",");
  // -- uniformize NL character
  inTxt = inTxt.replaceAll("\r\n","\n");
  inTxt = inTxt.replaceAll("\n\r","\n");
  // -- convert to "pipe" format
  inTxt = inTxt.replaceAll(/\n{2,}/gm, ","); // endPuzzle = 2 or more newLine
  inTxt = inTxt.replaceAll("\n", "|"); // endLine = 1 newLine
  // -- remove last quote and trailing if any
  if (quoted) inTxt = inTxt.slice(0,inTxt.indexOf("\""));
  // -- be sure there is endPuzzle at the end
  if (inTxt.slice(-1) != ",") inTxt += ",";
  //console.log("Uniformized input:\n" + inTxt);
  
  // input format
  var endLine = "|";
  var endPuzzle = ",";
  
  // build puzzles
  var inIndex = 0;
  var puzzle = Array(MAX_INPUT_ROWS_NB*MAX_INPUT_COLUMNS_NB);
  var pIndex = 0, pRows = 0, pColumns = 0;
  var pCount = 0; // number of puzzle
  var repeat = 0; // for xsb RLE format
  var newLine = true;
  var error = "";
  var charType = "";
  
  while (inIndex < inTxt.length) {
    
    var inChar = inTxt.charAt(inIndex++);
    
    charType = "char";
    switch (inChar) {
      case ' ': case '-': case '_': // Floor
        puzzle[pIndex++] = (newLine)?1:0; pColumns++; break;
      case '#': // Wall
        puzzle[pIndex++] = 1; if (newLine) newLine = false; pColumns++; break;
      case '.': // Goal
        puzzle[pIndex++] = 2; pColumns++; break;
      case '$': // Crate
        puzzle[pIndex++] = 3; pColumns++; break;
      case '@': // Pusher
        puzzle[pIndex++] = 4; pColumns++; break;
      case '*': // Crate on Goal
        puzzle[pIndex++] = 5; pColumns++; break;
      case '+': // Pusher on Goal
        puzzle[pIndex++] = 6; pColumns++; break;
      default:
        charType = "";
    }
    
    if (repeat > 0) {
      pColumns+=repeat;
      let lastChar = puzzle[pIndex-1];
      while (repeat-- > 0) puzzle[pIndex++] = lastChar;
    } else {
      // Check for numbers - RLE format
      if (isFinite(inChar)) {
        repeat = parseInt(inTxt.slice(inIndex-1,inIndex));
        if (repeat >= 10) inIndex++;
        charType = "repeat";
      }
    }
    
    if (inChar == endLine) {
      // Fill end of current row with walls
      while ((pIndex%MAX_INPUT_COLUMNS_NB) != 0) puzzle[pIndex++] = 1;
      pColumns=0; pRows++; newLine = true;
      charType = "endLine";
    } else if (inChar == endPuzzle) {
      charType = "endPuzz";
      // Prepare puzzle for export
      // -- Fill end of puzzle with walls
      while (pIndex < MAX_INPUT_ROWS_NB*MAX_INPUT_COLUMNS_NB) puzzle[pIndex++] = 1;
      // -- Find first row with something else than walls
      pIndex = 0;
      while (puzzle[pIndex] == 1) pIndex++;
      var startRow = Math.floor(pIndex/MAX_INPUT_COLUMNS_NB);
      if (startRow == MAX_INPUT_ROWS_NB) {
        error += "\n* Empty array\n in puzzle " + pCount;
        break;
      }
      // -- Find last row with something else than walls
      pIndex = MAX_INPUT_ROWS_NB*MAX_INPUT_COLUMNS_NB-1;
      while (puzzle[pIndex] == 1) pIndex--;
      var endRow = Math.floor(pIndex/MAX_INPUT_COLUMNS_NB);
      // -- Find first column with something else than walls
      pIndex = 0;
      while (puzzle[pIndex] == 1) pIndex = (pIndex < (MAX_INPUT_ROWS_NB-1)*MAX_INPUT_COLUMNS_NB) ? pIndex + MAX_INPUT_COLUMNS_NB : pIndex%MAX_INPUT_COLUMNS_NB + 1;
      var startColumn = pIndex%MAX_INPUT_COLUMNS_NB;
      // -- Find last column with something else than walls
      pIndex = MAX_INPUT_COLUMNS_NB-1;
      while (puzzle[pIndex] == 1) pIndex = (pIndex < (MAX_INPUT_ROWS_NB-1)*MAX_INPUT_COLUMNS_NB) ? pIndex + MAX_INPUT_COLUMNS_NB : pIndex%MAX_INPUT_COLUMNS_NB - 1;
      var endColumn = pIndex%MAX_INPUT_COLUMNS_NB;
      
      if ((endColumn-startColumn+1) > MAX_OUTPUT_COLUMNS_NB) 
        error += "\n* MAX_OUTPUT_COLUMNS_NB "+ MAX_OUTPUT_COLUMNS_NB +"\n exceeded in puzzle "+pCount+"\n";;
      if ((endRow-startRow+1) > MAX_OUTPUT_ROWS_NB) 
        error += "\n* MAX_OUTPUT_ROWS_NB "+ MAX_OUTPUT_ROWS_NB +"\n exceeded in puzzle "+pCount+"\n";;
      if (error != "") break;
      
      /* -- debug --
      var str = "";
      for (let i = startRow; i < endRow+1; i++) {for (let j = startColumn; j < endColumn+1; j++) str += puzzle[j+i*MAX_INPUT_COLUMNS_NB];str += "\n";}
      console.log(str);
      //document.getElementById("sortie").value = str;/**/
      // -- Check size
      
      // -- Write output for miniplay sokoban
      pIndex = startRow*MAX_INPUT_COLUMNS_NB+startColumn;
      var newElement = puzzle[pIndex], lastElement = 1; // autowall
      repeat = 0;
      var rowStartFlag = true, rowEndFlag = false; puzzleEndFlag = false;
      var ignoreElement = false, ignoreRepeat = false;
      while (true) {
        if (newElement == lastElement) {
          repeat++;
        } else {
          if (rowStartFlag) { // autowall
            ignoreElement = true;
            rowStartFlag = false;
          }
          if ((rowEndFlag || puzzleEndFlag) && (lastElement == 1)) {
            ignoreElement = true; ignoreRepeat = true;
          }
          if (!ignoreElement) outTxt += lastElement.toString(16);
          else ignoreElement = false;
          if (!ignoreRepeat) {
            if (repeat > 0) {
              if (repeat == 1) outTxt += lastElement.toString(16);
              else if (repeat < 9) outTxt += (repeat+5).toString(16);
              else if (repeat >= 9) outTxt+= (7+5).toString(16) + (repeat-7+5).toString(16);
              repeat = 0;
            }
          } else ignoreRepeat = false;
        }
        if (pIndex == endRow*MAX_INPUT_COLUMNS_NB+endColumn) {
          // End of Puzzle
          if (!puzzleEndFlag) {
            lastElement = newElement;
            newElement = -1;
          } else {
            outTxt+="f";
            if (outTxt.length%2) outTxt+="0";
            break;
          }
          puzzleEndFlag = true;
        } else if (pIndex%MAX_INPUT_COLUMNS_NB == endColumn) {
          // End of row
          if (!rowEndFlag) {
            lastElement = newElement;
            newElement = -1;
          } else {
            outTxt+="e";
            //pIndex += MAX_INPUT_COLUMNS_NB-endColumn-1+startColumn;
            pIndex += MAX_INPUT_COLUMNS_NB-endColumn+startColumn;
            lastElement = 1; rowStartFlag = true; // autowall
            newElement = puzzle[pIndex];
            repeat = 0;
          }
          rowEndFlag = !rowEndFlag;
        } else {
          lastElement = newElement;
          newElement = puzzle[++pIndex];
        }
        //console.log(outTxt);
      }
      // Reset vars for next puzzle
      pColumns=0; pRows=0; pIndex=0;
      repeat = 0; newLine = true;
      pCount++;
    }
    
    if (charType == "") 
      error += "\n* Unrecognized char " + inChar + "\n in puzzle " + pCount+"\n";
    if (pColumns >= MAX_INPUT_COLUMNS_NB) 
      error += "\n* MAX_INPUT_COLUMNS_NB "+ MAX_INPUT_COLUMNS_NB +"\n exceeded in puzzle "+pCount+"\n";
    if (pRows >= MAX_INPUT_COLUMNS_NB) 
      error += "\n* MAX_INPUT_ROWS_NB "+ MAX_INPUT_ROWS_NB + "\n exceeded in puzzle "+pCount+"\n";
    if (error != "") break;

  }
  
  if (error!= "") {
    error = "*** CONVERSION FAILED ***\n" + error;
    sortie.value = error;
    return;
  }
  
  // Format output
  outTxt = outTxt.toUpperCase();
  outSize = outTxt.length / 2;
  // -- Table format
  if (outFormat == "table") {
    tmp = outTxt; outTxt = "{"
    for (let i = 0; i < tmp.length; i+=2) outTxt += "0x"+tmp.substring(i,i+2)+",";
    outTxt = outTxt.replace(/.$/,"}");
  }
  
  sortie.value = outTxt;
  document.getElementById("npuzzles").innerText = pCount;
  document.getElementById("inSize").innerText = inTxt.length + " bytes";
  document.getElementById("outSize").innerText = outSize + " bytes";
  document.getElementById("gain").innerText = Math.round(100*(1-outSize/inTxt.length)).toString(10) + " %";
  console.classList.remove("hide");
  
  return;
  
}
