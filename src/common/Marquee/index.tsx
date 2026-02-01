import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/helper';

interface MarqueeProps {
    children: ReactNode;
    className?: string;
    speed?: number; // seconds for one full loop
}

const Marquee = ({ children, className, speed = 20 }: MarqueeProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && contentRef.current) {
                // If content is wider than container, animate it
                setShouldAnimate(contentRef.current.scrollWidth > containerRef.current.clientWidth);
            }
        };

        // Small timeout to ensure rendering is done
        const timer = setTimeout(checkOverflow, 100);

        window.addEventListener('resize', checkOverflow);
        return () => {
            window.removeEventListener('resize', checkOverflow);
            clearTimeout(timer);
        };
    }, [children]);

    if (!shouldAnimate) {
        return (
            <div
                ref={containerRef}
                className={cn("overflow-hidden whitespace-nowrap w-full", className)}
            >
                <div ref={contentRef} className="inline-block max-w-full truncate">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn("overflow-hidden whitespace-nowrap relative group w-full masking-fade", className)}
            style={{
                maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
            }}
        >
            <div
                className="flex animate-marquee group-hover:pause min-w-full w-max"
                style={{ '--marquee-duration': `${speed}s` } as React.CSSProperties}
            >
                <div ref={contentRef} className="flex items-center pr-12">{children}</div>
                <div className="flex items-center pr-12">{children}</div> {/* Duplicate for seamless loop */}
            </div>
        </div>
    );
};

export default Marquee;
