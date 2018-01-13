function Spinner(div, src, frames) {
	this.div = div;
	this.src = src || div.dataset.src;
	this.frameCount = frames || div.dataset.frames || 36;

	this.canvas = document.createElement("canvas");
	div.appendChild(this.canvas);

	this.degrees = 0;
	this.rotation = 0;

	var self = this;

	this.image = new Image();
	this.image.onload = function () {
		self.frameHeight = Math.round(this.naturalHeight / self.frameCount);

		self.canvas.width = this.naturalWidth;
		self.canvas.height = self.frameHeight;
		self.div.style.height = self.frameHeight + "px";

		self.setFrame(0);
	}
	this.image.onerror = function () {
		var swfSrc = src.replace(/\.jpg$/, ".swf"); // looking for a .swf (the showSpin func replaces .swf with .jpg)
		self.div.classList.remove("spin-360-deg"); // the transaprent ::before blocks the flash from spinning
		self.div.innerHTML = '<embed type="application/x-shockwave-flash" ' +
		                     'src="' + swfSrc + '" ' +
		                     'width="400" height="450" quality="high" wmode="opaque">';
		self.image = null;
	}
	this.image.src = this.src;
	window.addEventListener("load", function () { self.animateSpin() });

	this.dragging = false;
	this.lastPosition = [0, 0];
	
	this.div.onmousedown = function (event) {
		self.lastPosition = {x: event.screenX, y: event.screenY};
		self.dragging = true;
	}
	this.div.ontouchstart = function (event) {
		self.lastPosition = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
		self.dragging = true;
	}
	this.div.onmousemove = function (event) { self.mouseMove(event); }
	this.div.ontouchmove = function (event) { self.mouseMove(event, true); }
	this.div.onmouseup = function (event) { self.stopDragging(); };
	this.div.onmouseleave = function (event) { self.stopDragging(); };
	this.div.ontouchend = function (event) { self.stopDragging(); };
	this.div.ontouchcancel = function (event) { self.stopDragging(); };

	this.div.ondragstart = function () { return false; } // for reals, IE, no dragging!

	this.div.ondblclick = function () { self.animateSpin(); }
}

Spinner.prototype.mouseMove = function (event, tap) {
	if (!this.dragging) return;

	this.stopSpinAnimation();
	
	if (event.changedTouches) {
		if (event.changedTouches.length > 1) return; // multi-touch gesture, probably zoom

		var diffX = this.lastPosition.x - event.changedTouches[0].screenX;
		var diffY = this.lastPosition.y - event.changedTouches[0].screenY;
		var angle = Math.abs(Math.atan2(diffX, diffY));
		if (angle > 0.3 && angle < 2.7) {  
			// reduce scrolling when swiping sideways

			event.preventDefault();
			event.stopPropagation();
		}

		this.rotation = diffX;
		this.lastPosition = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
	} else {
		this.rotation = this.lastPosition.x - event.screenX;
		this.lastPosition = {x: event.screenX, y: event.screenY};
	}
 
	this.rotateBy(this.rotation);
}

Spinner.prototype.stopDragging = function () {
	this.dragging = false;
	var self = this;

	function animateInertia() {
		// user rotating again, stop animating
		if (self.dragging) return;

		self.rotation *= 0.95;
		self.rotateBy(self.rotation);

		// animate until rotation gets low enough
		if (Math.abs(self.rotation) > 1) {
			requestAnimationFrame(animateInertia);
		}
	}
	animateInertia();
}

Spinner.prototype.rotateBy = function (angle) {
	this.degrees = Math.round(360 + this.degrees + angle) % 360;
	var frame = Math.round((this.degrees / 360.0) * this.frameCount);
	this.setFrame(frame);
}
Spinner.prototype.setFrame = function (frame) {
	frame = Math.round(frame) % this.frameCount;
	this.oldFrame = this.frame;
	this.frame = frame;
	this.draw();
}
Spinner.prototype.draw = function () {
	if (!this.image) return; // image failed to load

	var self = this;

	function rafDraw() {
		var context = self.canvas.getContext("2d");

		// draw image
		context.drawImage(
		    self.image,                                        // image
			0, self.frameHeight * self.frame,                  // position in source image  
			self.image.naturalWidth, self.frameHeight,         // width, height in source image
			0, 0,                                              // position on canvas
			self.image.naturalWidth, self.frameHeight          // width, height on canvas
		);
	}
	requestAnimationFrame(rafDraw);
}

Spinner.prototype.animateSpin = function () {
	var self = this;
	var frameCount = this.frameCount;
	var animate = function () {
		if (frameCount-- == 0) return;

		self.setFrame(self.frame + 1);

		self.animateTimeout = setTimeout(animate, 33); // 30 fps
	}

	animate();
}
Spinner.prototype.stopSpinAnimation = function () {
	// this.degrees = 360 * (this.frame / this.frameCount);
	clearTimeout(this.animateTimeout);
}


function showSpin(file, frames) {
	frames = frames || 36; // 36 frames by default
	file = file.replace(".swf", ".jpg");
	
	document.write('<div class="spin-360-deg" draggable="false"></div>');
	new Spinner(document.querySelector(".spin-360-deg"), file, frames);
}
