'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import Lenis from '@studio-freight/lenis';
import { ZoomParallax } from "@/components/ui/zoom-parallax";

export default function DefaultDemo() {
	React.useEffect(() => {
		const lenis = new Lenis();
		let rafId: number;

		function raf(time: number) {
			lenis.raf(time);
			rafId = requestAnimationFrame(raf);
		}

		rafId = requestAnimationFrame(raf);

		return () => {
			cancelAnimationFrame(rafId);
			lenis.destroy();
		};
	}, []);

	const images = [
		{
			src: 'https://cdn.21st.dev/assets/mirror/de/de2a384dfac96d1a31a641ba6667c56747b8138ba0f4e633dbea0e7051311479.jpg',
			alt: 'Modern architecture building',
		},
		{
			src: 'https://cdn.21st.dev/assets/mirror/bb/bbc200e370140ed6d4bc9dfd7b9de0957419ee0facd61f8698ed0e14281b13f5.jpg',
			alt: 'Urban cityscape at sunset',
		},
		{
			src: 'https://cdn.21st.dev/assets/mirror/96/9624bda260e246bd41ab7d26ac6d8e3ad427c62cb1bed10fe22f0aca7bd727c6.jpg',
			alt: 'Abstract geometric pattern',
		},
		{
			src: 'https://cdn.21st.dev/assets/mirror/e0/e09b97c0849e748eb1d19a8d23e341835806a6a384540bfd4f7ce88f97b97b51.jpg',
			alt: 'Mountain landscape',
		},
		{
			src: 'https://cdn.21st.dev/assets/mirror/28/28ab2843d2f3bb3b8439f0c198d9846be80044955263bff6ac49d89691dad55d.jpg',
			alt: 'Minimalist design elements',
		},
		{
			src: 'https://cdn.21st.dev/assets/mirror/96/96e261f67a4f180e273ca711f7b86abe72dd0fdc84dd75d9322b2d79baac46f0.jpg',
			alt: 'Ocean waves and beach',
		},
		{
			src: 'https://cdn.21st.dev/assets/mirror/85/8590b403bb542a124c7de796e9ecf5da86509818f2969e4d94af8c440953a852.jpg',
			alt: 'Forest trees and sunlight',
		},
	];

	return (
		<main className="min-h-screen w-full">
			<div className="relative flex h-[50vh] items-center justify-center">
				{/* Radial spotlight */}
				<div
					aria-hidden="true"
					className={cn(
						'pointer-events-none absolute -top-1/2 left-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 rounded-full',
						'bg-[radial-gradient(ellipse_at_center,--theme(--color-foreground/.1),transparent_50%)]',
						'blur-[30px]',
					)}
				/>
				<h1 className="text-center text-4xl font-bold">
					Scroll Down for Zoom Parallax
				</h1>
			</div>
			<ZoomParallax images={images} />
			<div className="h-[50vh]"/>
		</main>
	);
}
