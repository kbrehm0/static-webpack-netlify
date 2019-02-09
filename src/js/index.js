// @todo: refactor to use html-loader with multiple entry points / hbs
// https://stackoverflow.com/questions/32155154/webpack-config-how-to-just-copy-the-index-html-to-the-dist-folder
// require('file-loader?name=[name].[ext]!../index.html');

import TweenMax from "greensock";
import verge from "verge";
import Glide from '@glidejs/glide'

// import 'intersection-observer'
// import scrollama from 'scrollama';

import fullpage from "fullpage.js"
import '../scss/app.scss';

import lodash from 'lodash';

// app utils
// import transformToCamelCase from './utils/transformToCamelCase';

// app data
import introDataObjAsBEM from '../../content/intro.json';
import bioDataObjAsBEM from '../../content/bio.json';
import artProjectsDataObjAsBEM from '../../content/art-projects.json';

var partials = {};

// @todo: move this to dedicated webpack. JS files.
import paragraphFragmentsTemplate from '../templates/home/sections/intro/paragraph-fragments.hbs';
import hoverImagesCollectionTemplate from '../templates/home/sections/intro/hover-image-collection.hbs';
import headshotCollectionTemplate from '../templates/home/sections/bio/headshot-collection.hbs';
import artProjectsCollectionTemplate from '../templates/home/sections/art-projects/art-projects-images-collection.hbs';

// @todo: make submodule to import all partials/helpers
// https://stackoverflow.com/questions/32124640/how-to-import-into-properties-using-es6-module-syntax-destructing
// partials
import arrowPartial from '../templates/partials/arrow.hbs';


(function () {

	// workaround for fullpage history bug. Add #intro only if page loads without a deep link
	// https://github.com/alvarotrigo/fullPage.js/issues/950#issuecomment-69156110
	// https://stackoverflow.com/questions/24078332/is-it-secure-to-use-window-location-href-directly-without-validation/24089350
	if (!window.location.href.includes("#")) {
		window.location.href = window.location.href + "#intro";
	}

	window.timelines = {};

	var projectCarouselOptions = {
		// bpoints should match _mq.scss
		// 1280 +
		type: 'slider',
		gap: 32,
		perView: 3,
		focusAt: 'center',
		animationDuration: 250,
		peek: { before: 100, after: 100 },
		dragThreshold: 1,
		perTouch: 2,
		rewind: false,
		breakpoints: { 

			// 1031 to 1200
			1200: {
				perView: 3,
				gap: 32,
				peek: { before: 32, after: 32 },
				dragThreshold: 1
			},

			// 861 to 1030
			1030: {
				perView: 2,
				gap: 32,
				peek: { before: 50, after: 50 },
				dragThreshold: 1,
				swipeThreshold: 1
			},

			// 651 to 860 
			860: {
				perView: 1,
				gap: 16,
				peek: { before: 50, after: 50 },
				dragThreshold: true,
				dragThreshold: 1,
				swipeThreshold: 1
			},

			// up to 650 
			650: {
				perView: 1,
				gap: 0,
				peek: 0,
				dragThreshold: true,
				dragThreshold: 1,
				swipeThreshold: 1
			}
		}
	};

	var glideArt;
	var glideArt2;

	// var $headerOne              = $('.h1__1');
	var $headshotMaskBox        = $('.headshot__mask--box');
	// var $headshotMaskColor      = $('.headshot__mask--color');
	var $bioTextMask            = $('.bio__text--mask');
	var $bioText                = $('.bio__text');
	var $headshotImage          = $('.headshot__image');
	var $bioNavBGMask           = $('.bio__nav-bg--mask');

	// https://stackoverflow.com/questions/12931828/convert-returned-json-object-properties-to-lower-first-camelcase
	const transformToCamelCase = (obj) => {
	  if (!_.isObject(obj)) {
		return obj;
	  } else if (_.isArray(obj)) {
		return obj.map((v) => transformToCamelCase(v));
	  }
	  return _.reduce(obj, (r, v, k) => {
		return { 
		  ...r, 
		  [_.camelCase(k)]: transformToCamelCase(v) 
		};
	  }, {});
	}; 

	// @todo: make injectTemplates module
	// clean and prep the data object from 
	// to format we need 
	// content submitted via Netlify admin  
	var introDataObj = transformToCamelCase(introDataObjAsBEM);
	var introDataArray = introDataObj.introFragmentList;

	var paragraphFragments = introDataArray;
	var hoverImages = introDataArray;
	$('.js--hbs-inject--intro__paragraph-fragments')
		.html(paragraphFragmentsTemplate({ paragraphFragments }));

	$('.js--hbs-inject--intro__hover-image-collection')
		.html(hoverImagesCollectionTemplate({ hoverImages }));

	///////////////
	var bioDataObj = transformToCamelCase(bioDataObjAsBEM);
	var headshotImagesArray = bioDataObj.bioHeadshotImagesList;
	var headshotImages = headshotImagesArray;

	$(headshotCollectionTemplate({ headshotImages }))
		.appendTo(".js--hbs-inject--bio__headshot-collection");

	///////////////
	var artProjectsDataObj = transformToCamelCase(artProjectsDataObjAsBEM);
	var artProjectsImagesArray = artProjectsDataObj.artProjectsList;
	var artProjectsImages = artProjectsImagesArray;

	// insert in Glide on mount.before, otherwise Glide crashes for some reason

	///////////////
	$('.js--hbs-inject--arrow')
		.html(arrowPartial);

	$('.js--nav__item--previous').on('click', function(){
		fullpage_api.moveSectionUp();
	})

	$('.js--nav__item--next').on('click', function(){
		fullpage_api.moveSectionDown();
	})

	var gi;


	var fullPageInstance = new fullpage("#fullpage", {
		licenseKey: '',
		anchors: ['intro', 'bio', 'art-projects', 'what-is', 'professional-work'],
		recordHistory: true,
		scrollingSpeed: 600,
		slidesNavigation: true,
		scrollBar: false,
		navigation: false,

		// when arrived to a new section
		afterLoad: function(origin, destination, direction){
			var loadedSection = origin;

			// might be the first section, or a deep link arrival
			if(origin) {
				console.log('=========');
				console.log('afterLoad');
				console.log('origin.index: ', origin.index); 
				console.log('destination.index: ', destination.index); 
				console.log('direction: ', direction);
				console.log('=========');
			}
		},

		// before scroll animation begins
		onLeave: function(origin, destination, direction){
			var index = origin.index;
			var leavingSection = $(this);

			if (timelines.bioTl.isActive()) {
				console.log('bioTl active');
			}

			console.log('=========');
			console.log('onLeave');
			console.log('origin.index: ', origin.index); 
			console.log('destination.index: ', destination.index); 
			console.log('direction: ', direction);
			console.log('=========');


			// if leaving bio
			if(origin.anchor === "bio"){

				// if (timelines.bioTl.isActive()) {
				// 	console.log('bioTl active');
				// }
				timelines.bioTl.pause();
			}

			// entering bio
			if(destination.anchor === "bio"){
				console.log('entered bio section');
				timelines.revealHeadshot.play();

				// if (timelines.bioTl.isActive()) {
				// 	console.log('bioTl active');
				// }
			}

			if(destination.anchor === "art-projects"){

				// glideArt = initGlide(glideArt);
				initGlide(1); //all

				console.log(gi);

				// $('.js--projects__menu-toggle').on(
				// 	'click', 
				// 	{ gInstance: glideArt },
				// 	toggleProjects
				// );

				$('.js--projects__menu-toggle').on(
					'click', 
					toggleProjects
				)

			}
		},

		afterRender: function(){

			timelines.bioTl = makeBioTl();

			// needs to be declared after bioTl
			timelines.revealHeadshot = makeRevealHeadshot();

			// for project
			var inDuration = 0.125;
			var scale = 1.025;

			// make named function so we can pass it to jquery event handler
			var showIntroProject = function(e) {
				var $otherLinks = $(".intro__text-wrapper a").not(this);
				var $project = $(".js--project--" + $(e.target).data('introFragmentKey'));
				var t = new TimelineMax ({paused:true});
				
				t 
					.addLabel('beginPlay') 
					.to(
						$project, 
						inDuration,
						{ 
							autoAlpha: 1, 
							ease: Power1.easeIn, 
							scale: scale, 
							transformOrigin:"50% 50%" 
						},
						'beginPlay'
				    )
					.set(['.intro__text-wrapper p span', $otherLinks], { autoAlpha: 0 }, 'beginPlay'  )
					.set(".button--arrow-down", { autoAlpha: 0, ease: Elastic.easeInOut }, "beginPlay" )
					.play();
			};

			// make named function so we can pass it to jquery event handler
			var hideIntroProject = function(e) {
				var t = new TimelineMax ({paused:true});
				var $project = $(".js--project--" + $(e.target).data('introFragmentKey'));

				t 
					.addLabel('beginStop') 
					.to(
						$project, 
					  0.1,
					  { 
						autoAlpha: 0, 
						ease: Power0.easeNone, 
						scale: 1 
					  },
					  'beginStop'
				   )
					.set(['.intro__text-wrapper p span', ".intro__text-wrapper a"], { autoAlpha: 1 }, 'beginStop' )
					.play();
				
				TweenLite.to(".button--arrow-down", 0.1, { autoAlpha: 1 });
			};

			$(".js--intro-fragment-hover")
				.on('mouseenter', showIntroProject)
				.on('mouseleave', hideIntroProject);

			$( ".button--arrow-down" ).on( "click", function() {
				// console.log( $( this ).text() );
				fullpage_api.moveSectionDown();
			});

			$( ".js--nav__section-line-active--intro" ).on( "click", function() {
				// console.log( $( this ).text() );
				fullpage_api.moveSectionDown();
			});
		}
	});

	// function initGlide(glideInstance){
	function initGlide(which){
		// glideInstance = new Glide($('.js--glide')[0], projectCarouselOptions);
		gi = new Glide($('.js--glide')[0], projectCarouselOptions)

			// insert DOM here, otherwise Glide crashes for some reason
			// probably some timing thing where the DOM isnt there
			// yet before Glide initializes
			.on('mount.before', function() {
				// $('.glide__slide').addClass('.slide__bg-block'); 

				// if it's the first load, read all from disk
				if ($('.glide__slide').length === 0) {
					// load all projects
					$('.js--hbs-inject--art-projects__image-collection')
						.html(artProjectsCollectionTemplate({ artProjectsImages }));
				}
				
				else {
					$('.glide__slide').remove();
					$('.js--hbs-inject--art-projects__image-collection')
						.html(artProjectsCollectionTemplate({ artProjectsImages }));

					if(which === 1) {
						$('.art-project__type--2').remove();
					}

					else if (which === 2) {
						$('.art-project__type--1').remove();
					}

					else if (which === 3) {
						// do nothing, use all 
					}
				}
			})

			.on('build.after', function() {
				console.log("done building");
				// console.log("init slide index: ", glideInstance.index );
			})

			.on('run.before', function(direction) {
				// @todo: animate these out
				$('.slide__position-counter').remove();
  				TweenLite.to('.glide__slide--active', 0.25, { autoAlpha: 0.6});
				// console.log('leaving slide: ', glideInstance.index);
				// console.log('direction: ', direction);

				// do this here so there's no delay perception when moving slides
				if (direction.direction === ">") {
					// glideInstance.index + 1;
					// var el = 
  					TweenLite.to($( ".glide__slide--active" ).next(), 0.05, { autoAlpha: 1});
				}

				else if (direction.direction === "<") {
					// glideInstance.index - 1;
  					TweenLite.to($( ".glide__slide--active" ).prev(), 0.05, { autoAlpha: 1});
				}
			})

			.on('run.after', function() {
				// console.log('glide:move.after');
				// console.log($('.glide__slide--active'));
				// console.log(glideInstance.index);
				var string = 
				`
					<div class='slide__position-counter'>
						<span class="slide__position-number">` + ( gi.index + 1 ) +  `</span>
						<span class="slide__position-number"> / </span>
						<span class="slide__position-number">` + $('.glide__slide').length + `</span>
					</div>
				// `;
			  	$(string).appendTo('.glide__slide--active')

			 
			})

			.mount();

 		var tl = new TimelineMax();
		tl
			.addLabel('beginPlay') 

			.staggerTo(
				".glide__slide", 
				0.15, 
				{ 
					autoAlpha: 0.6, 
					// clipPath: squareClipPath,
					ease: Expo.easeOut
					// ease: Quint.easeOut 
				},
				0.075,
				'beginPlay+=1'
			)

				.to('.slide__position-counter', 0.1, { autoAlpha: 1});

		// return glideInstance;
		// return glideInstance;
	};

	function makeRevealHeadshot(){
		var tl = new TimelineMax ({ paused: true });
		tl
			.addLabel('begin')
			.set($bioTextMask, { width: 500})

			// .to(".nav", 0.5, { className: "+=nav--on-light" }, "begin+=0.01")
			.to(
				[ $headshotMaskBox ],
				0.7, 
				{ 
					scaleX: 0, 
					ease: Power4.easeIn 
				},
				"begin+=0.15"
			)

			.to(
				[ $headshotImage ] ,
				0.5, 
				{ 
					autoAlpha: 1,
					ease: Power4.easeIn 
				}, 
				"begin+=0.075"
			)

			.addLabel('beginText')
			.to(
				[ $bioTextMask ],
				0.6, 
				{ 
					scaleX: 0, 
					// autoAlpha: 0, 
					ease: Power4.easeInOut
				}, 
				"begin+=0.075"
			)

			.to(
				[ $bioText ],
				1.5, 
				{ 
					autoAlpha: 1, 
					ease: Power4.easeInOut 
				}, 
				"begin+=0.1"
			)

			.to(
				[ $bioNavBGMask ],
				0.8, 
				{ 
					scaleX: 0, 
					ease: Power4.easeInOut 
				}, 
				"begin+=.175"
			)

			.to(
				[ ".bio__tab-border" ],
				0.3, 
				{ 
					scaleY: 1, 
					ease: Expo.easeIn
					// width: 3 
				}, 
				"begin+=0.7 "
			)

			.add(timelines.bioTl.play(), "begin+=1.5" )

			.to(
				[ ".button--resume-pdf" ],
				0.75, 
				{ 
					scaleY: 1, 
					ease: Elastic.easeOut.config(1, 0.3), 
					height: "11.5rem"
					// width: 3 
				}, 
				"begin+=1"
			)
			// .to(
			//  [ $headshotMaskColor ],
			//  2, 
			//  { 
			//      autoAlpha: 0, 
			//      ease: Power4.easeOut 
			//  },
			//  "beginText-=0.1"
			// )

			// .timeScale( .2 )

		return tl;
	};
		


	function makeBioTl(){

	    function doOnComplete(tween) {
	      console.log('tween start: ', tween.target.innerHTML);
	      var previous = $(tween.target).prev();
	      console.log('previous: ', previous);
			// TweenLite.set(element)

	      // var tl = new TimelineMax();
	      // tl.to(
	      //   previous, 
	      //   0.5, 
	      //   { 
	      //     opacity: 0, 
	      //     ease: Power4.easeOut,
	      //     autoAlpha: 0
	      //   })
	    }

		var fadeDuration = 2;
		var $bioImages = $(".headshot__image");

		var tl = new TimelineMax({ 
	        onComplete: doOnComplete, 
	        onCompleteParams:[ "{self}" ],
			paused: true,
			repeat: -1
		});

		$bioImages.each(function(index, element) {
			// assign indexes
		     $(element).css('z-index', $(".headshot__image").length - index);

			tl.to(
				element, 
				fadeDuration, 
				{
					autoAlpha: 0,
					ease: Power3.EaseIn,
					delay: 2.5
				}
			)
		
		});
	
		return tl;
	};

	function toggleProjects() {

		// glideI.disable();
		// glideI.destroy();
		gi.destroy();

		$('.art-project__type--2').remove();

		// glideI.update(projectCarouselOptions);
		// glideI.enable();

		$('.glide__slide').removeAttr("style");
		$('.glide__slides').removeAttr("style");
		$('.js--glide').removeClass('glide--swipeable');
		$('.slide__position-counter').remove();

		gi = null;
		// event.data.gInstance = null;
		// console.log(glideI);
		// console.log(glideArt2);
		// console.log(event.data.gInstance);

		// glideArt2 = initGlide(glideArt2);
		initGlide(1);

		// var tl = new TimelineMax();
		// tl
		// 	.addLabel('beginPlay') 

		// 	.staggerTo(
		// 		".glide__slide", 
		// 		0.15, 
		// 		{ 
		// 			autoAlpha: 0.6, 
		// 			// clipPath: squareClipPath,
		// 			ease: Expo.easeOut
		// 			// ease: Quint.easeOut 
		// 		},
		// 		0.075,
		// 		'beginPlay+=1'
		// 	)

		// 			// var b = new Glide($('.js--glide')[0], projectCarouselOptions)
		// 			// initGlide(glideArt2);
	};

}());


