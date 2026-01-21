import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  TrendingUp,
  Lightbulb,
  Target,
  Rocket,
  List,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move
} from 'lucide-react';
import { theoreticalSlides, sectionOrder } from '../lib/theoreticalSlides';

// Section icons mapping
const sectionIcons: Record<string, typeof FileText> = {
  'The Problem': FileText,
  'What is IDP': Lightbulb,
  'Business Impact': TrendingUp,
  'Applications': Target,
  'Next Steps': Rocket,
};

// Interactive SVG Viewer with pan/zoom
function InteractiveSvgViewer({ src, title }: { src: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const zoomIn = () => setScale(prev => Math.min(3, prev + 0.25));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25));

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      resetView();
    }
  };

  const viewerContent = (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-slate-900 rounded-xl ${
        isFullscreen ? 'fixed inset-4 z-[10200]' : 'w-full h-full'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* SVG Container */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        <object
          data={src}
          type="image/svg+xml"
          className="w-full h-full"
          aria-label={title}
        >
          <img src={src} alt={title} className="w-full h-full object-contain" />
        </object>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
        <button
          onClick={(e) => { e.stopPropagation(); zoomOut(); }}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-white" />
        </button>
        <span className="text-white text-xs font-mono min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); zoomIn(); }}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-white" />
        </button>
        <div className="w-px h-4 bg-white/30 mx-1" />
        <button
          onClick={(e) => { e.stopPropagation(); resetView(); }}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          title="Reset View"
        >
          <Move className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Fullscreen close button */}
      {isFullscreen && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Hint */}
      <div className="absolute top-4 left-4 text-white/50 text-xs" style={{ fontFamily: 'var(--font-body)' }}>
        Scroll to zoom • Drag to pan
      </div>
    </div>
  );

  return (
    <>
      {viewerContent}
      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/80 z-[10199]"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </>
  );
}

interface TheoryPresentationProps {
  embedded?: boolean;
  onClose?: () => void;
}

export function TheoryPresentation({ embedded: _embedded = false, onClose }: TheoryPresentationProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTOC, setShowTOC] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);

  const currentSlide = theoreticalSlides[currentIndex];
  const totalSlides = theoreticalSlides.length;

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  }, [onClose, navigate]);

  const goToNext = useCallback(() => {
    if (currentIndex < totalSlides - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, totalSlides]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'Escape') {
        if (showTOC) {
          setShowTOC(false);
        } else {
          handleClose();
        }
      } else if (e.key === 't' || e.key === 'T') {
        setShowTOC(prev => !prev);
      } else if (e.key === ' ' && !isPeeking) {
        e.preventDefault();
        setIsPeeking(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && isPeeking) {
        e.preventDefault();
        setIsPeeking(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentIndex, handleClose, goToNext, goToPrev, showTOC, isPeeking]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setShowTOC(false);
  };

  // Get section progress
  const currentSection = currentSlide.section;
  const sectionSlides = theoreticalSlides.filter(s => s.section === currentSection);
  const sectionIndex = sectionSlides.findIndex(s => s.id === currentSlide.id);

  // Check if this slide has an interactive SVG
  const hasInteractiveSvg = !!currentSlide.interactiveSvg;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-700">
      {/* Light beige backdrop with grain texture - matches InfoOverlay exactly */}
      <div
        className="absolute inset-0 backdrop-blur-lg transition-all duration-700 ease-out"
        style={{
          backgroundColor: 'rgba(245, 242, 237, 0.85)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
          maskImage: isPeeking
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.3) 100%)'
            : 'none',
          WebkitMaskImage: isPeeking
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.3) 100%)'
            : 'none',
          backdropFilter: isPeeking ? 'blur(2px)' : 'blur(16px)',
        }}
      />

      {/* Dismiss button - top left */}
      <button
        onClick={handleClose}
        className="absolute top-8 left-8 z-[10000] w-12 h-12 rounded-full bg-gray-800/10 hover:bg-gray-800/20 transition-all duration-700 ease-out flex items-center justify-center"
        style={{
          opacity: isPeeking ? 0 : 1,
          transform: isPeeking ? 'scale(0.8)' : 'scale(1)',
        }}
        title="Close (Esc)"
      >
        <X className="w-5 h-5 text-gray-800/70" />
      </button>

      {/* TOC and section indicator - top right */}
      <div
        className="absolute top-8 right-8 z-[10000] flex items-center gap-4 transition-all duration-700 ease-out"
        style={{
          opacity: isPeeking ? 0 : 1,
          transform: isPeeking ? 'scale(0.8)' : 'scale(1)',
        }}
      >
        {/* Section indicator */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/10">
          {(() => {
            const Icon = sectionIcons[currentSection] || FileText;
            return <Icon className="w-4 h-4 text-gray-700" />;
          })()}
          <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'var(--font-body)' }}>
            {currentSection}
          </span>
          <span className="text-xs text-gray-500">
            ({sectionIndex + 1}/{sectionSlides.length})
          </span>
        </div>

        {/* TOC button */}
        <button
          onClick={() => setShowTOC(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-800/10 hover:bg-gray-800/20 transition-colors text-gray-700 text-sm"
          title="Table of Contents (T)"
        >
          <List className="w-4 h-4" />
          <span style={{ fontFamily: 'var(--font-body)' }}>Contents</span>
        </button>
      </div>

      {/* Peek through hint - bottom center */}
      {!isPeeking && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in duration-500 delay-1000">
          <div className="px-3 py-1.5 rounded-lg bg-gray-800/30 backdrop-blur-sm text-white/40 text-xs flex items-center gap-1.5" style={{ fontFamily: 'var(--font-body)' }}>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">SPACE</kbd>
            <span className="text-[10px]">peek</span>
            <span className="mx-1 text-white/20">|</span>
            <span className="text-[10px]">{currentIndex + 1} / {totalSlides}</span>
          </div>
        </div>
      )}

      {/* Previous slide button - left edge */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrev}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-[10000] w-14 h-14 rounded-full bg-gray-800/10 hover:bg-gray-800/20 transition-all flex items-center justify-center"
          style={{ opacity: isPeeking ? 0 : 1 }}
          title="Previous (←)"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800/70" />
        </button>
      )}

      {/* Next slide button - right edge */}
      {currentIndex < totalSlides - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-[10000] w-14 h-14 rounded-full bg-gray-800/10 hover:bg-gray-800/20 transition-all flex items-center justify-center"
          style={{ opacity: isPeeking ? 0 : 1 }}
          title="Next (→)"
        >
          <ChevronRight className="w-6 h-6 text-gray-800/70" />
        </button>
      )}

      {/* Two-column layout - matches InfoOverlay exactly */}
      <div
        className={`relative z-10 w-full h-full flex transition-all duration-700 ease-out ${
          currentSlide.imageOnLeft ? 'flex-row-reverse' : ''
        }`}
        style={{
          opacity: isPeeking ? 0 : 1,
          transform: isPeeking ? 'scale(0.95)' : 'scale(1)',
          pointerEvents: isPeeking ? 'none' : 'auto',
        }}
      >
        {/* Text column - narrower when there's an interactive SVG */}
        <div className={`${hasInteractiveSvg ? 'w-1/2' : 'w-2/3'} pr-12 pt-32 pb-16 flex flex-col justify-center overflow-y-auto ${
          currentSlide.imageOnLeft ? 'pr-24 pl-12' : 'pl-24'
        }`}>
          {/* Subtitle - uppercase tracking */}
          <p
            className="text-sm tracking-[0.15em] uppercase text-gray-500 mb-4"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {currentSlide.subtitle}
          </p>

          {/* Title */}
          <h1
            className={`font-semibold text-gray-900 tracking-tight mb-6 leading-[1.1] ${
              hasInteractiveSvg ? 'text-4xl' : 'text-5xl'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {currentSlide.title}
          </h1>

          {/* Headline/Description */}
          {currentSlide.content.headline && (
            <p
              className={`text-gray-700 leading-relaxed mb-6 ${hasInteractiveSvg ? 'text-base' : 'text-lg'}`}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}
            >
              {currentSlide.content.headline}
            </p>
          )}

          {/* Stats grid - only show if not an SVG slide (they take up space) */}
          {!hasInteractiveSvg && currentSlide.content.stats && currentSlide.content.stats.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              {currentSlide.content.stats.map((stat, idx) => (
                <div key={idx} className="bg-gray-100/80 rounded-xl p-4 border border-gray-200/50">
                  <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-body)' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Bullet points */}
          {currentSlide.content.bullets && currentSlide.content.bullets.length > 0 && (
            <ul className={`space-y-2 mb-6 ${hasInteractiveSvg ? 'text-sm' : ''}`}>
              {currentSlide.content.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-700" style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Quote - styled like key insight */}
          {currentSlide.content.quote && (
            <div className="border-l-2 border-gray-300 pl-4 mb-6">
              <p
                className={`text-gray-600 italic ${hasInteractiveSvg ? 'text-sm' : 'text-base'}`}
                style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}
              >
                "{currentSlide.content.quote.text}"
              </p>
              <p className="text-sm text-gray-500 mt-2" style={{ fontFamily: 'var(--font-body)' }}>
                — {currentSlide.content.quote.attribution}
              </p>
            </div>
          )}

          {/* Section dots navigation - bottom of text column */}
          <div className="flex items-center gap-2 mt-auto pt-8">
            {sectionOrder.map((section) => {
              const isCurrentSection = section === currentSection;
              const sectionStartIdx = theoreticalSlides.findIndex(s => s.section === section);
              return (
                <button
                  key={section}
                  onClick={() => goToSlide(sectionStartIdx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isCurrentSection
                      ? 'bg-gray-800 scale-125'
                      : 'bg-gray-400/50 hover:bg-gray-500'
                  }`}
                  title={section}
                />
              );
            })}
          </div>

          {/* "Hands-on Use Cases" button - only on last slide */}
          {currentIndex === totalSlides - 1 && (
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span>Hands-on Use Cases</span>
              <svg
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-gradient-to-b from-transparent via-gray-300/60 to-transparent my-16" />

        {/* Image/SVG area column - wider when there's an interactive SVG */}
        <div className={`${hasInteractiveSvg ? 'w-1/2' : 'w-1/3'} relative flex flex-col p-4`}>
          {hasInteractiveSvg ? (
            // Interactive SVG viewer
            <div className="absolute inset-4 rounded-xl overflow-hidden shadow-2xl">
              <InteractiveSvgViewer
                src={currentSlide.interactiveSvg!}
                title={currentSlide.title}
              />
            </div>
          ) : currentSlide.imagePath ? (
            // Regular image
            <div className="absolute inset-0 overflow-hidden">
              <img
                key={currentSlide.imagePath}
                src={currentSlide.imagePath}
                alt={currentSlide.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            // Placeholder
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gray-200/50 flex items-center justify-center">
                  {(() => {
                    const Icon = sectionIcons[currentSection] || FileText;
                    return <Icon className="w-12 h-12 text-gray-400" />;
                  })()}
                </div>
                <p className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
                  {currentSlide.id}.png
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table of Contents Modal */}
      {showTOC && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10100] flex items-center justify-center p-8"
          onClick={() => setShowTOC(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                Table of Contents
              </h2>
              <button
                onClick={() => setShowTOC(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {sectionOrder.map((section) => {
                const Icon = sectionIcons[section] || FileText;
                const slides = theoreticalSlides.filter(s => s.section === section);
                const firstSlideIndex = theoreticalSlides.findIndex(s => s.section === section);

                return (
                  <div key={section} className="mb-6">
                    <button
                      onClick={() => goToSlide(firstSlideIndex)}
                      className="flex items-center gap-3 mb-3 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <Icon className="w-4 h-4 text-gray-600" />
                      </div>
                      <span
                        className="text-gray-900 font-semibold group-hover:text-gray-600 transition-colors"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {section}
                      </span>
                    </button>

                    <div className="ml-11 space-y-1">
                      {slides.map((slide) => {
                        const globalIdx = theoreticalSlides.findIndex(s => s.id === slide.id);
                        const isActive = globalIdx === currentIndex;

                        return (
                          <button
                            key={slide.id}
                            onClick={() => goToSlide(globalIdx)}
                            className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                            style={{ fontFamily: 'var(--font-body)' }}
                          >
                            <span className="text-xs text-gray-400 mr-2">{globalIdx + 1}.</span>
                            {slide.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
