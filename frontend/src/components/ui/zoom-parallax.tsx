'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import React, { useRef } from 'react';

export interface ImageItem {
	src: string;
	alt?: string;
}

export interface ZoomParallaxProps {
	/** Array of images to be displayed in the parallax effect max 7 images */
	images: ImageItem[];
	/** Height of the scroll track. Defaults to a snappy '160vh' to eliminate scrolling gaps */
	containerHeight?: string;
}

export function ZoomParallax({ images, containerHeight = '160vh' }: ZoomParallaxProps) {
	const container = useRef<HTMLDivElement | null>(null);
	const { scrollYProgress } = useScroll({
		target: container,
		offset: ['start start', 'end end'],
	});

	// Progressive scale curves that expand outward without clumping
	const scale4 = useTransform(scrollYProgress, [0, 1], [1, 3.4]);
	const scale5 = useTransform(scrollYProgress, [0, 1], [1, 4.0]);
	const scale6 = useTransform(scrollYProgress, [0, 1], [1, 4.6]);
	const scale8 = useTransform(scrollYProgress, [0, 1], [1, 5.2]);
	const scale9 = useTransform(scrollYProgress, [0, 1], [1, 5.8]);

	const outerOpacity = useTransform(scrollYProgress, [0, 0.7, 0.98], [1, 0.9, 0.05]);

	const scales = [scale4, scale5, scale6, scale5, scale6, scale8, scale9];

	return (
		<div
			ref={container}
			style={{ height: containerHeight }}
			className="relative zoom-parallax-container"
		>
			<div className="sticky top-0 h-screen overflow-hidden zoom-parallax-sticky">
				{/* Ambient radial spotlight */}
				<div className="zoom-parallax-ambient-spotlight" aria-hidden="true" />

				{images.map(({ src, alt }, index) => {
					const scale = scales[index % scales.length];
					const isCenter = index === 0;

					return (
						<motion.div
							key={index}
							data-index={index}
							style={{
								scale,
								opacity: isCenter ? 1 : outerOpacity,
							}}
							className={`absolute top-0 flex h-full w-full items-center justify-center zoom-parallax-layer zoom-parallax-item-${index} ${index === 1 ? '[&>div]:!-top-[35vh] [&>div]:!left-[8vw] [&>div]:!h-[24vh] [&>div]:!w-[30vw]' : ''} ${index === 2 ? '[&>div]:!-top-[6vh] [&>div]:!-left-[32vw] [&>div]:!h-[36vh] [&>div]:!w-[18vw]' : ''} ${index === 3 ? '[&>div]:!top-[2vh] [&>div]:!left-[32vw] [&>div]:!h-[24vh] [&>div]:!w-[24vw]' : ''} ${index === 4 ? '[&>div]:!top-[34vh] [&>div]:!left-[6vw] [&>div]:!h-[22vh] [&>div]:!w-[22vw]' : ''} ${index === 5 ? '[&>div]:!top-[34vh] [&>div]:!-left-[30vw] [&>div]:!h-[22vh] [&>div]:!w-[24vw]' : ''} ${index === 6 ? '[&>div]:!top-[32vh] [&>div]:!left-[34vw] [&>div]:!h-[18vh] [&>div]:!w-[18vw]' : ''} `}
						>
							<div
								className={`relative zoom-parallax-box ${isCenter ? 'zoom-parallax-center-box' : ''}`}
							>
								<img
									src={src || '/placeholder.svg'}
									alt={alt || `Parallax image ${index + 1}`}
									className="h-full w-full object-cover zoom-parallax-img"
									loading="eager"
								/>
							</div>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}

export default ZoomParallax;
