import React from 'react';
import clsx from 'clsx';

const Card = ({ children, className, ...props }) => {
    return (
        <div
            className={clsx(
                "bg-white rounded-xl border border-slate-200 shadow-sm p-6 w-full",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
