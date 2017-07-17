import BrowserDetect from './Browser'

export default class ImageSwapperify {
	constructor( options ) {
		this.trackHeight = options.trackHeight
        this.images = {
			totalImages:options.totalImages,
			currentImages:[],
			hiResDesktop:[],
			loResMobile:[],
			hiResMobile:[]
		}
		this.events()

		this.rootImgPath = $('footer').data('root');
		this.currentFrame = 0;
		this.canvas = document.getElementById('canvas')
		this.ctx = this.canvas.getContext('2d')
		this.percentageLoaded = 0
		this.frameSpacing = (this.trackHeight - window.innerHeight) / this.images.totalImages
	}

	loadImages() {
		let loadedImages = 0
		let imgSrc
		let imgNum
		for (var i = 1; i <= this.images.totalImages; i++) {
			imgNum = this.pad(i, 5)
			if (!BrowserDetect.mobileos) {
				imgSrc = this.rootImgPath + '/img/g_win_frames/1600x960_20s/ID__Desktop_20__' + imgNum + '.jpg'
			}
			else {
				imgSrc = this.rootImgPath + '/img/g_win_frames/458x667_20q/ID_Mobile_20__' + imgNum + '.jpg'
			}

			let image = new Image()
			this.images.currentImages.push(image)
			image.src = imgSrc;

			image.onload = () => {
				loadedImages++
				this.percentageLoaded = (( loadedImages/this.images.totalImages ) * 100 << 0);
				document.dispatchEvent(this.loadProgress)

				if (loadedImages >= this.images.totalImages) {
					//console.log('all images loaded')
					// remove initial loader
					this.handleResize()
					document.removeEventListener(this.loadProgress, null, false)
					document.dispatchEvent(this.loadComplete)
				}
			}
		}
	}

	events() {
		this.loadProgress = new Event('loadProgress')
		this.loadComplete = new Event('loadComplete')
		window.addEventListener('resize', this.handleResize.bind(this) )
	}

	changeFrame() {
		this.currentFrame = Math.floor( (window.pageYOffset - window.innerHeight ) / this.frameSpacing ) + 1

		if (this.currentFrame > this.images.totalImages) {
			this.currentFrame = this.images.totalImages
		}

		this.drawCanvas()
	}

	pad(num, size) {
	    var s = num + "";
	    while (s.length < size) s = "0" + s;
	    return s;
	}

	drawCanvas() {
		let iw
		let ih
		if (window.innerWidth > 500) {
			iw = 1600
			ih = 960
		}
		else {
			iw = 458
			ih = 667
		}
		let w = window.innerWidth
		let h = window.innerHeight

	    let r = Math.min(w / iw, h / ih)
	    let nw = iw * r   /// new prop. width
	    let nh = ih * r   /// new prop. height
	    let cx, cy, cw, ch, ar = 1

		if (nw < w) ar = w / nw;
		if (nh < h) ar = h / nh;
		nw *= ar;
		nh *= ar;

		// calc source rectangle
		cw = iw / (nw / w);
		ch = ih / (nh / h);

		cx = (iw - cw) * .5;
		cy = (ih - ch) * .5;

		// make sure source rectangle is valid
		if (cx < 0) cx = 0;
		if (cy < 0) cy = 0;
		if (cw > iw) cw = iw;
		if (ch > ih) ch = ih;

		this.ctx.drawImage(this.images.currentImages[this.currentFrame], cx, cy, cw, ch, 0, 0, w, h)
	}

	getCurrentFrame() {
		return this.currentFrame
	}

	swapToHiResImages() {
		let indices = [this.currentFrame, this.currentFrame + 1, this.currentFrame - 1]
		// load in some hi-res images
		let imgNum
		indices.forEach( (index) => {
			// Ternary used for temporary images until naming conventions match
			imgNum = index
			if (imgNum > this.images.totalImages ) imgNum = this.images.totalImages
			if (imgNum < 1 ) imgNum = 1
			// don't load a -1 index or > currentImages.length index
			if (imgNum >= 1 && imgNum <= this.images.totalImages ) {
				let image = new Image()
				imgNum = this.pad(index, 5)
				if (BrowserDetect.mobileos) {
					image.src  = this.rootImgPath + '/img/g_win_frames/458x667_100q/ID_Mobile_60__' + imgNum + '.jpg'
				}
				else {
					image.src = this.rootImgPath + '/img/g_win_frames/1600x960_100s/ID_Desktop_100__' + imgNum + '.jpg'
				}


				image.setAttribute('index', index)
				image.onload = () => {
					// swap out hi res images for current frame plus the ones directly before and after.  Redraw canvas, but only if it is the current frame image
					let thisIndex = image.getAttribute('index') - 1
					this.images.currentImages[thisIndex] = image

					if (thisIndex == this.currentFrame && this.currentFrame < this.images.totalImages ) {

						this.drawCanvas()
					}
				}
			}
		})
	}

	handleResize() {
		this.canvas.width = window.innerWidth
		this.canvas.height = window.innerHeight
		this.drawCanvas()
	}
}
