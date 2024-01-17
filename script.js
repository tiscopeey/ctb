const url = "https://rt.data.gov.hk/v2/transport/citybus/route/ctb";
const xhttpr = new XMLHttpRequest();
xhttpr.open("GET", url, true);

xhttpr.send();

xhttpr.onload = ()=> {
	if (xhttpr.status == 200){
		const response = JSON.parse(xhttpr.response);
		const list = response["data"];
		let x = "<tr><td style='width:14%;'><strong>路線</strong></td><td style='width:43%;'><strong>起點</strong></td><td style='width:43%;'><strong>終點</strong></td></tr>";
		
		list.sort(function(a, b) {
			var routeA = String(a["route"]);
			var routeB = String(b["route"]);

			var numA = parseInt(routeA, 10);
			var numB = parseInt(routeB, 10);
			var alphaA = routeA.replace(numA, "");
			var alphaB = routeB.replace(numB, "");

			if (numA < numB) {
				return -1;
			} else if (numA > numB) {
				return 1;
			}

			if (alphaA < alphaB) {
				return -1;
			} else if (alphaA > alphaB) {
				return 1;
			}

			return 0;
		});

		for (let i = 0;i < list.length; i++){
			x = x + "<tr><td>" + list[i]["route"] + "</td><td><input class='btnOrigin' type='button' value='往： " + list[i]["orig_tc"] + "' onclick=\"routeStop('" + list[i]["route"] + "', 'inbound')\"></td>";
			x = x + "<td><input class='btnOrigin' type='button' value='往： " + list[i]["dest_tc"] + "' onclick=\"routeStop('" + list[i]["route"] + "', 'outbound')\"></td></tr>";
		}
		
		document.getElementById("listTable").innerHTML = x;
		document.getElementById("routeList").style.display = "block";

		document.getElementById("waiting").style.display = "none";
	} else {
		//idk do sth
	}
}


function hptoHome(){
	window.location.reload();
}

// find all stops of a route given the route and direction
function routeStop(route, direction){
	document.getElementById("routeList").style.display = "none";
	document.getElementById("routeSearch").style.display = "none";
	document.getElementById("routeSearch").value = "";
	document.getElementById("loading").style.display = "block";
	
	const url = "https://rt.data.gov.hk/v2/transport/citybus/route-stop/ctb/" + route + "/" + direction;
	const xhttpr = new XMLHttpRequest();
	xhttpr.open("GET", url, true);

	xhttpr.send();
	
	const stationNameList = [];
	let info = "";

	xhttpr.onload = ()=> {
		if (xhttpr.status == 200){
			const response = JSON.parse(xhttpr.response);
			const stationList = response["data"];
			for (let i = 0; i < stationList.length; i++){
				stopInfo(stationList[i]["stop"], function(data){
					stationNameList.push({number: (i + 1), name: data["name_tc"], id: data["stop"]});
					if (stationNameList.length == stationList.length){
						finishRouteStop(stationNameList, route, direction);
					}
				});
			}
			if (stationList.length == 0){
				let oppositeDirection;
				if (direction == "inbound"){
					oppositeDirection = "outbound";
				} else {
					oppositeDirection = "inbound";
				}
				let x = "<tr><td><strong>此路線沒有此方向</strong></td></tr><tr><td><input class='btnOrigin' type='button' value='按此搜尋相反方向' onclick=\"routeStop('" + route + "', '" + oppositeDirection + "')\"</td></tr>";
				document.getElementById("listTable").innerHTML = x;
				document.getElementById("routeList").style.display = "block";
				document.getElementById("loading").style.display = "none";
				document.getElementById("routeNumber").innerHTML = "路線： " + route;
			}
		}
    }
}

function finishRouteStop(stationNameList, route, direction){
	let x = "<tr><td><strong></strong></td><td><strong>巴士站</strong></td><td><strong>到站時間</strong></td></tr>";
	stationNameList.sort(function(a, b) {
		var routeA = String(a["number"]);
		var routeB = String(b["number"]);

		var numA = parseInt(routeA, 10);
		var numB = parseInt(routeB, 10);
		var alphaA = routeA.replace(numA, "");
		var alphaB = routeB.replace(numB, "");

		if (numA < numB) {
			return -1;
		} else if (numA > numB) {
			return 1;
		}

		if (alphaA < alphaB) {
			return -1;
		} else if (alphaA > alphaB) {
			return 1;
		}

		return 0;
	});

	for (let i = 0; i < stationNameList.length; i++){
		x = x + "<tr><td>" + stationNameList[i]["number"] + "</td><td>" + stationNameList[i]["name"] + "</td><td><input type='button' class='btnEta' value='到站時間' onclick=\"routeStopEta('" + stationNameList[i]["id"] + "', '" + route + "', '" + direction + "', '" + stationNameList[i]["name"] + "')\"></td></tr>";
	}

	document.getElementById("listTable").innerHTML = x;
	document.getElementById("routeList").style.display = "block";
	document.getElementById("loading").style.display = "none";
	document.getElementById("routeNumber").innerHTML = "路線： " + route;
}

// returns the data of a stop when given a stop-id
function stopInfo(stopId, callback){
	const url = "https://rt.data.gov.hk/v2/transport/citybus/stop/" + stopId;
	const xhttpr = new XMLHttpRequest();
	xhttpr.open("GET", url, true);

	xhttpr.onload = function() {
		if (xhttpr.status === 200) {
			const response = JSON.parse(xhttpr.responseText);
			callback(response["data"]);
		}
	};

	xhttpr.send();
}

//figure out the eta given a stop-id and a route
function routeStopEta (stopId, route, direction, stopName){
	document.getElementById("routeList").style.display = "none";
	document.getElementById("loading").style.display = "block";
	document.getElementById("stationList").style.display = "none";
	let dir, oppositeDirection;
	console.log(stopId, route, direction);
	
	if (direction == "inbound"){
		dir = "I";
		oppositeDirection = "outbound";
	} else {
		dir = "O";
		oppositeDirection = "inbound";
	}
	
	const url = "https://rt.data.gov.hk/v2/transport/citybus/eta/ctb/" + stopId + "/" + route;
	const xhttpr = new XMLHttpRequest();
	xhttpr.open("GET", url, true);
	
	let x = "<tr><td><strong></strong></td><td><strong>目的地</strong></td><td><strong>到站時間</strong></td></tr>";
	let etaTime;

	xhttpr.send();

	xhttpr.onload = ()=> {
		if (xhttpr.status == 200){
			const response = JSON.parse(xhttpr.response);
			const departureList = response["data"];
			let sequence = 0;
			for (let i = 0; i < departureList.length; i++){
				if (departureList[i]["dir"] == dir){
					if (departureList[i]["eta"] == ""){
						etaTime = departureList[i]["rmk_tc"] + "（沒有資料）";
					} else {
						etaTime = new Date(departureList[i]["eta"]);
						etaTime = etaTime.toLocaleTimeString('en-HK', {hourCycle: 'h23'});
					}
					sequence++;
					x = x + "<tr><td>" + sequence + "</td><td>" + departureList[i]["dest_tc"] + "</td><td>" + etaTime + "</td></tr>";
				}
			}
			if (x == "<tr><td><strong></strong></td><td><strong>目的地</strong></td><td><strong>到站時間</strong></td></tr>"){
				x = "<tr><td><strong>未來60分鐘沒有由此站開出的班次</strong></td><td><input type='button' class='btnEta' value='循環線請按此' onclick=\"routeStopEta('" + stopId + "', '" + route + "', '" + oppositeDirection + "', '" + stopName + "')\" ></td><tr>";
			}
			document.getElementById("stationTable").innerHTML = x;
			document.getElementById("stationList").style.display = "block";
			document.getElementById("loading").style.display = "none";
			document.getElementById("stopName").innerHTML = "巴士站： " + stopName;
		}
    }
}

function searchRoute(){
	let input, filter, table, tr, td, i, txtValue;
	input = document.getElementById("routeSearch");
	filter = input.value.toUpperCase();
	table = document.getElementById("listTable");
	tr = table.getElementsByTagName("tr");
	for (i = 1; i < tr.length; i++) {
		td = tr[i].getElementsByTagName("td")[0];
		if (td) {
		  txtValue = td.textContent || td.innerText;
		  if (txtValue.toUpperCase().indexOf(filter) == 0) {
			  tr[i].style.display = "";
		  } else {
			  tr[i].style.display = "none";
		  }
		}       
	}
}


function showPosition(position) {
var lat = position.coords.latitude;
var long = position.coords.longitude;
var location = [lat, long];
google.script.run.logLocation(location);
}

function showError(error) {
switch(error.code) {
  case error.PERMISSION_DENIED:
	var location = ["User denied the request for Geolocation."];
	//alert(location[0]);
	google.script.run.logLocation(location);
	break;
  case error.POSITION_UNAVAILABLE:
	var location = ["Location information is unavailable."];
	//alert(location[0]);
	google.script.run.logLocation(location);
	break;
  case error.TIMEOUT:
	var location = ["The request to get user location timed out."];
	//alert(location[0]);
	google.script.run.logLocation(location);
	break;
  case error.UNKNOWN_ERROR:
	var location = ["An unknown error occurred."];
	//alert(location[0]);
	google.script.run.logLocation(location);
	break;
}
}

