const apiHost = 'http://localhost:3000';

const map = L.map('map').setView([39.95, -75.16], 13);

L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWp1bWJlLXRlc3QiLCJhIjoiY2wwb3BudmZ3MWdyMjNkbzM1c2NrMGQwbSJ9.2ATDPobUwpa7Ou5jsJOGYA', {
// L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  // attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
}).addTo(map);

let trailsLayer = null;
const loadTrails = function () {
  fetch('https://opendata.arcgis.com/datasets/48323d574068405bbf5336b9b5b29455_0.geojson')
    .then(resp => resp.json())
    .then(data => {
      trailsLayer = L.geoJSON(data, {
        style: {
          weight: 6,
        },
      });
      trailsLayer.addTo(map);
    });
};

let issuesLayer = null;
const loadIssues = function () {
  fetch(`${apiHost}/trail_issues/`)
    .then(resp => resp.json())
    .then(data => {
      issuesLayer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
          const icon = L.icon({
            iconUrl: `images/markers/${feature.properties.category}-marker.png`,
            iconSize: [35, 41],
            iconAnchor: [18, 41],
            shadowUrl: 'images/markers/marker-shadow.png',
            shadowSize: [35, 41],
            shadowAnchor: [13, 41],
          });
          return L.marker(latlng, { icon });
        },
      });
      issuesLayer.addTo(map);
    });
};

loadTrails();
loadIssues();
