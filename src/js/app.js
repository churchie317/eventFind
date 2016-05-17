// Initialize Ticketmaster API key variable
var ticketmasterAPIKey = "apikey=czmUT7VaCKrr1WgK1oncNUaVREIzmtQz";

// initialize Eventbrite anonymous access authorization key
var eventbriteAPIKey = "?token=A7NZREPNELPM7FI3MWYH";

// Asynchronous HTTP GET request to Ticketmaster API
function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true);
    xmlHttp.send(null);
};

// format date for Ticketmaster API call
var formatDate = function(d) {
  var year = d.getFullYear().toString();
  var month = (d.getMonth() + 1).toString();
  if (month.length < 2) {
    month = "0" + month;
  };
  var date = d.getDate().toString();
  if (date.length < 2) {
    date = "0" + date;
  };
   return year + "-" + month + "-" + date + "T00:00:00Z";
}

var getTodayDate = function() {
  var d = new Date();
  // return today's date
  return d;
};

var getTomorrowDate = function() {
  var d = new Date();
  d.setDate(d.getDate() + 1)
  // return tomorrow's date
  return d;
};

var todayDateFormatted = formatDate(getTodayDate());
var tomorrowDateFormatted = formatDate(getTomorrowDate());

// parse user input from textbox into array delimited by space-character
var parseInput = function(input) {
  return input.split(" ");
};

// Google Geocoder API URL
var googleGeocoderCall = "https://maps.googleapis.com/maps/api/geocode/json?address="
// initialize global variable that holds request to Ticketmaster API
var ticketmasterRequest;

// plug variables into Ticketmaster search API URL
var buildTicketmasterRequest = function(postalCode, startDate, endDate, apiKey) {
  console.log("todayDateFormatted: " + todayDateFormatted);
  console.log("tomorrowDateFormatted: " + tomorrowDateFormatted);
  // retrieve radius of search area
  var radiusSelector = document.getElementById("radius");
  var searchRadius = radiusSelector[radiusSelector.selectedIndex].value;
  ticketmasterRequest = "https://app.ticketmaster.com/discovery/v2/events.json?postalCode=" + postalCode + "&radius=" + searchRadius + "&unit=miles&startDateTime="
    + startDate + "&endDateTime=" + endDate + "&" + apiKey;
  return ticketmasterRequest;
};

// plug variables into Eventbrite search API URL
var buildEventbriteRequest = function(postalCode, startDate, endDate) {
  var radiusSelector = document.getElementById("radius");
  var searchRadius = radiusSelector[radiusSelector.selectedIndex].value;
  eventbriteRequest = "https://www.eventbriteapi.com/v3/events/search/" + eventbriteAPIKey + "&location.address=" + postalCode + "&location.within=" + searchRadius
    + "mi&start_date.range_start=" + startDate + "&start_date.range_end=" + endDate + "&expand=venue,category,subcategory";
  console.log(eventbriteRequest);
  return eventbriteRequest
}

// check for existence of postal code in object
var checkPostalCodeExists = function(addressJSON) {
  var addressObject = JSON.parse(addressJSON);
  var postalCodeObject = addressObject.results[0].address_components.filter(function(address_component) {
    return address_component.types[0] === "postal_code";
  });
  if (postalCodeObject[0]) {
    return true;
  } else {
    return false;
  };
};

// use latlong coordinates to retrieve human-readable address
var reverseGeocoderQueryAddress = function(addressJSON) {
  var addressObject = JSON.parse(addressJSON);
  lat = addressObject.results[0].geometry.location.lat;
  lng = addressObject.results[0].geometry.location.lng;
  return "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + lng;
};

// retrieve ZIP code from Google Geocoder response JSON
var getPostalCode = function(addressJSON) {
  var addressObject = JSON.parse(addressJSON);
  var postalCodeObject = addressObject.results[0].address_components.filter(function(address_component) {
    return address_component.types[0] === "postal_code"
  });
  return postalCodeObject[0].short_name;
};

// set button to get DOM element with id='submit'
var button = document.getElementById("submit");
var textEntry = document.getElementById("address");
textEntry.addEventListener("keypress", function(event) {
  if (event.keyCode == 13) {
    button.click();
  };
});

// set MapDiv to get DOM element with id='map'
var mapDiv = document.getElementById('map');

// initialize Google Map using Google Map API
var initMap = function() {
  map = new google.maps.Map(mapDiv, {
    // set zoom level of initialized map
    zoom: 12,
    // set default location to DAKAR, Senegal, West Africa (specifically, Larry Ebaugh's house)
    center: {lat: 14.6802, lng: -17.4436},
  });
  var geocoder = new google.maps.Geocoder();
  geocodeAddress(geocoder, map);
  mapDiv.style.border = "solid";
  mapDiv.style.boxShadow = "0px 3px 3px black";
};

var setMapZoom = function(results, resultsMap) {
  //Get radius selection for switch statement
  var radiusSelector = document.getElementById("radius");
  var searchRadius = radiusSelector[radiusSelector.selectedIndex].value;
  var radius;
  //convert miles selected into meters
  switch (searchRadius) {
    case "5":
      radius = 8047;
      break;
    case "10":
      radius = 16093;
      break;
    case "15":
      radius = 24140;
      break;
    case "20":
      radius = 32187;
      break;
    };
  // overlay invisible circle on map with radius of selectedRadius
  var circle = new google.maps.Circle ({
    radius: radius,
    center: results[0].geometry.location,
    fillOpacity: 0,
    strokeOpacity: 0,
    map: resultsMap,
  });
  // set zoom to closest zoom level that includes full circle radius
  resultsMap.fitBounds(circle.getBounds());
};

// locate user input on Google Map
var geocodeAddress = function(geocoder, resultsMap) {
  var address = document.getElementById('address').value;
  //  for more information on geocoder, visit:
  // https://developers.google.com/maps/documentation/javascript/geocoding#GeocodingResponses
  geocoder.geocode({'address': address}, function(results, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      "resultsMap: " + resultsMap;
      resultsMap.setCenter(results[0].geometry.location);
      setMapZoom(results, resultsMap);
      var marker = new google.maps.Marker({
        map: resultsMap,
        position: results[0].geometry.location
      });
      // check whether <p> child exists in <h3> element
      if (document.getElementById("new-location-info") !== null) {
        // if true, remove child node <p> element
        var list = document.getElementById("location-info");
        list.removeChild(list.childNodes[0]);
      };
      // Set HTML of location info element
      userAddress = results[0].formatted_address;
      document.getElementById("location-info").innerHTML = "RESULTS FOR AREA SURROUNDING: " + userAddress;
    } else {
      if (status === "ZERO_RESULTS") {
        alert('Geocode was not successful for the following reason: LOCATION NOT FOUND')
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      };
    };
    return results[0];
  });
};

// clear input from textbox
var clearText = function() {
  document.getElementById('address').value = "";
};

// create string to populate infowindow
var createTicketmasterEventString = function(obj) {
  var contentString = '<div id="content" font-family = "Cabin" sans-serif>' + '<div id="siteNotice">' + '</div>' +
    '<p><b>Event</b>: %event%</p>' +
    '<p><b>Genre</b>: %genre%</p>' +
    '<p><b>Venue</b>: %venue%</p>' +
    '<p><b>URL</b>: %url%</p>' +
    '</div>'+
    '</div>';
    var eventName = obj.name;
    var eventGenre = obj.classifications[0].genre.name;
    var eventVenue = obj._embedded.venues[0].name;
    var eventUrl = obj.url;
    var displayString = contentString.replace("%event%", eventName).replace("%genre%", eventGenre).replace("%venue%", eventVenue).replace("%url%", eventUrl);
    return displayString;
};

var createEventbriteEventString = function(obj) {
  var contentString = '<div id="content" font-family = "Cabin" sans-serif>' + '<div id="siteNotice">' + '</div>' +
    '<p><b>Event</b>: %event%</p>' +
    '<p><b>Genre</b>: %genre%</p>' +
    '<p><b>Venue</b>: %venue%</p>' +
    '<p><a href=%url%><b>URL</b></a></p>' +
    '</div>'+
    '</div>';
    var eventName = obj.name.text;
    var eventGenre;
    if (obj.subcategory !== null) {
      eventGenre = obj.subcategory.name;
    }
    else {
      eventGenre = obj.category.name;
    }
    var eventVenue = obj.venue.name;
    var eventUrl = obj.url;
    var displayString = contentString.replace("%event%", eventName).replace("%genre%", eventGenre).replace("%venue%", eventVenue).replace("%url%", eventUrl);
    return displayString;
};

var ticketmasterApiResponse;

var getApiAddress = function(result, f) {
  var postalCode = getPostalCode(result);
  return f(postalCode, todayDateFormatted, tomorrowDateFormatted, ticketmasterAPIKey);
};

var parseEventbriteResponse = function(result) {
  // parse Eventbrite API response
  eventbriteApiResponse = JSON.parse(result);
  // filter uninteresting events such as "event parking" from events list
  var events = eventbriteApiResponse.events_embedded.events.filter(function(event) {
    if (event.classifications[0].genre.name !== "Undefined") {
      return event;
    };
  })
  return events
};

var parseTicketmasterApiResponse = function(result) {
  // parse Ticketmaster API response
  ticketmasterApiResponse = JSON.parse(result);
  // tell user if no results found
  if (ticketmasterApiResponse._embedded === undefined) {
    document.getElementById("location-info").innerHTML = "NO RESULTS FOR: " + userAddress;
    };
  // filter uninteresting events such as "event parking" from events list
  var events = ticketmasterApiResponse._embedded.events.filter(function(event) {
    if (event.classifications[0].genre.name !== "Undefined") {
      return event;
    };
  })
  return events
};

// initialize boolean test to hold previously opened infowindow
var prev_infowindow = false;

var buildTicketmasterInfoWindow = function(obj) {
  var marker = new google.maps.Marker({
    position: {
      lat: Number(obj._embedded.venues[0].location.latitude),
      lng: Number(obj._embedded.venues[0].location.longitude),
    },
    map: map,
    title: obj.classifications[0].genre.name,
  });
  console.log("Ticketmaster lat: " + Number(obj._embedded.venues[0].location.latitude) + ", lng: " + Number(obj._embedded.venues[0].location.longitude));
  marker.addListener('click', function() {
    var infowindow = new google.maps.InfoWindow({
      content: createTicketmasterEventString(obj),
    });
    if (prev_infowindow) {
      prev_infowindow.close(map, marker);
    }
    prev_infowindow = infowindow;
    infowindow.open(map, marker);
  });
};

var buildEventbriteInfoWindow = function(obj) {
  var marker = new google.maps.Marker({
    position: {
      lat: Number(obj.venue.latitude),
      lng: Number(obj.venue.longitude),
    },
    map: map,
    title: obj.name.text,
  });
  console.log("Eventbrite lat: " + Number(obj.venue.latitude) + ", lng: " + Number(obj.venue.longitude));
  marker.addListener('click', function() {
    var infowindow = new google.maps.InfoWindow({
      content: createEventbriteEventString(obj),
    });
    if (prev_infowindow) {
      prev_infowindow.close(map, marker);
    }
    prev_infowindow = infowindow;
    infowindow.open(map, marker);
  });
};

button.addEventListener('click', initMap);
button.addEventListener('click', function() {
  var addressArray = parseInput(document.getElementById('address').value);
  addressArray.forEach(function(element) {
    googleGeocoderCall += (element + "+");
  });
  // welcome to callback hell
  httpGetAsync(googleGeocoderCall, function(result) {
    if (checkPostalCodeExists(result)) {
      httpGetAsync(getApiAddress(result, buildTicketmasterRequest), function(result) {
        parseTicketmasterApiResponse(result).forEach(buildTicketmasterInfoWindow);
      });
      httpGetAsync(getApiAddress(result, buildEventbriteRequest), function(result) {
        JSON.parse(result).events.forEach(buildEventbriteInfoWindow);
      });
    }
    else {
      httpGetAsync(reverseGeocoderQueryAddress(result), function(result) {
        httpGetAsync(getApiAddress(result, buildTicketmasterRequest), function(result) {
          parseTicketmasterApiResponse(result).forEach(buildTicketmasterInfoWindow);
        });
        httpGetAsync(getApiAddress(result, buildEventbriteRequest), function(result) {
          JSON.parse(result).events.forEach(buildEventbriteInfoWindow);
        });
      });
    };
  })
});
button.addEventListener('click', clearText);
