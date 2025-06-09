"use client";

import { ReactNode } from 'react';
import { useScrollNavigation } from '@/hooks/useScrollNavigation';
import OverScrollIndicator from './OverScrollIndicator';

interface ScrollableLayoutProps {
  children: ReactNode;
}

const ScrollableLayout = ({ children }: ScrollableLayoutProps) => {
  const { overScrollState, nextSection, previousSection } = useScrollNavigation();

  const targetSection = overScrollState.direction === 'up' ? previousSection : nextSection;

  return (
    <div className="relative min-h-screen">
      {children}
      <OverScrollIndicator 
        isVisible={overScrollState.isVisible}
        progress={overScrollState.progress}
        direction={overScrollState.direction}
        targetSectionName={targetSection}
      />
    </div>
  );
};

export default ScrollableLayout;