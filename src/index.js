//@ts-check
// the link to your model provided by Teachable Machine export panel
const URL = '/resources/';

let model, webcam, labelContainer, webcamContainer, maxPredictions;
let stop = false;

// Load the image model and setup the webcam
async function init() {
	const modelURL = URL + 'model.json';
	const metadataURL = URL + 'metadata.json';

	// load the model and metadata
	// Refer to tmImage.loadFromFiles() in the API to support files from a file picker
	// or files from your local hard drive
	// Note: the pose library adds "tmImage" object to your window (window.tmImage)
	model = await tmImage.load(modelURL, metadataURL);
	maxPredictions = model.getTotalClasses();

	// Convenience function to setup a webcam
	const flip = true; // whether to flip the webcam
	webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
	await webcam.setup(); // request access to the webcam
	await webcam.play();
	window.requestAnimationFrame(loop);

	// append elements to the DOM
	webcamContainer = document.getElementById('webcam-container');
	webcamContainer.appendChild(webcam.canvas);
	labelContainer = document.getElementById('label-container');
	for (let i = 0; i < 2; i++) {
		// and class labels
		labelContainer.appendChild(document.createElement('div'));
	}

	window.canvas = webcam.canvas;
}

window.onload = init();

export async function loop() {
	if (!stop) {
		webcam.update(); // update the webcam frame
		window.requestAnimationFrame(loop);
	}
}

// run the webcam image through the image model
async function predict(data) {
	stop = true;
	replaceImage(data);
	// predict can take in an image, video or canvas html element
	let prediction = await model.predict(data);

	prediction = prediction.sort((prev, current) => {
		return prev.probability > current.probability ? -1 : (prev.probability < current.probability ? 1 : 0);
	});

	labelContainer.childNodes[0].innerHTML = `<div class="row"> <h4> ${
		prediction[0].className
	}</h4> <em>(${prediction[0].probability.toFixed(2) * 100}%)</em> </div>`;

	const tbody = [];
	for (let i = 1; i < maxPredictions; i++) {
		tbody.push(`
			<tr class="no-margin">
				<td class="no-margin">${prediction[i].className}</td>
				<td class="no-margin">${prediction[i].probability.toFixed(2) * 100}%</td>
			</tr>
		`);
	}

	const innerHTML = `
		<table class="table-responsive">
			<t-body>${tbody.join('')}</t-body>
		</table>
	`;

	labelContainer.childNodes[1].innerHTML = innerHTML;

	if ('speechSynthesis' in window) {
		const speech = new SpeechSynthesisUtterance(prediction[0].className);
		speech.lang = 'pt-BR';
		window.speechSynthesis.speak(speech);
	}

	document.getElementById('stop').style.visibility = 'visible';
	const startElements = document.getElementsByClassName('start');
	for (let index = 0; index < startElements.length; index++) {
		startElements[index].style.visibility = 'hidden';
	}
}

function replaceImage(data) {
	webcamContainer.removeChild(webcamContainer.childNodes[0]);
	webcamContainer.appendChild(data);
}

export async function continuar() {
	stop = false;
	replaceImage(webcam.canvas);
	await loop();
	labelContainer.childNodes.forEach(element => {
		element.innerHTML = '';
	});

	document.getElementById('stop').style.visibility = 'hidden';
	const startElements = document.getElementsByClassName('start');
	for (let i = 0; i < startElements.length; i++) {
		startElements[i].style.visibility = 'visible';
	}
}

function handleImageUpload(event) {
	const image = event.target.files[0];
	const reader = new FileReader();
	reader.onload = (function(file) {
		return function(e) {
			const image = new Image(200, 200);
			image.src = e.target.result;
			image.crossOrigin
			predict(image);
		};
	})(image);
	reader.readAsDataURL(image);
}

document.getElementById('image').addEventListener('change', handleImageUpload, false);

window.predict = predict;
window.continuar = continuar;
