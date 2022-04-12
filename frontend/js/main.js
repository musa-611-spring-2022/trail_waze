/* globals Papa */

const map = L.map('map').setView([39.95, -75.16], 16);

L.tileLayer('https://api.mapbox.com/styles/v1/mjumbe-test/cl0r2nu2q000s14q9vfkkdsfr/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWp1bWJlLXRlc3QiLCJhIjoiY2wwb3BudmZ3MWdyMjNkbzM1c2NrMGQwbSJ9.2ATDPobUwpa7Ou5jsJOGYA', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const precinctInput = document.querySelector('#precinct-filter');
const recencyInput = document.querySelector('#recency-filter');
const partySelect = document.querySelector('#party-filter');
const filteredCountSpan = document.querySelector('#filtered-count');
const filteredPrecinctSpan = document.querySelector('#filtered-precinct');
const neighborList = document.querySelector('.neighbors ul');

let neighborMarkers = {};
let neighborListItems = {};

const neighborMarkerGroup = L.layerGroup().addTo(map);
const mapboxApiToken = 'pk.eyJ1IjoibWp1bWJlLXRlc3QiLCJhIjoiY2wxMTRseWx0MTdibzNrcnR1ZWJ5bm82NCJ9.besymahDw7d4y5NxD38URQ';

const showNeighborMarker = function (marker) {
  neighborMarkerGroup.clearLayers();
  neighborMarkerGroup.addLayer(marker);
  const latlng = marker.getBounds()._southWest;
  map.panTo(latlng);
}

const handleNeighborListItemClick = function () {
  const neighborListItem = this;
  const voterID = neighborListItem.dataset.voterID;
  const address = neighborListItem.dataset.address;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${mapboxApiToken}`;

  if (voterID in neighborMarkers) {
    const marker = neighborMarkers[voterID];
    showNeighborMarker(marker);
  } else {
    fetch(url)
      .then(resp => resp.json())
      .then(geocoderData => {
        const feature = geocoderData.features[0];
        const marker = L.geoJSON(feature);
        showNeighborMarker(marker);
      });
  }
}

const initNeighborListItems = function (data) {
  neighborListItems = {};

  data.forEach(neighbor => {
    const voterID = neighbor['ID Number'];

    const firstName = neighbor['First Name'];
    const middleName = neighbor['Middle Name'];
    const lastName = neighbor['Last Name'];

    const houseNum = neighbor['House Number'];
    const streetName = neighbor['Street Name'];
    const city = 'Philadelphia';
    const state = 'PA';
    const zip = '19148';
    const address = `${houseNum} ${streetName}, ${city}, ${state} ${zip}`;

    const partyCode = neighbor['Party Code'];
    const party = politicalParties.find(p => p.code === partyCode);

    const lastVote = neighbor['Last Vote Date'];

    const neighborListItem = htmlToElement(`
      <li class="neighbor">
        <span class="name">${firstName} ${middleName} ${lastName}</span>
        <span class="address">${address}</span>
        <span class="party">${party ? party.name : '(unknown party)'}</span>
        <span class="last-vote-date"><time value="${lastVote}">${lastVote || '(unknown last vote date)'}</time></span>
      </li>
    `);
    neighborListItem.dataset.address = address;
    neighborListItem.dataset.voterID = voterID;
    neighborListItem.addEventListener('click', handleNeighborListItemClick);

    neighborListItems[voterID] = neighborListItem;
  });
}

const getNeighborListItem = function (voterID) {
  return neighborListItems[voterID];
}

const updateNeighborList = function(data) {
  neighborList.innerHTML = '';

  data.forEach(neighbor => {
    const neighborListItem = getNeighborListItem(neighbor['ID Number']);
    neighborList.appendChild(neighborListItem);
  });

  filteredCountSpan.innerHTML = data.length;
}

const filterNeighborsData = function(data) {
  const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;

  const recency = recencyInput.value;
  const party = partySelect.value;

  return data.filter(neighbor => {
    let lastVoteDate;

    if (neighbor['Last Vote Date']) {
      const voteDateComponents = datePattern.exec(neighbor['Last Vote Date']);
      const [, month, day, year] = voteDateComponents;
      lastVoteDate = `${year}-${month}-${day}`;
    }
    const neighborParty = neighbor['Party Code'];

    return (
      (!recency || lastVoteDate >= recency) &&
      (!party || neighborParty === party)
    );
  })
}

const showPrecinct = function (precinct) {
  fetch(`https://mjumbewu-musa_static_file_server.storage.googleapis.com/phila_voter_exports_20220307/precinct${precinct}.csv`)
    .then(resp => {
      if (resp.status === 404) {
        alert(`No precinct "${precinct}" is available.`)
        throw new Error(`No data file for precinct "${precinct}"`)
      }
      return resp
    })
    .then(resp => resp.text())
    .then(text => {
      const { data } = Papa.parse(text, { header: true });
      neighborsData = data;

      initNeighborListItems(neighborsData);
      filteredPrecinctSpan.innerHTML = precinct;
      neighborMarkerGroup.clearLayers();
      const filteredData = filterNeighborsData(neighborsData);
      updateNeighborList(filteredData);
    });
}

const initPoliticalPartyOptions = function () {
  for (const party of politicalParties) {
    const partyOption = htmlToElement(`<option value="${party.code}">${party.name}</option>`);
    partySelect.appendChild(partyOption);
  }
}

handlePrecinctFilterChange = function () {
  const precinct = precinctInput.value;
  showPrecinct(precinct);
}

handleRecencyFilterChange = function () {
  const filteredNeighbors = filterNeighborsData(neighborsData);
  updateNeighborList(filteredNeighbors);
}

handlePartyFilterChange = function () {
  const filteredNeighbors = filterNeighborsData(neighborsData);
  updateNeighborList(filteredNeighbors);
}

initPoliticalPartyOptions();
showPrecinct(3927);
precinctInput.addEventListener('change', handlePrecinctFilterChange);
recencyInput.addEventListener('change', handleRecencyFilterChange);
partySelect.addEventListener('change', handlePartyFilterChange);






///
