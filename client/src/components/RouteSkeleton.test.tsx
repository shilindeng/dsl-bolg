import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RouteSkeleton from './RouteSkeleton';

describe('RouteSkeleton', () => {
    it('renders the article variant', () => {
        render(<RouteSkeleton variant="article" />);
        expect(screen.getByTestId('article-skeleton')).toBeInTheDocument();
    });

    it('renders a grid skeleton with the requested card count', () => {
        render(<RouteSkeleton variant="grid" cards={5} />);
        expect(screen.getByTestId('grid-skeleton').children).toHaveLength(5);
    });
});
