var HOST = "http://46.101.5.171"; // ask me for this in class
// var HOST = "http://46.101.5.171";
var URLS = {
    login: "/rest/tokenlogin/",
    userme: "/rest/userme/",
    updateposition: "/rest/updateposition/",
    findfriend: "/rest/findfriend/"
};

var map;

// var curIcon = L.ExtraMarkers.icon({
//     icon: 'fa-crosshairs',
//     iconColor: 'white',
//     markerColor: 'blue',
//     shape: 'square',
//     prefix: 'fa'
// });

function onLoad() {
    console.log("In onLoad.");
    document.addEventListener('deviceready', onDeviceReady, true);
}

function onDeviceReady() {
    console.log("In onDeviceReady.");

    $("#btn-login").on("touchstart", loginPressed);
    $("#sp-logout").on("touchstart", logoutPressed);

    if (localStorage.lastUserName && localStorage.lastUserPwd) {
        $("#in-username").val(localStorage.lastUserName);
        $("#in-password").val(localStorage.lastUserPwd);
    }

    $(document).on("pagecreate", "#map-page", function(event) {
        console.log("In pagecreate. Target is " + event.target.id + ".");

        $("#goto-currentlocation").on("touchstart", function() {
        	map.remove(map);
        	makeBasicMap();
            getCurrentlocation();
        });

        $("#find").on("touchstart", function() {
            findFriend();
        });

        $("#map-page").enhanceWithin();

        makeBasicMap();
        getCurrentlocation();
    });

    $(document).on("pageshow", function(event) {
        console.log("In pageshow. Target is " + event.target.id + ".");
        if (!localStorage.authtoken) {
            $.mobile.navigate("#login-page");
        }
        setUserName();
    });

    $(document).on("pageshow", "#map-page", function() {
        console.log("In pageshow / #map-page.");
        map.invalidateSize();
    });

    $('div[data-role="page"]').page();

    console.log("TOKEN: " + localStorage.authtoken);
    if (localStorage.authtoken) {
        $.mobile.navigate("#map-page");
    } else {
        $.mobile.navigate("#login-page");
    }
}

function loginPressed() {
    console.log("In loginPressed.");
    $.ajax({
        type: "GET",
        url: HOST + URLS["login"],
        data: {
            username: $("#in-username").val(),
            password: $("#in-password").val()
        }
    }).success(function(data, status, xhr) {
        localStorage.authtoken = localStorage.authtoken = "Token " + xhr.responseJSON.token;
        localStorage.lastUserName = $("#in-username").val();
        localStorage.lastUserPwd = $("#in-password").val();

        $.mobile.navigate("#map-page");
    }).fail(function(xhr, status, error) {
        var message = "Login Failed\n";
        if ((!xhr.status) && (!navigator.onLine)) {
            message += "Bad Internet Connection\n";
        }
        message += "Status: " + xhr.status + " " + xhr.responseText;
        showOkAlert(message);
        logoutPressed();
    });
}

function logoutPressed() {
    console.log("In logoutPressed.");
    localStorage.removeItem("authtoken");
    $.mobile.navigate("#login-page");
    // $.ajax({
    //     type: "GET",
    //     headers: {"Authorization": localStorage.authtoken}
    //     // url: HOST + URLS["logout"]
    // }).always(function () {
    //     localStorage.removeItem("authtoken");
    //     $.mobile.navigate("#login-page");
    // });
}

function showOkAlert(message) {
    navigator.notification.alert(message, null, "WMAP 2017", "OK");
}

function findFriend() {
    console.log('in find');
    getCurrentlocation();
    $.ajax({
        type: "GET",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": localStorage.authtoken
        },
        url: HOST + URLS["findfriend"],
        success: function(data) {
        	map.remove(map);
        	makeBasicMap();
        	getCurrentlocation();
            displayFriend(data.features);
        }
    }).always(function() {
        $.mobile.navigate("#map-page");
    });

}

function displayFriend(data) {
    var pos;
    console.log(data[1]);
    for (var i = 0; i < data.length; i++) {
        pos = L.latLng(data[i].geometry.coordinates[1], data[i].geometry.coordinates[0]);
        console.log(data[i]);
        L.marker(pos).addTo(map)
            .bindPopup(data[i].properties.username)
            .openPopup();
    }
}

function getCurrentlocation() {
    console.log("In getCurrentlocation.");
    var myLatLon;
    var myPos;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
    }


    function showPosition(position) {
        console.log('shizhao testing1');
        myPos = [{
            "type": "Point",
            "coordinates": [position.coords.latitude, position.coords.longitude]
        }];
        console.log(myPos);
        localStorage.lastKnownCurrentPosition = JSON.stringify(myPos);
        setMapToCurrentLocation();
        updatePosition();
    }


    // navigator.geolocation.getCurrentPosition(
    //     function (pos) {
    //         // myLatLon = L.latLng(pos.coords.latitude, pos.coords.longitude);
    //         myPos = new myGeoPosition(pos);
    //         console.log('check this'+ myPos);
    //         localStorage.lastKnownCurrentPosition = JSON.stringify(myPos);

    //         setMapToCurrentLocation();
    //         updatePosition();
    //     },
    //     function (err) {
    //     },
    //     {
    //         enableHighAccuracy: true
    //         // maximumAge: 60000,
    //         // timeout: 5000
    //     }
    // );
}

function setMapToCurrentLocation() {
    console.log("In setMapToCurrentLocation.");
    if (localStorage.lastKnownCurrentPosition) {
        var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);
        console.log(myPos[0].coordinates[0]);
        var myLatLon = L.latLng(myPos[0].coordinates[0], myPos[0].coordinates[1]);
        // L.marker(myLatLon, {icon: curIcon}).addTo(map);
        L.marker(myLatLon).addTo(map)
            .bindPopup('you are here')
            .openPopup();
        map.flyTo(myLatLon, 15);
    }
}

function updatePosition() {
    console.log("In updatePosition.");
    if (localStorage.lastKnownCurrentPosition) {
        var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);
        $.ajax({
            type: "PATCH",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": localStorage.authtoken
            },
            url: HOST + URLS["updateposition"],
            data: {
                lat: myPos[0].coordinates[0],
                lon: myPos[0].coordinates[1]
            }
        }).done(function(data, status, xhr) {
            showOkAlert("Position Updated");
        }).fail(function(xhr, status, error) {
            var message = "Position Update Failed\n";
            if ((!xhr.status) && (!navigator.onLine)) {
                message += "Bad Internet Connection\n";
            }
            message += "Status: " + xhr.status + " " + xhr.responseText;
            showOkAlert(message);
        }).always(function() {
            $.mobile.navigate("#map-page");
        });
    }
}

function makeBasicMap() {
    console.log("In makeBasicMap.");
    map = L.map("map-var", {
        zoomControl: false,
        attributionControl: false
    }).fitWorld();
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        useCache: true
    }).addTo(map);

    $("#leaflet-copyright").html("Leaflet | Map Tiles &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors");
}

function myGeoPosition(p) {
    this.coords = {};
    this.coords.latitude = p.coords.latitude;
    this.coords.longitude = p.coords.longitude;
    this.coords.accuracy = (p.coords.accuracy) ? p.coords.accuracy : 0;
    this.timestamp = (p.timestamp) ? p.timestamp : new Date().getTime();
}

function setUserName() {
    console.log("In setUserName.");
    $.ajax({
        type: "GET",
        headers: { "Authorization": localStorage.authtoken },
        url: HOST + URLS["userme"]
    }).done(function(data, status, xhr) {
        $(".sp-username").html(xhr.responseJSON.properties.username);
    }).fail(function(xhr, status, error) {
        $(".sp-username").html("");
    });
}
