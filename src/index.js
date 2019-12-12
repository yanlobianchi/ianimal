//@ts-check
// the link to your model provided by Teachable Machine export panel
const URL = '/resources/';

let model, webcam, labelContainer, webcamContainer, maxPredictions;
const width = 300,
	height = 300,
	flip = true;
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
	webcam = new tmImage.Webcam(width, height, flip); // width, height, flip
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
	webcam.update(); // update the webcam frame
	window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
async function predict(data) {
	// stop = true;
	// predict can take in an image, video or canvas html element
	let prediction = await model.predict(data);

	prediction = prediction.sort((prev, current) => {
		return prev.probability > current.probability ? -1 : prev.probability < current.probability ? 1 : 0;
	});

	const first = document.getElementById('first');
	first && first.remove();
	
	const div = document.createElement('div');
	div.id = 'first';
	div.classList.add('row');
	const element = document.createElement('div');
	element.classList.add('row');
	element.innerHTML = `<h4 class="centered-vertical" style="font-size: 14pt"> ${prediction[0].className}</h4> 
	<span class="centered-vertical centered-horizontal">(${prediction[0].probability.toFixed(2) * 100}%)</span>`;

	div.appendChild(createCanvas(data, false));
	div.appendChild(element);

	labelContainer.childNodes[0].appendChild(div);

	const tbody = [];
	for (let i = 1; i < maxPredictions; i++) {
		tbody.push(`
			<tr class="no-margin">
				<td class="no-margin">${prediction[i].className}</td>
				<td class="no-margin centered-horizontal">${prediction[i].probability.toFixed(2) * 100}%</td>
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

}

function createCanvas(data, flip = true) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	canvas.width = width / 2;
	canvas.height = height / 2;
	const cropped = cropTo(data, width/2, flip)
	ctx.drawImage(cropped, 0, 0, width / 2, height / 2);
	return canvas;
}

export function cropTo(image, size, flipped = false, canvas = document.createElement('canvas')) {
	// image image, bitmap, or canvas
	let width = image.width;
	let height = image.height;

	// if video element
	if (image instanceof HTMLVideoElement) {
		width = image.videoWidth;
		height = image.videoHeight;
	}

	const min = Math.min(width, height);
	const scale = size / min;
	const scaledW = Math.ceil(width * scale);
	const scaledH = Math.ceil(height * scale);
	const dx = scaledW - size;
	const dy = scaledH - size;
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext('2d');
	ctx.drawImage(image, ~~(dx / 2) * -1, ~~(dy / 2) * -1, scaledW, scaledH);

	// canvas is already sized and cropped to center correctly
	if (flipped) {
		ctx.scale(-1, 1);
		ctx.drawImage(canvas, size * -1, 0);
	}

	return canvas;
}

function handleImageUpload(event) {
	const image = event.target.files[0];
	const reader = new FileReader();
	reader.onload = (function(file) {
		return function(e) {
			const image = new Image(width, height);
			image.src = e.target.result;
			image.onload = function() {
				predict(createCanvas(image));
			}
		};
	})(image);
	reader.readAsDataURL(image);
}

document.getElementById('image').addEventListener('change', handleImageUpload, false);

window.predict = predict;
