import React from 'react';

/**
 * Skeleton loader components for better perceived performance
 * Use these while loading data to provide visual feedback
 */

export const SkeletonCard = ({ className = '' }) => (
    <div className={`skeleton-card ${className}`}>
        <div className="skeleton-header">
            <div className="skeleton-title"></div>
            <div className="skeleton-subtitle"></div>
        </div>
        <div className="skeleton-content">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
        </div>
    </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
    <div className="skeleton-table">
        <div className="skeleton-table-header">
            {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="skeleton-column-header"></div>
            ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="skeleton-table-row">
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <div key={colIndex} className="skeleton-cell"></div>
                ))}
            </div>
        ))}
    </div>
);

export const SkeletonList = ({ items = 5 }) => (
    <div className="skeleton-list">
        {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="skeleton-list-item">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-list-content">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                </div>
            </div>
        ))}
    </div>
);

export const SkeletonChart = () => (
    <div className="skeleton-chart">
        <div className="skeleton-chart-bars">
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton-bar"
                    style={{ height: `${Math.random() * 70 + 30}%` }}
                ></div>
            ))}
        </div>
        <div className="skeleton-chart-axis"></div>
    </div>
);

export const SkeletonMetric = () => (
    <div className="skeleton-metric">
        <div className="skeleton-metric-value"></div>
        <div className="skeleton-metric-label"></div>
    </div>
);

export const SkeletonGrid = ({ items = 6, columns = 3 }) => (
    <div className="skeleton-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: items }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

// Add to your global CSS or index.css
export const skeletonStyles = `
/* Skeleton Loader Styles */
@keyframes skeleton-loading {
    0% {
        background-position: -200px 0;
    }
    100% {
        background-position: calc(200px + 100%) 0;
    }
}

.skeleton-card,
.skeleton-line,
.skeleton-title,
.skeleton-subtitle,
.skeleton-column-header,
.skeleton-cell,
.skeleton-avatar,
.skeleton-bar,
.skeleton-metric-value,
.skeleton-metric-label {
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 0px,
        rgba(255, 255, 255, 0.15) 40px,
        rgba(255, 255, 255, 0.05) 80px
    );
    background-size: 200px 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
    border-radius: 4px;
}

.skeleton-card {
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
}

.skeleton-header {
    margin-bottom: 1rem;
}

.skeleton-title {
    height: 24px;
    width: 60%;
    margin-bottom: 0.5rem;
}

.skeleton-subtitle {
    height: 16px;
    width: 40%;
}

.skeleton-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.skeleton-line {
    height: 16px;
    width: 100%;
}

.skeleton-line.short {
    width: 70%;
}

.skeleton-table {
    width: 100%;
    border-radius: 0.5rem;
    overflow: hidden;
}

.skeleton-table-header,
.skeleton-table-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.skeleton-column-header {
    height: 16px;
}

.skeleton-cell {
    height: 14px;
}

.skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.skeleton-list-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 0.5rem;
}

.skeleton-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    flex-shrink: 0;
}

.skeleton-list-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.skeleton-chart {
    height: 300px;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
}

.skeleton-chart-bars {
    flex: 1;
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding-bottom: 1rem;
}

.skeleton-bar {
    flex: 1;
    min-height: 30%;
    border-radius: 4px 4px 0 0;
}

.skeleton-chart-axis {
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
}

.skeleton-metric {
    text-align: center;
    padding: 1.5rem;
}

.skeleton-metric-value {
    height: 48px;
    width: 120px;
    margin: 0 auto 1rem;
}

.skeleton-metric-label {
    height: 16px;
    width: 80px;
    margin: 0 auto;
}

.skeleton-grid {
    display: grid;
    gap: 1.5rem;
}

/* Light theme adjustments */
@media (prefers-color-scheme: light) {
    .skeleton-card,
    .skeleton-line,
    .skeleton-title,
    .skeleton-subtitle,
    .skeleton-column-header,
    .skeleton-cell,
    .skeleton-avatar,
    .skeleton-bar,
    .skeleton-metric-value,
    .skeleton-metric-label {
        background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.03) 0px,
            rgba(0, 0, 0, 0.08) 40px,
            rgba(0, 0, 0, 0.03) 80px
        );
    }
    
    .skeleton-card,
    .skeleton-list-item,
    .skeleton-chart {
        background: rgba(0, 0, 0, 0.02);
        border-color: rgba(0, 0, 0, 0.05);
    }
}
`;

export default {
    SkeletonCard,
    SkeletonTable,
    SkeletonList,
    SkeletonChart,
    SkeletonMetric,
    SkeletonGrid,
};
