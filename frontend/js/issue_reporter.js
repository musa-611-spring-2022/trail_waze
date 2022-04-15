/* global apiHost, map, trailsLayer, issuesLayer */

const reportIssueToggleEl = document.querySelector('.report-issue-btn');
const reportIssueBtn = document.querySelector('.report-issue-btn button');
const closeIssueFormBtns = document.querySelectorAll('.close-issue-form');
const issueReportFormEl = document.querySelector('.issue-report-form');
const issueReportStepEls = document.querySelectorAll('.issue-report-step');
const selectTrailStepEl = document.querySelector('.step-select-trail');
const selectTrailContinueBtn = document.querySelector('.step-select-trail button');
const selectPointStepEl = document.querySelector('.step-select-point');
const selectPointContinueBtn = document.querySelector('.step-select-point button');
const detailsStepEl = document.querySelector('.step-give-details');
const submitIssueBtn = document.querySelector('.step-give-details button');
const issueCategorySelect = document.querySelector('#issue-category');
const issueDatetime = document.querySelector('#issue-datetime');
const issueDetailText = document.querySelector('#issue-details');


const maintainMapCenter = function (wrapped) {
  return function () {
    const mapCenter = map.getCenter();
    const result = wrapped.apply(this, arguments);

    // After the issue report form is shown, the map may resize and wherever was
    // centered may not be anymore; so re-center the map.
    map.invalidateSize();
    map.panTo(mapCenter);

    return result;
  };
};


const openIssueReporterForm = function () {
  console.log('Opening the issue reporter form.');

  // Adding a "hidden" class hides an element from the UI (see styles.js for the
  // definition of the `.hidden` selector).
  reportIssueToggleEl.classList.add('hidden');
  issueReportFormEl.classList.remove('hidden');
};


const closeIssueReporter = function () {
  console.log('Closing the issue reporter form.');
  hideAllIssueReportSteps();
  reportIssueToggleEl.classList.remove('hidden');
  issueReportFormEl.classList.add('hidden');
};


const hideAllIssueReportSteps = function () {
  for (const stepEl of issueReportStepEls) {
    stepEl.classList.add('hidden');
  }

  trailsLayer.eachLayer(layer => {
    layer.removeEventListener('click', handleTrailLayerSelection);
  });

  map.removeEventListener('click', handleIssuePointSelection);

  trailsLayer.resetStyle();
  if (issueReportMarker) { map.removeLayer(issueReportMarker); }
};


// STEP 1 - SELECT A TRAIL LAYER

let issueReportSelectedLayer = null;
const unselectedStyle = {
  stroke: true,
  color: 'gray',
  opacity: 0.5,
  weight: 6,
  dashArray: 6,
}

const selectedStyle = {
  stroke: true,
  color: 'yellow',
  opacity: 0.5,
  weight: 6,
}

const handleTrailLayerSelection = function (evt) {
  issueReportSelectedLayer = evt.target;
  trailsLayer.eachLayer(layer => {
    layer.setStyle(unselectedStyle)
  });
  issueReportSelectedLayer.setStyle(selectedStyle);
  selectTrailContinueBtn.disabled = false;
};


const showSelectTrailStep = function () {
  console.log('Showing the select-trail step of issue submission.');
  hideAllIssueReportSteps();
  trailsLayer.eachLayer(layer => {
    layer.setStyle(unselectedStyle)
    layer.addEventListener('click', handleTrailLayerSelection);
  });
  selectTrailStepEl.classList.remove('hidden');
};


// STEP 2 - SELECT A POINT ALONG THE TRAIL

let issueReportMarker = null;

const handleIssuePointSelection = function (evt) {
  if (issueReportMarker) { map.removeLayer(issueReportMarker); }

  const snappedPoint = turf.nearestPointOnLine(
    issueReportSelectedLayer.feature,
    turf.point([evt.latlng.lng, evt.latlng.lat]),
  );

  issueReportMarker = L.marker([
    snappedPoint.geometry.coordinates[1],
    snappedPoint.geometry.coordinates[0],
  ]);
  map.addLayer(issueReportMarker);

  selectPointContinueBtn.disabled = false;
};


const showSelectPointStep = function () {
  console.log('Showing the select-point step of issue submission.');
  hideAllIssueReportSteps();
  map.addEventListener('click', handleIssuePointSelection);
  issueReportSelectedLayer.setStyle(selectedStyle);
  selectPointStepEl.classList.remove('hidden');
};


// STEP 3 - ENTER ISSUE DETAILS

const showDetailsStep = function () {
  console.log('Showing the details step of issue submission.');
  hideAllIssueReportSteps();
  issueReportSelectedLayer.setStyle(selectedStyle);
  map.addLayer(issueReportMarker);
  detailsStepEl.classList.remove('hidden');
};


const submitIssueData = function () {
  console.log('Submitting the issue data.');
  const trailFeature = issueReportSelectedLayer.feature;
  const issueLatLng = issueReportMarker.getLatLng();

  const issueData = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [issueLatLng.lng, issueLatLng.lat],
    },
    properties: {
      category: issueCategorySelect.value,
      encountered_at: (new Date(issueDatetime.value)).toISOString(),
      details: issueDetailText.value,
      trail_id: trailFeature.properties.OBJECTID,
      trail_label: trailFeature.properties.LABEL,
    },
  };

  fetch(`${apiHost}/trail_issues/`, {
    method: 'post',
    body: JSON.stringify(issueData),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(resp => resp.json())
    .then(data => {
      console.log('Received the following response:');
      console.log(data);
      issuesLayer.addData(data);
    });
};


const resetIssueReportForm = function () {
  trailsLayer.resetStyle();
  issueReportSelectedLayer = null;

  if (issueReportMarker) { map.removeLayer(issueReportMarker); }
  issueReportMarker = null;

  selectTrailContinueBtn.disabled = true;
  selectPointContinueBtn.disabled = true;
};


const handleReportIssueBtnClick = maintainMapCenter(() => {
  resetIssueReportForm();
  showSelectTrailStep();
  openIssueReporterForm();
});


const handleSelectTrailContinueBtnClick = maintainMapCenter(() => {
  showSelectPointStep();
});


const handleSelectPointContinueBtnClick = maintainMapCenter(() => {
  showDetailsStep();
});


const handleIssueSubmitBtnClick = maintainMapCenter(() => {
  submitIssueData();
  resetIssueReportForm();
  closeIssueReporter();
});

const handleCloseIssueFormBtnClick = maintainMapCenter(() => {
  const confirmation = confirm('You really want to cancel this issue?');
  if (confirmation) {
    resetIssueReportForm();
    closeIssueReporter();
  }
});


reportIssueBtn.addEventListener('click', handleReportIssueBtnClick);
selectTrailContinueBtn.addEventListener('click', handleSelectTrailContinueBtnClick);
selectPointContinueBtn.addEventListener('click', handleSelectPointContinueBtnClick);
submitIssueBtn.addEventListener('click', handleIssueSubmitBtnClick);

for (const btn of closeIssueFormBtns) {
  btn.addEventListener('click', handleCloseIssueFormBtnClick);
}
