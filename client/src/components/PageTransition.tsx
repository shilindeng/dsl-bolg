import type { ReactNode } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';

interface PageTransitionProps {
    children: ReactNode;
    routeKey: string;
}

export default function PageTransition({ children, routeKey }: PageTransitionProps) {
    const reduceMotion = useReducedMotion();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <m.div
                key={routeKey}
                className="page-transition-shell"
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: 'blur(10px)' }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -14, filter: 'blur(8px)' }}
                transition={{
                    duration: reduceMotion ? 0 : 0.32,
                    ease: [0.16, 1, 0.3, 1],
                }}
            >
                {children}
            </m.div>
        </AnimatePresence>
    );
}
