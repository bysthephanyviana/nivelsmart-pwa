import React from 'react';
import clsx from 'clsx';

const VARIANTS = {
    success: "bg-teal-50 text-status-success border-teal-100",
    warning: "bg-amber-50 text-status-warning border-amber-100",
    error: "bg-red-50 text-status-danger border-red-100",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
    brand: "bg-brand-50 text-brand-600 border-brand-100",
};

const Badge = ({ children, variant = 'neutral', className }) => {
    return (
        <span
            className={clsx(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                VARIANTS[variant],
                className
            )}
        >
            {children}
        </span>
    );
};

export default Badge;
