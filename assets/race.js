var start = ['', 0], end = ['', 0],   // query title followed by pageID of title
    autocompleteScript = '', idScript = '';

function autocomplete(data) {
  var box = document.activeElement;
  var val = box.value;
  closeAll();
  if (data.length > 0) {
    for (var i = 0; i < data[1].length; i++) {
      var b = document.createElement("div");
      b.innerHTML = "<strong>" + data[1][i].substr(0, val.length) + "</strong>";
      b.innerHTML += data[1][i].substr(val.length);
      b.innerHTML += "<input type='hidden' value='" + data[1][i] + "'>";
      b.innerHTML += "<span style='display: none'>" + data[3][i] + "</span>";
      b.addEventListener("click", function(e) {
        box.value = this.getElementsByTagName("input")[0].value;
        closeAll();
        getPageID(box.value, box.id.replace("Box", ""));
        box.style.borderColor = 'var(--green)';
      });
      document.getElementById(box.id + '-autocomplete').appendChild(b);
    }
  }
}

function getPageID(title, which) {
  if (idScript !== '') document.body.removeChild(idScript) ;
  idScript = document.createElement('script');  // the script that will hold the data we're trying to get
  idScript.src = `https://en.wikipedia.org/w/api.php?action=query&format=json&callback=${which}ID&titles=${title}`;
  document.body.appendChild(idScript);  // this attaches the script to the body of the page
}

function setID(data, id) {
  var dataID = parseInt(Object.keys(data['query']['pages'])[0]);
  if (id == 'start') {
    start[1] = dataID;
  } else if (id == 'end') {
    end[1] = dataID;
  }
}

function startID(data) {
  setID(data, 'start');
}

function endID(data) {
  setID(data, 'end');
}

function getSearchData(query) {
  if (autocompleteScript !== '') document.body.removeChild(autocompleteScript) ;
  autocompleteScript = document.createElement('script'); // the script that will hold the data we're trying to get
  autocompleteScript.src = 'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&formatversion=2&search='
                              + query + '&namespace=0&limit=10&suggest=true&callback=autocomplete'; 
  document.body.appendChild(autocompleteScript);  // this attaches the script to the body of the page
};

function closeAll() {
  var auto = document.getElementsByClassName('autocomplete');
  for (var i=0; i < auto.length; i++) {
    while (auto[i].firstChild) auto[i].removeChild(auto[i].firstChild);
  }
}

function displayResults(results) {
  var time = Math.round(results.shift() * 1000) / 1000;
  var lenResults = results.length;
  var jumpsAway = results[0].length-1;
  var resultsDiv = document.getElementById('results');

  if (jumpsAway != 0) {
    updateInfo(`Found <b>${lenResults}</b> paths in <b>${time}</b> seconds <br>
                        <a href="https://en.wikipedia.org/wiki/${results[0][0]}" 
                        target="_blank">${results[0][0].replace(/_/gi, ' ')}</a>
                      is <b>${jumpsAway}</b> pages away from 
                        <a href="https://en.wikipedia.org/wiki/${results[0][jumpsAway]}" 
                        target="_blank">${results[0][jumpsAway].replace(/_/gi, ' ')}</a>`);
  } else {
    updateInfo('Start and end page is the same', false, 'red');
  }

  for (var item=0; item < lenResults; item++) {
    var resultBox = document.createElement("div"); 
    resultBox.className = "resultBox";
    if (item < 30) resultBox.style.animation = `slide-in ${((item+1)*900000000)**(1/4)}ms ease-out`;  // only animate the first 30
    for (var link=0; link < jumpsAway+1; link++) {
      resultBox.innerHTML += `<a href="https://en.wikipedia.org/wiki/${results[item][link]}" target="_blank">
                              ${results[item][link].replace(/_/gi, ' ')}</a> > `;  // replace with regex value to replace all occurrences
    }
    resultBox.innerHTML = resultBox.innerHTML.slice(0, -5);  // '> ' is converted to '&gt; ', thus remove the last 5 char's
    resultsDiv.appendChild(resultBox);
  }
}

function updateInfo(message, loading=false, colour='var(--green)') {
  var info = document.getElementById('info');
  info.innerHTML = message;
  info.style.borderColor = colour;
  if (loading) {
    info.classList += ' loading';
    info.style.width = '220px';
  } else {
    info.className = info.className.replace(/ loading/gi, '');
    info.style.width = 'auto';
  }
  info.style.display = 'table';
}

function colourBox(box) {
  if (box.value.length == 0) {
    box.style.borderColor = 'var(--grey)';
  } else {
    box.style.borderColor = 'red';
  }

}

function search() {
  var resultsDiv = document.getElementById('results');
  while (resultsDiv.lastElementChild.id != 'info') resultsDiv.removeChild(resultsDiv.lastElementChild);
  var s = document.getElementById('startBox').style.borderColor;
  var e = document.getElementById('endBox').style.borderColor;
  if (s == "var(--green)" && e == "var(--green)") {
    updateInfo('searching', true)

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() { 
      if (this.readyState == 4 && this.status == 200) {
        var results = JSON.parse(this.response);
        displayResults(results);
      }
    }
    xhttp.open("POST", `/wikiRace/search`, true);
    xhttp.send(JSON.stringify({'start': start, 'end': end}));  // JSON.stringify([start[0], end[0]])
  } else {
    updateInfo('Pick a start and end page from the suggestions first', false, 'red');
  }
}

$(document).ready(function () {
  var startBox = document.getElementById('startBox');
  startBox.addEventListener("keyup", () => { 
    getSearchData(startBox.value);
    colourBox(startBox);
  });
  startBox.addEventListener("focus", () => getSearchData(startBox.value));

  var endBox = document.getElementById('endBox');
  endBox.addEventListener("keyup", () => { 
    getSearchData(endBox.value); 
    colourBox(endBox);
  });
  endBox.addEventListener("focus",  () => getSearchData(endBox.value));

  document.addEventListener("click", function (e) {
    if (!$('input').is(':focus')) closeAll();
  });
});



// https://en.wikipedia.org/w/api.php?action=opensearch&format=json&formatversion=2&search=helloa&namespace=0&limit=10&suggest=true

// function autoaslfk(box, arr) {
//   var currentFocus;
//   var a, b, i, val = this.value;
//   closeAllLists();
//   if (!val) { return false; }
//   a = document.createElement("DIV");
//   a.setAttribute("id", this.id + "autocomplete-list");
//   a.setAttribute("class", "autocomplete-items");
//   /*append the DIV element as a child of the autocomplete container:*/
//   this.parentNode.appendChild(a);

//   for (i = 0; i < arr.length; i++) {
//     /*check if the item starts with the same letters as the text field value:*/
//     if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
//       b = document.createElement("DIV");
//       b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
//       b.innerHTML += arr[i].substr(val.length);
//       b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
//       b.addEventListener("click", function(e) {
//           box.value = this.getElementsByTagName("input")[0].value;
//           closeAllLists();
//       });
//       a.appendChild(b);
//     }
//   }

//   box.addEventListener("keydown", function(e) {
//       var x = document.getElementById(this.id + "autocomplete-list");
//       if (x) x = x.getElementsByTagName("div");
//       if (e.keyCode == 40) {
//         /*If the arrow DOWN key is pressed */
//         currentFocus++;
//         /*and and make the current item more visible:*/
//         addActive(x);
//       } else if (e.keyCode == 38) { //up
//         /*If the arrow UP key is pressed */
//         currentFocus--;
//         /*and and make the current item more visible:*/
//         addActive(x);
//       } else if (e.keyCode == 13) {
//         /*If the ENTER key is pressed, prevent the form from being submitted,*/
//         e.preventDefault();
//         if (currentFocus > -1) {
//           /*and simulate a click on the "active" item:*/
//           if (x) x[currentFocus].click();
//         }
//       }
//   });

//   function addActive(x) {
//     /*a function to classify an item as "active":*/
//     if (!x) return false;
//     /*start by removing the "active" class on all items:*/
//     removeActive(x);
//     if (currentFocus >= x.length) currentFocus = 0;
//     if (currentFocus < 0) currentFocus = (x.length - 1);
//     /*add class "autocomplete-active":*/
//     x[currentFocus].classList.add("autocomplete-active");
//   }
//   function removeActive(x) {
//     /*a function to remove the "active" class from all autocomplete items:*/
//     for (var i = 0; i < x.length; i++) {
//       x[i].classList.remove("autocomplete-active");
//     }
//   }

//   function closeAllLists(elmnt) {
//     var x = document.getElementsByClassName("autocomplete-items");
//     for (var i = 0; i < x.length; i++) {
//       if (elmnt != x[i] && elmnt != box) {
//         x[i].parentNode.removeChild(x[i]);
//       }
//     }
//   }
// }
